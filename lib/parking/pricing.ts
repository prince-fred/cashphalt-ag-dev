import { createClient } from '@/utils/supabase/server'
import { Database } from '@/database.types'
import { addMinutes, getDay, isAfter, isBefore, parse, set } from 'date-fns'

type PricingRule = Database['public']['Tables']['pricing_rules']['Row']
type Discount = Database['public']['Tables']['discounts']['Row']

interface PriceCalculationResult {
    amountCents: number
    ruleApplied: PricingRule | null
    discountApplied: Discount | null
    discountAmountCents: number
}

export async function calculatePrice(
    propertyId: string,
    startTime: Date,
    durationHours: number,
    discountCode?: string
): Promise<PriceCalculationResult> {
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

    // 2. Base Price Calculation
    const matchedRule = rules.find(rule => isRuleApplicable(rule, startTime))

    // Fallback default price if no rule matches
    if (!matchedRule) {
        // Fallback: $5/hr
        return {
            amountCents: 500 * durationHours,
            ruleApplied: null,
            discountApplied: null,
            discountAmountCents: 0
        }
    }

    let selectedRule = matchedRule
    let baseAmountCents = 0

    // Initial calculation with the priority winner
    baseAmountCents = calculateRuleAmount(selectedRule, durationHours)

    // OPTIMIZATION: "Daily Max" Logic
    // If we picked a DAILY rule, checks if there is a matching HOURLY rule that is CHEAPER for this duration.
    // This handles the case where Daily (Prio 10) > Hourly (Prio 1), but we want Hourly for short stays.
    if (selectedRule.rate_type === 'DAILY') {
        const hourlyRule = rules.find(r =>
            r.id !== selectedRule.id &&
            r.rate_type === 'HOURLY' &&
            isRuleApplicable(r, startTime)
        )

        if (hourlyRule) {
            const hourlyAmount = calculateRuleAmount(hourlyRule, durationHours)
            if (hourlyAmount < baseAmountCents) {
                // Determine if we should switch.
                // Switching effectively treats the Daily rule as a "Cap" rather than a forced rate.
                console.log(`Switching from DAILY (${baseAmountCents}) to HOURLY (${hourlyAmount})`)
                baseAmountCents = hourlyAmount
                selectedRule = hourlyRule
            }
        }
    }

    let finalAmountCents = baseAmountCents
    let discountApplied: Discount | null = null
    let discountAmountCents = 0

    // 3. Apply Discount
    if (discountCode) {
        const { data: discount, error: discountError } = await supabase
            .from('discounts')
            .select('*')
            .eq('property_id', propertyId)
            .eq('code', discountCode)
            .eq('is_active', true)
            .single()

        if (discount && !discountError) {
            // Check expiry
            if (discount.expires_at && isAfter(new Date(), new Date(discount.expires_at))) {
                console.log("Discount expired")
            }
            // Check usage limit
            else if (discount.usage_limit !== null && (discount.usage_count || 0) >= discount.usage_limit) {
                console.log("Discount usage limit reached")
            } else {
                // Valid Discount
                discountApplied = discount

                if (discount.type === 'PERCENTAGE') {
                    // amount is percentage (e.g. 20 = 20%)
                    discountAmountCents = Math.round(baseAmountCents * (discount.amount / 100))
                } else {
                    // FIXED_AMOUNT
                    discountAmountCents = discount.amount
                }

                finalAmountCents = Math.max(0, baseAmountCents - discountAmountCents)
            }
        }
    }

    return {
        amountCents: finalAmountCents,
        ruleApplied: matchedRule,
        discountApplied,
        discountAmountCents
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

function calculateRuleAmount(rule: PricingRule, durationHours: number): number {
    if (rule.rate_type === 'FLAT') {
        return rule.amount_cents
    } else if (rule.rate_type === 'DAILY') {
        const days = Math.ceil(durationHours / 24)
        return rule.amount_cents * days
    } else {
        // HOURLY
        return rule.amount_cents * durationHours
    }
}
