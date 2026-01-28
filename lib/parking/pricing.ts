import { createClient } from '@/utils/supabase/server'
import { Database } from '@/database.types'
import { addMinutes, getDay, isAfter, isBefore, parse, set } from 'date-fns'

type PricingRule = Database['public']['Tables']['pricing_rules']['Row']

export async function calculatePrice(propertyId: string, startTime: Date, durationHours: number) {
    const supabase = await createClient()
    const endTime = addMinutes(startTime, durationHours * 60)

    // 1. Fetch active rules for the property, ordered by priority (desc)
    const { data: rules, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .order('priority', { ascending: false })

    if (error || !rules) {
        console.error('Pricing Error:', error)
        throw new Error('Could not fetch pricing rules')
    }

    // 2. Simple calculation (MVP: First matching rule applies to WHOLE session)
    // PROD TODO: Split session into segments if it spans multiple rules (e.g., Day -> Night)

    const matchedRule = rules.find(rule => isRuleApplicable(rule, startTime))

    // Fallback default price if no rule matches (should have a default catch-all rule in DB)
    if (!matchedRule) {
        return {
            amountCents: 500 * durationHours, // $5 fallback
            ruleApplied: null
        }
    }

    let amountCents = 0
    if (matchedRule.rate_type === 'FLAT') {
        amountCents = matchedRule.amount_cents
    } else {
        // HOURLY
        amountCents = matchedRule.amount_cents * durationHours
    }

    return {
        amountCents,
        ruleApplied: matchedRule
    }
}

function isRuleApplicable(rule: PricingRule, date: Date): boolean {
    // 1. Check Day of Week
    if (rule.days_of_week && rule.days_of_week.length > 0) {
        const day = getDay(date) // 0 = Sun, 1 = Mon...
        if (!rule.days_of_week.includes(day)) {
            return false
        }
    }

    // 2. Check Time Window
    if (rule.start_time && rule.end_time) {
        // Parse "HH:mm:ss" from DB
        const ruleStart = parse(rule.start_time, 'HH:mm:ss', date)
        const ruleEnd = parse(rule.end_time, 'HH:mm:ss', date)

        // Handle overnight (Start 22:00, End 06:00)? 
        // MVP: Simple strictly bounded check for now.
        // Assuming user books START within the window.

        // We only check if the START time falls in the window for determining base rate
        if (isBefore(date, ruleStart) || isAfter(date, ruleEnd)) {
            return false
        }
    }

    return true
}
