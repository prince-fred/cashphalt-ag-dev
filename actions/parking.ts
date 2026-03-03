'use server'

import { createClient } from '@/utils/supabase/server'
import { calculatePrice, calculatePriceForRule, isRuleApplicable } from '@/lib/parking/pricing'
import { Database } from '@/db-types'

type PricingRule = Database['public']['Tables']['pricing_rules']['Row']

export async function getParkingPrice(propertyId: string, durationHours: number, discountCode?: string, ruleId?: string, unitId?: string) {
    const startTime = new Date()
    // Find the property's timezone to pass to calculatePrice
    const supabase = await createClient()
    const { data: prop } = await supabase.from('properties').select('timezone').eq('id', propertyId).single()
    const tz = prop?.timezone || 'UTC'

    let result;
    if (ruleId) {
        result = await calculatePriceForRule(propertyId, ruleId, discountCode)
    } else {
        result = await calculatePrice(propertyId, startTime, durationHours, discountCode, tz, unitId)
    }

    return {
        ...result,
        rateType: result.ruleApplied?.rate_type || 'HOURLY'
    }
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

export async function getInitialDuration(propertyId: string, unitId?: string) {
    const supabase = await createClient()
    const now = new Date()

    let query = supabase
        .from('pricing_rules')
        .select('*, properties(timezone)')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .not('min_duration_minutes', 'is', null)
        .order('priority', { ascending: false })

    if (unitId) {
        query = query.or(`unit_id.is.null,unit_id.eq.${unitId}`)
    } else {
        query = query.is('unit_id', null)
    }

    const { data: rules } = await query

    if (rules && rules.length > 0) {
        const propertyTimezone = (rules as any[])[0].properties?.timezone || 'UTC'
        const applicableRule = (rules as any[]).find((r: any) => isRuleApplicable(r as PricingRule, now, propertyTimezone))

        if (applicableRule && applicableRule.min_duration_minutes) {
            return Math.ceil(applicableRule.min_duration_minutes / 60)
        }
    }
    return null
}

export async function getCustomProducts(propertyId: string, unitId?: string) {
    const supabase = await createClient()
    const now = new Date()

    let query = supabase
        .from('pricing_rules')
        .select('*, properties(timezone)')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .eq('is_custom_product', true)
        .order('priority', { ascending: false })

    if (unitId) {
        query = query.or(`unit_id.is.null,unit_id.eq.${unitId}`)
    } else {
        query = query.is('unit_id', null)
    }

    const { data: rules, error } = await query

    if (error) {
        console.error('Error fetching custom products:', error)
        return []
    }

    if (!rules || rules.length === 0) return []

    // Filter by applicability (Time of day, Day of week)
    const propertyTimezone = (rules as any[])[0].properties?.timezone || 'UTC'

    const validProducts = rules.filter((r: any) => {
        return isRuleApplicable(r as PricingRule, now, propertyTimezone)
    })

    return validProducts as PricingRule[]
}
