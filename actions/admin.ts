'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAdminStats() {
    const supabase = await createClient()

    // Mock org ID for MVP - normally fetched from auth user
    // In production we would join on organizations table

    // 1. Active Sessions Count
    const { count: activeCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')

    // 2. Total Revenue (Naive sum for MVP, normally use aggregation query)
    const { data: revenueData } = await supabase
        .from('sessions')
        .select('total_price_cents')
        .neq('status', 'CREATED') // Include active/expired/completed
        .returns<{ total_price_cents: number }[]>()

    const totalRevenueCents = revenueData?.reduce((sum, s) => sum + s.total_price_cents, 0) || 0

    // 3. Properties Count
    const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })

    // 4. Revenue Today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data: revenueTodayData } = await supabase
        .from('sessions')
        .select('total_price_cents')
        .gte('created_at', startOfDay.toISOString())
        .neq('status', 'CREATED')

    const revenueTodayCents = revenueTodayData?.reduce((sum, s: any) => sum + s.total_price_cents, 0) || 0

    // 5. Total Capacity (Units)
    const { count: totalUnits } = await supabase
        .from('parking_units')
        .select('*', { count: 'exact', head: true })

    // 6. Recent Activity
    const { data: recentSessions } = await supabase
        .from('sessions')
        .select(`
            *,
            properties (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    return {
        activeCount: activeCount || 0,
        totalRevenue: totalRevenueCents / 100,
        revenueToday: revenueTodayCents / 100,
        propertyCount: propertyCount || 0,
        totalUnits: totalUnits || 0,
        recentSessions: recentSessions || []
    }
}
