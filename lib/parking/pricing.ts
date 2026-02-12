import { createClient } from '@/utils/supabase/server'
import { Database } from '@/db-types'
import { addMinutes, getDay, isAfter, isBefore, parse, set } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

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
    discountCode?: string,
    timezone?: string // Optional, if provided avoids extra fetch
): Promise<PriceCalculationResult> {
    const supabase = await createClient()

    // 1. Fetch rules and timezone if needed
    let rules: PricingRule[] = []
    let propertyTimezone = timezone || 'UTC'

    if (!timezone) {
        // Fetch rules AND property timezone in one go if possible, or separately
        const { data: rulesData, error } = await (supabase
            .from('pricing_rules') as any)
            .select('*, properties(timezone)')
            .eq('property_id', propertyId)
            .eq('is_active', true)
            .order('priority', { ascending: false })

        if (error || !rulesData) {
            console.error('Pricing Error:', error)
            throw new Error('Could not fetch pricing rules')
        }

        rules = rulesData.map((r: any) => {
            const { properties, ...rule } = r
            if (properties?.timezone) propertyTimezone = properties.timezone
            return rule
        }) as PricingRule[]
    } else {
        const { data: rulesData, error } = await (supabase
            .from('pricing_rules') as any)
            .select('*')
            .eq('property_id', propertyId)
            .eq('is_active', true)
            .order('priority', { ascending: false })

        if (error || !rulesData) throw new Error('Could not fetch pricing rules')
        rules = rulesData as PricingRule[]
    }

    // 2. Base Price Calculation
    // We must check applicability in the PROPERTY'S timezone
    const matchedRule = rules.find(rule => isRuleApplicable(rule, startTime, propertyTimezone))

    // Fallback default price if no rule matches
    if (!matchedRule) {
        // Fallback: $5/hr
        const res = await applyDiscount(500 * durationHours, propertyId, discountCode)
        return {
            ...res,
            ruleApplied: null
        }
    }

    let selectedRule: PricingRule | null = matchedRule
    let baseAmountCents = 0

    if (matchedRule) {
        selectedRule = matchedRule
        baseAmountCents = calculateRuleAmount(selectedRule, durationHours)

        // OPTIMIZATION: "Daily Max" Logic
        if (selectedRule && selectedRule.rate_type === 'DAILY') {
            const hourlyRule = rules.find(r =>
                r.id !== selectedRule!.id &&
                r.rate_type === 'HOURLY' &&
                isRuleApplicable(r, startTime, propertyTimezone)
            )

            if (hourlyRule) {
                const hourlyAmount = calculateRuleAmount(hourlyRule, durationHours)
                if (hourlyAmount < baseAmountCents) {
                    console.log(`Switching from DAILY (${baseAmountCents}) to HOURLY (${hourlyAmount})`)
                    baseAmountCents = hourlyAmount
                    selectedRule = hourlyRule
                }
            }
        }
    } else {
        // Fallback: $5/hr
        baseAmountCents = 500 * durationHours
        selectedRule = null
    }

    const { amountCents, discountApplied, discountAmountCents } = await applyDiscount(baseAmountCents, propertyId, discountCode)

    return {
        amountCents,
        ruleApplied: selectedRule,
        discountApplied,
        discountAmountCents
    }
}

export async function calculatePriceForRule(
    propertyId: string,
    ruleId: string,
    discountCode?: string
): Promise<PriceCalculationResult> {
    const supabase = await createClient()

    // Fetch the specific rule
    const { data: rule, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('id', ruleId)
        .eq('property_id', propertyId)
        .single()

    if (error || !rule) {
        throw new Error('Pricing rule not found')
    }

    // We assume the rule ID passed is valid and active.
    if (!rule.is_active) {
        throw new Error('Pricing rule is inactive')
    }

    // For buckets, we use the rule's fixed price.
    // If it's HOURLY, we might need a duration? But buckets usually imply a set duration (max_duration).
    // Let's assume buckets are FLAT or we calculate based on max_duration.

    let baseAmountCents = rule.amount_cents
    if (rule.rate_type === 'HOURLY' && rule.max_duration_minutes) {
        baseAmountCents = rule.amount_cents * (rule.max_duration_minutes / 60)
    }

    const { amountCents, discountApplied, discountAmountCents } = await applyDiscount(baseAmountCents, propertyId, discountCode)

    return {
        amountCents,
        ruleApplied: rule as PricingRule,
        discountApplied,
        discountAmountCents
    }
}


async function applyDiscount(baseAmountCents: number, propertyId: string, discountCode?: string) {
    const supabase = await createClient()

    let discountApplied: Discount | null = null
    let discountAmountCents = 0
    let finalAmountCents = baseAmountCents

    if (discountCode) {
        const { data: discountData, error: discountError } = await (supabase
            .from('discounts') as any)
            .select('*')
            .eq('property_id', propertyId)
            .eq('code', discountCode)
            .eq('is_active', true)
            .single()

        const discount = discountData as Discount

        if (discount && !discountError) {
            // Check expiry
            if (discount.expires_at && isAfter(new Date(), new Date(discount.expires_at))) {
                console.log("Discount expired")
            }
            // Check usage limit
            else if (discount.usage_limit !== null && (discount.usage_count || 0) >= discount.usage_limit) {
                console.log("Discount usage limit reached")
            } else {
                discountApplied = discount
                if (discount.type === 'PERCENTAGE') {
                    discountAmountCents = Math.round(baseAmountCents * (discount.amount / 100))
                } else {
                    discountAmountCents = discount.amount
                }
                finalAmountCents = Math.max(0, baseAmountCents - discountAmountCents)
            }
        }
    }

    return { amountCents: finalAmountCents, discountApplied, discountAmountCents }
}


export function isRuleApplicable(rule: PricingRule, date: Date, timezone: string): boolean {
    // Convert the input UTC date to the Property's Zoned Time
    const zonedDate = toZonedTime(date, timezone)

    // 1. Check Day of Week (using Zoned Date)
    if (rule.days_of_week && rule.days_of_week.length > 0) {
        const day = getDay(zonedDate) // 0 = Sun, 1 = Mon... based on zoned time
        if (!rule.days_of_week.includes(day)) {
            return false
        }
    }

    // 2. Check Time Window (using Zoned Date)
    if (rule.start_time && rule.end_time) {
        // Parse "HH:mm:ss" relative to the Zoned Date
        // We create a date object for the current zoned day with the rule's time
        const ruleStart = parse(rule.start_time, 'HH:mm:ss', zonedDate)
        const ruleEnd = parse(rule.end_time, 'HH:mm:ss', zonedDate)

        if (isBefore(ruleEnd, ruleStart)) {
            // Overnight window
            if (isBefore(zonedDate, ruleStart) && isAfter(zonedDate, ruleEnd)) {
                return false
            }
        } else {
            // Standard window
            if (isBefore(zonedDate, ruleStart) || isAfter(zonedDate, ruleEnd)) {
                return false
            }
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
