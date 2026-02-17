'use server'

import { createClient } from '@/utils/supabase/server'

export interface EnforcementResult {
    valid: boolean
    session?: any
    message?: string
}

export async function checkPlate(plate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { valid: false, message: 'Not authenticated' }
    if (!plate) return { valid: false, message: 'Plate number required' }

    // Normalize plate
    const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')

    // 1. Determine User Access
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    let propertyIds: string[] | null = null

    if (profile?.role === 'admin') {
        propertyIds = null
    } else if (profile?.role === 'property_owner') {
        if (!profile.organization_id) return { valid: false, message: 'No organization assigned' }
        const { data: props } = await supabase.from('properties').select('id').eq('organization_id', profile.organization_id)
        propertyIds = props?.map(p => p.id) || []
    } else if (profile?.role === 'staff') {
        const { data: assignments } = await supabase.from('property_members').select('property_id').eq('user_id', user.id)
        propertyIds = assignments?.map(a => a.property_id) || []
    } else {
        return { valid: false, message: 'Unauthorized' }
    }

    if (propertyIds !== null && propertyIds.length === 0) {
        return { valid: false, message: 'No assigned properties' }
    }

    // 2. Search for Active Session
    let query = supabase
        .from('sessions')
        .select(`
            *,
            properties (name, timezone)
        `)
        .eq('status', 'ACTIVE')
        .ilike('vehicle_plate', normalizedPlate) // Use ilike for case-insensitive match, though we normalized

    if (propertyIds !== null) {
        query = query.in('property_id', propertyIds)
    }

    // We want to find *any* active session.
    // If multiple (e.g. somehow valid in 2 spots?), take the latest end_time?
    // Parking systems usually prevent multiple active sessions for same plate in same property/zone, 
    // but might be possible across properties.
    // We should return all or the "best" one.
    // For enforcement, if ANY valid session exists for the properties being checked, it's valid.

    const { data: sessions, error } = await query

    if (error) {
        console.error('Check plate error:', error)
        return { valid: false, message: 'Error checking plate' }
    }

    if (sessions && sessions.length > 0) {
        // Found active session(s)
        // Check if expired? active status usually implies not expired, but let's be sure based on end_time vs now?
        // Current 'ACTIVE' status management should handle expiration (webhooks or cron).
        // But for safety, check end_time > now.

        const now = new Date()
        const validSession = sessions.find((s: any) => new Date(s.end_time_current) > now)

        if (validSession) {
            return {
                valid: true,
                session: validSession,
                message: 'Valid active session found'
            }
        } else {
            return { valid: false, message: 'Session found but expired' }
        }
    }

    return { valid: false, message: 'No active session found' }
}

export interface EnforcementFilter {
    plate?: string
    spot?: string
    propertyId?: string
    hoursAgo?: number | null // null means all time? or ignore? Let's use specific values.
    status?: 'all' | 'active' | 'expired'
}

