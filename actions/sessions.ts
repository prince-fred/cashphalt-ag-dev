'use server'

import { createClient } from '@/utils/supabase/server'
import { Database } from '@/db-types'

type SessionWithProperty = Database['public']['Tables']['sessions']['Row'] & {
    properties: Pick<Database['public']['Tables']['properties']['Row'], 'name' | 'slug'> | null
}

export async function getSessions(filters?: { propertyId?: string; status?: string; search?: string }) {
    console.log('getSessions received filters:', filters)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Determine filters
    let propertyIds: string[] | null = null

    if (profile?.role === 'admin') {
        propertyIds = null
    } else if (profile?.role === 'property_owner') {
        if (!profile.organization_id) return []
        const { data: props } = await supabase.from('properties').select('id').eq('organization_id', profile.organization_id)
        propertyIds = props?.map(p => p.id) || []
    } else if (profile?.role === 'staff') {
        const { data: assignments } = await supabase.from('property_members').select('property_id').eq('user_id', user.id)
        propertyIds = assignments?.map(a => a.property_id) || []
    } else {
        return []
    }

    if (propertyIds !== null && propertyIds.length === 0) return []

    let query = (supabase.from('sessions') as any)
        .select(`
            *,
            properties (
                name,
                slug
            )
        `)
        .order('created_at', { ascending: false })

    if (propertyIds !== null) {
        // If an explicit property filter is passed and we have access to it, just query that property.
        if (filters?.propertyId && filters.propertyId !== 'all') {
            if (propertyIds.includes(filters.propertyId)) {
                query = query.eq('property_id', filters.propertyId)
            } else {
                return [] // Unauthorized property query
            }
        } else {
            // Otherwise apply the allowed set
            query = query.in('property_id', propertyIds)
        }
    } else {
        // Admin user, full access
        if (filters?.propertyId && filters.propertyId !== 'all') {
            query = query.eq('property_id', filters.propertyId)
        }
    }

    if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'EXPIRED') {
            // Need ACTIVE status but end_time_current in the past
            query = query.eq('status', 'ACTIVE').lte('end_time_current', new Date().toISOString())
        } else if (filters.status === 'ACTIVE') {
            // Need ACTIVE status and end_time_current in the future
            query = query.eq('status', 'ACTIVE').gt('end_time_current', new Date().toISOString())
        } else {
            query = query.eq('status', filters.status)
        }
    }

    if (filters?.search) {
        query = query.ilike('vehicle_plate', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching sessions:', error)
        return []
    }

    return (data || []) as SessionWithProperty[]
}

export async function getAssignedProperties() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    let allowedProperties: { id: string, name: string }[] = []

    if (profile?.role === 'admin') {
        const { data: allProps } = await supabase.from('properties').select('id, name')
        allowedProperties = allProps || []
    } else if (profile?.role === 'property_owner') {
        if (!profile.organization_id) return []
        const { data: props } = await supabase.from('properties').select('id, name').eq('organization_id', profile.organization_id)
        allowedProperties = props || []
    } else if (profile?.role === 'staff') {
        const { data: assignments } = await supabase.from('property_members').select('property_id').eq('user_id', user.id)
        const propertyIds = assignments?.map(a => a.property_id) || []
        if (propertyIds.length > 0) {
            const { data: props } = await supabase.from('properties').select('id, name').in('id', propertyIds)
            allowedProperties = props || []
        }
    }

    return allowedProperties
}

export async function getSessionByPaymentIntent(paymentIntentId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase
        .from('sessions') as any)
        .select(`
            *,
            properties (
                name,
                slug,
                timezone,
                allocation_mode
            ),
            parking_units (
                name
            )
        `)
        .eq('payment_intent_id', paymentIntentId)
        .single()

    if (error) {
        // PGRST116: JSON object requested, multiple (or no) rows returned
        if (error.code === 'PGRST116') {
            console.warn('Session not found for Intent:', paymentIntentId)
            return null
        }
        console.error('Error fetching session by Intent:', error)
        return null
    }

    if (!data) {
        return null
    }

    return data
}
