'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAdminStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return {
        activeCount: 0,
        totalRevenue: 0,
        revenueToday: 0,
        propertyCount: 0,
        totalUnits: 0,
        recentSessions: []
    }

    // Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Determine allowed Property IDs
    let propertyIds: string[] | null = null // null means ALL

    if (profile?.role === 'admin') {
        // All access
        propertyIds = null
    } else if (profile?.role === 'property_owner') {
        if (!profile.organization_id) return { activeCount: 0, totalRevenue: 0, revenueToday: 0, propertyCount: 0, totalUnits: 0, recentSessions: [] }

        const { data: props } = await supabase
            .from('properties')
            .select('id')
            .eq('organization_id', profile.organization_id)

        propertyIds = props?.map(p => p.id) || []
    } else if (profile?.role === 'staff') {
        const { data: assignments } = await supabase
            .from('property_members')
            .select('property_id')
            .eq('user_id', user.id)

        propertyIds = assignments?.map(a => a.property_id) || []
    } else {
        return { activeCount: 0, totalRevenue: 0, revenueToday: 0, propertyCount: 0, totalUnits: 0, recentSessions: [] }
    }

    // If restricted but no properties found
    if (propertyIds !== null && propertyIds.length === 0) {
        return { activeCount: 0, totalRevenue: 0, revenueToday: 0, propertyCount: 0, totalUnits: 0, recentSessions: [] }
    }

    // --- Queries ---

    // 1. Active Sessions Count
    let activeQuery = supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')

    if (propertyIds !== null) {
        activeQuery = activeQuery.in('property_id', propertyIds)
    }
    const { count: activeCount } = await activeQuery


    // 2. Total Revenue
    let revenueQuery = supabase
        .from('sessions')
        .select('total_price_cents')
        .neq('status', 'CREATED')

    if (propertyIds !== null) {
        revenueQuery = revenueQuery.in('property_id', propertyIds)
    }
    // Note: .returns needs to be chained after filter? 
    // Supabase JS chaining: filter first then returns? Yes.
    // Cast to any to avoid complex typing for now or move returns to end.
    const { data: revenueData } = await (revenueQuery as any).returns()

    const totalRevenueCents = (revenueData as { total_price_cents: number }[])?.reduce((sum, s) => sum + s.total_price_cents, 0) || 0

    // 3. Properties Count
    let propertyQuery = supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })

    if (propertyIds !== null) {
        propertyQuery = propertyQuery.in('id', propertyIds)
    }
    const { count: propertyCount } = await propertyQuery

    // 4. Revenue Today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    let revenueTodayQuery = supabase
        .from('sessions')
        .select('total_price_cents')
        .gte('created_at', startOfDay.toISOString())
        .neq('status', 'CREATED')

    if (propertyIds !== null) {
        revenueTodayQuery = revenueTodayQuery.in('property_id', propertyIds)
    }
    const { data: revenueTodayData } = await (revenueTodayQuery as any).returns()

    const revenueTodayCents = (revenueTodayData as { total_price_cents: number }[])?.reduce((sum, s) => sum + s.total_price_cents, 0) || 0

    // 5. Total Capacity (Units)
    let unitQuery = supabase
        .from('parking_units')
        .select('*', { count: 'exact', head: true })

    if (propertyIds !== null) {
        unitQuery = unitQuery.in('property_id', propertyIds)
    }
    const { count: totalUnits } = await unitQuery

    // 6. Recent Activity
    let recentQuery = supabase
        .from('sessions')
        .select(`
            *,
            properties (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    if (propertyIds !== null) {
        recentQuery = recentQuery.in('property_id', propertyIds)
    }
    const { data: recentSessions } = await recentQuery

    return {
        activeCount: activeCount || 0,
        totalRevenue: totalRevenueCents / 100,
        revenueToday: revenueTodayCents / 100,
        propertyCount: propertyCount || 0,
        totalUnits: totalUnits || 0,
        recentSessions: recentSessions || []
    }
}
