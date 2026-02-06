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

    return {
        activeCount: activeCount || 0,
        totalRevenue: totalRevenueCents / 100,
        propertyCount: propertyCount || 0
    }
}