export async function getEnforcementData(filters: EnforcementFilter = {}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { sessions: [], error: 'Not authenticated' }

    // 1. Determine User Access (reuse logic or similar to checkPlate)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    let propertyIds: string[] | null = null

    if (profile?.role === 'admin') {
        propertyIds = null
    } else if (profile?.role === 'property_owner') {
        if (!profile.organization_id) return { sessions: [], error: 'No organization assigned' }
        const { data: props } = await supabase.from('properties').select('id').eq('organization_id', profile.organization_id)
        propertyIds = props?.map(p => p.id) || []
    } else if (profile?.role === 'staff') {
        const { data: assignments } = await supabase.from('property_members').select('property_id').eq('user_id', user.id)
        propertyIds = assignments?.map(a => a.property_id) || []
    } else {
        return { sessions: [], error: 'Unauthorized' }
    }

    if (propertyIds !== null && propertyIds.length === 0) {
        return { sessions: [], error: 'No assigned properties' }
    }

    // 2. Build Query
    let query = supabase
        .from('sessions')
        .select(`
            *,
            properties (name, timezone),
            parking_units (name)
        `)
        .order('end_time_current', { ascending: false })

    // Apply Filters
    const now = new Date().toISOString()
    const hoursFilter = filters.hoursAgo !== undefined ? filters.hoursAgo : 24

    // Status Filter Logic
    if (filters.status === 'active') {
        // Active AND Not Expired based on time
        query = query.eq('status', 'ACTIVE').gt('end_time_current', now)
    } else if (filters.status === 'expired') {
        // Expired based on time (regardless of status, or maybe just checks time?)
        // The user said "Expired would also include parking sessions that have ended. This should be based on the expiration time."
        // So anything with end_time_current <= now.
        // But we should also respect the time filter if provided, to avoid showing years old expired sessions?
        // Yes, time filter logic below handles the "lookback" period.
        // So here we just enforce the "expired" state.
        query = query.lte('end_time_current', now)
    } else {
        // 'all'
        // Show everything subject to time filter below.
    }

    // Apply Time Filter (always applies unless specific logic overrides it, but here it fits well)
    // For 'active' status, we might not want to limit by time (if it's active but started > 24h ago? rarely happens for hourly parking but possible).
    // The previous logic was: `or(status.ACTIVE, end_time > dateFilter)`.

    if (hoursFilter !== null) {
        const dateFilter = new Date(Date.now() - hoursFilter * 60 * 60 * 1000).toISOString()

        if (filters.status === 'active') {
            // If checking active, we generally want ALL active, but query above already filters by status=ACTIVE.
            // We usually don't filter active sessions by start time in enforcement, we want to see them all.
            // So we might skip time filter for 'active' status or ensure it doesn't hide long-running active sessions.
            // But `end_time_current` > now implies it's still relevant.
            // So time filter is redundant for 'active' view if based on end_time.
        } else {
            // For 'expired' or 'all':
            // We want sessions where `end_time_current > dateFilter`.
            // But wait, if we want "Expired" sessions, they are <= now.
            // We want them to be > dateFilter (e.g. ended in last 24h).
            // So: dateFilter < end_time_current <= now.
            query = query.gt('end_time_current', dateFilter)
        }
    } else {
        query = query.limit(500)
    }

    if (propertyIds !== null) {
        query = query.in('property_id', propertyIds)
    }

    if (filters.propertyId) {
        // Ensure user has access to this specific property if they are not admin
        if (propertyIds === null || propertyIds.includes(filters.propertyId)) {
            query = query.eq('property_id', filters.propertyId)
        } else {
            // If they requested a property they don't have access to, return empty or error? 
            // For safety, just force the ID mismatch which will return nothing if I add it, 
            // but technically I should just constrain it to their allowed IDs AND the requested ID.
            // Since I already did .in('property_id', propertyIds), adding .eq will just refine it.
            query = query.eq('property_id', filters.propertyId)
        }
    }

    if (filters.plate) {
        // Normalize plate search
        const normalizedPlate = filters.plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
        query = query.ilike('vehicle_plate', `%${normalizedPlate}%`)
    }

    // For spot/unit filter, we'd ideally filter on the joined table `parking_units.name`
    // Supabase JS client doesn't support filtering on joined tables easily with dot notation in .eq() for "inner" joins usually,
    // but !inner modifier can work.
    // However, if we just want to filter by spot name if provided:
    if (filters.spot) {
        // We need to use valid Supabase syntax for foreign table filtering.
        // This effectively does an inner join filtering.
        query = query.not('parking_units', 'is', null) // Ensure it has a unit if we are filtering by unit? Not necessarily.
        // Actually, easiest way is to use the embedded resource filtering syntax
        // parking_units!inner(name)
        // Check if `spot` filter is meant to be partial match or exact.
        // detailed filter:
        query = query.ilike('parking_units.name', `%${filters.spot}%`)
    }

    const { data: sessions, error } = await query

    if (error) {
        console.error('Error fetching enforcement data:', error)
        return { sessions: [], error: `Failed to fetch data: ${error.message} (${error.code || 'No Code'})` }
    }

    return { sessions: sessions || [] }
}
