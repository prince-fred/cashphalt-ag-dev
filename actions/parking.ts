'use server'

import { createClient } from '@/utils/supabase/server'
import { calculatePrice, calculatePriceForRule, isRuleApplicable } from '@/lib/parking/pricing'
import { Database } from '@/db-types'

type PricingRule = Database['public']['Tables']['pricing_rules']['Row']

export async function getParkingPrice(propertyId: string, durationHours: number, discountCode?: string) {
    const startTime = new Date()
    return calculatePrice(propertyId, startTime, durationHours, discountCode)
}

export async function getParkingPriceForRule(propertyId: string, ruleId: string, discountCode?: string) {
    return calculatePriceForRule(propertyId, ruleId, discountCode)
}

export async function getParkingOptions(propertyId: string) {
    const supabase = await createClient()
    const now = new Date()

    // Fetch all active rules for the property
    const { data: rules, error } = await supabase
        .from('pricing_rules')
        .select('*, properties(timezone)')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .order('min_duration_minutes', { ascending: true }) // Order by duration

    if (error) {
        console.error('Error fetching parking options:', error)
        return []
    }

    // Filter by applicability (Time of day, Day of week)
    // We need the property timezone
    const firstRule = rules && rules.length > 0 ? (rules[0] as any) : null
    const propertyTimezone = firstRule?.properties?.timezone || 'UTC'

    // Filter rules that are meant to be "Buckets" (have min/max duration)
    // AND are applicable right now
    const validBuckets = rules.filter((r: any) => {
        const rule = r as PricingRule
        // Must have duration limits to be a bucket
        if (rule.min_duration_minutes === null || rule.max_duration_minutes === null) return false

        return isRuleApplicable(rule, now, propertyTimezone)
    })

    return validBuckets as PricingRule[]
}

import { cache } from 'react'

export const getPropertyBySlugOrId = cache(async (identifier: string) => {
    const supabase = await createClient()

    // Try ID first (UUID regex)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

    let query = supabase.from('properties').select('*')

    if (isUuid) {
        query = query.eq('id', identifier)
    } else {
        query = query.eq('slug', identifier)
    }

    const { data, error } = await query.single()

    if (error) {
        return null
    }

    return data
})
