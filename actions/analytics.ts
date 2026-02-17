'use server'

import { createClient } from '@/utils/supabase/server'
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns'

export interface AnalyticsFilter {
    propertyId?: string | 'all'
    dateRange?: 'today' | '7d' | '30d' | 'month' | 'all'
}

export interface AnalyticsData {
    kpis: {
        revenue: number
        sessions: number
        activeCount: number
        expiredCount: number
        occupancyRate: number
    }
    charts: {
        revenue: { date: string; amount: number }[]
        volume: { date: string; count: number }[]
    }
    recentActivity: any[]
    properties: { id: string, name: string }[]
}

export async function getAnalyticsData(filters: AnalyticsFilter = {}): Promise<{ data?: AnalyticsData; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // 1. Determine User Access
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
        if (!profile.organization_id) return { error: 'No organization assigned' }
        const { data: props } = await supabase.from('properties').select('id, name').eq('organization_id', profile.organization_id)
        allowedProperties = props || []
    } else if (profile?.role === 'staff') {
        const { data: assignments } = await supabase.from('property_members').select('property_id').eq('user_id', user.id)
        const propertyIds = assignments?.map(a => a.property_id) || []
        if (propertyIds.length > 0) {
            const { data: props } = await supabase.from('properties').select('id, name').in('id', propertyIds)
            allowedProperties = props || []
        }
    } else {
        return { error: 'Unauthorized' }
    }

    if (allowedProperties.length === 0) {
        return { error: 'No assigned properties' }
    }

    const allowedPropertyIds = allowedProperties.map(p => p.id)

    // 2. Filter Properties
    let targetPropertyIds = allowedPropertyIds
    if (filters.propertyId && filters.propertyId !== 'all') {
        if (!allowedPropertyIds.includes(filters.propertyId)) {
            return { error: 'Unauthorized access to property' }
        }
        targetPropertyIds = [filters.propertyId]
    }

    // 3. Determine Date Range
    const now = new Date()
    let startDate = startOfDay(subDays(now, 30)) // Default 30d
    let endDate = endOfDay(now)

    if (filters.dateRange === 'today') {
        startDate = startOfDay(now)
    } else if (filters.dateRange === '7d') {
        startDate = startOfDay(subDays(now, 7))
    } else if (filters.dateRange === '30d') {
        startDate = startOfDay(subDays(now, 30))
    } else if (filters.dateRange === 'month') {
        startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
    } else if (filters.dateRange === 'all') {
        startDate = new Date(0) // 1970
    }

    // 4. Fetch Sessions
    // We need: total_price_cents, created_at, status, end_time_current
    let query = supabase
        .from('sessions')
        .select(`
            id,
            total_price_cents,
            created_at,
            status,
            end_time_current,
            vehicle_plate,
            properties (name)
        `)
        .in('property_id', targetPropertyIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
        console.error('Analytics fetch error:', error)
        return { error: 'Failed to fetch analytics data' }
    }

    // 5. Aggregate Data
    const safeSessions = (data || []) as any[]

    // KPIs
    const revenueCents = safeSessions.reduce((sum, s) => sum + s.total_price_cents, 0)
    const revenue = revenueCents / 100
    const totalSessions = safeSessions.length

    // Active vs Expired (based on current status in DB or end_time?)
    // "Active Count" usually means currently active right now.
    // So we should query active status regardless of date range? 
    // Usually "Operations Dashboard" shows *current* active count, but revenue over the selected period.
    // But if I filter by "Yesterday", active count is 0? 
    // Typically Active/Occupancy is a snapshot of NOW.
    // Revenue/Volume is aggregation of PERIOD.

    // Let's do a separate quick query for "Current Active" for KPI
    // Only if filters.dateRange is NOT historic? 
    // Actually, users expect "Active Guests" to be "Right Now".

    const { count: activeCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .in('property_id', targetPropertyIds)
        .eq('status', 'ACTIVE')

    // For expired count in the period?
    // Maybe just "Ended Sessions" in the period.
    const expiredCount = safeSessions.filter(s => s.status !== 'ACTIVE' || new Date(s.end_time_current) <= now).length

    // Occupancy?
    // Need total spots.
    // If not available, might return 0 or null.
    // Let's check 'spots' table count for target properties if 'SPOT' mode?
    // Or 'properties' capacity?
    // Assuming simple Active count for now.

    // Charts
    // Group sessions by day
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Map to 'yyyy-MM-dd' keys
    const revenueMap = new Map<string, number>()
    const volumeMap = new Map<string, number>()

    days.forEach(day => {
        const key = format(day, 'yyyy-MM-dd')
        revenueMap.set(key, 0)
        volumeMap.set(key, 0)
    })

    safeSessions.forEach(s => {
        const dayKey = format(new Date(s.created_at), 'yyyy-MM-dd')
        if (revenueMap.has(dayKey)) {
            revenueMap.set(dayKey, (revenueMap.get(dayKey) || 0) + s.total_price_cents / 100)
            volumeMap.set(dayKey, (volumeMap.get(dayKey) || 0) + 1)
        }
    })

    // Convert to arrays
    const revenueChart = Array.from(revenueMap.entries()).map(([date, amount]) => ({
        date: format(new Date(date), 'MMM d'),
        amount
    })).reverse() // keeping chronological? eachDay returns earliest first. Map insertion order... 
    // actually explicitly sort or map from `days` array

    const sortedRevenueChart = days.map(day => {
        const key = format(day, 'yyyy-MM-dd')
        return {
            date: format(day, 'MMM d'),
            amount: revenueMap.get(key) || 0
        }
    })

    const sortedVolumeChart = days.map(day => {
        const key = format(day, 'yyyy-MM-dd')
        return {
            date: format(day, 'MMM d'),
            count: volumeMap.get(key) || 0
        }
    })

    return {
        data: {
            kpis: {
                revenue,
                sessions: totalSessions,
                activeCount: activeCount || 0,
                expiredCount,
                occupancyRate: 0 // placeholder
            },
            charts: {
                revenue: sortedRevenueChart,
                volume: sortedVolumeChart
            },
            recentActivity: safeSessions.slice(0, 5),
            properties: allowedProperties
        }
    }
}
