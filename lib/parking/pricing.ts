import { createClient } from '@/utils/supabase/server'
import { Database } from '@/db-types'
import { addMinutes, addDays, getDay, isAfter, isBefore, parse, set } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

type PricingRule = Database['public']['Tables']['pricing_rules']['Row']
type Discount = Database['public']['Tables']['discounts']['Row']

interface PriceCalculationResult {
    amountCents: number
    ruleApplied: PricingRule | null
    discountApplied: Discount | null
    discountAmountCents: number
    effectiveDurationHours?: number
}

export async function calculatePrice(
    propertyId: string,
    startTime: Date,
    durationHours: number,
    discountCode?: string,
    timezone?: string, // Optional, if provided avoids extra fetch
    unitId?: string
): Promise<PriceCalculationResult> {
    const supabase = await createClient()

    // 1. Fetch rules and timezone if needed
    let rules: PricingRule[] = []
    let propertyTimezone = timezone || 'UTC'

    if (!timezone) {
        // Fetch rules AND property timezone in one go if possible, or separately
        let query = supabase
            .from('pricing_rules')
            .select('*, properties(timezone)')
            .eq('property_id', propertyId)
            .eq('is_active', true)
            .order('priority', { ascending: false })

        if (unitId) {
            query = query.or(`unit_id.is.null,unit_id.eq.${unitId}`)
        } else {
            query = query.is('unit_id', null)
        }

        const { data: rulesData, error } = await query

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
        let query = supabase
            .from('pricing_rules')
            .select('*')
            .eq('property_id', propertyId)
            .eq('is_active', true)
            .order('priority', { ascending: false })

        if (unitId) {
            query = query.or(`unit_id.is.null,unit_id.eq.${unitId}`)
        } else {
            query = query.is('unit_id', null)
        }

        const { data: rulesData, error } = await query

        if (error || !rulesData) throw new Error('Could not fetch pricing rules')
        rules = rulesData as PricingRule[]
    }

    // STRICT ZONE ISOLATION:
    // If a unitId is provided, and there is AT LEAST ONE rule specifically assigned to that unitId,
    // we should completely ignore property-wide fallback rules (unit_id IS NULL) for this calculation.
    if (unitId) {
        const hasUnitSpecificRules = rules.some(r => r.unit_id === unitId)
        if (hasUnitSpecificRules) {
            rules = rules.filter(r => r.unit_id === unitId)
        }
    }

    // 2. Base Price Calculation
    // We must check applicability in the PROPERTY'S timezone
    const matchedRule = rules.find(rule => isRuleApplicable(rule, startTime, propertyTimezone, durationHours))

    // If there ARE rules defined for this context but NONE match the current time/day
    // (We also check if duration is the ONLY reason it didn't match, to avoid throwing unallowed timeframe error incorrectly)
    const timeMatchRule = rules.find(rule => isRuleApplicable(rule, startTime, propertyTimezone, null))

    if (!matchedRule && timeMatchRule) {
        // It matches time, but not duration. Don't throw restricted error, let it fall back or error gracefully
        // Actually, if it doesn't match duration either, we should just throw the same restriction error.
        throw new Error('RULES_EXIST_BUT_NOT_APPLICABLE')
    } else if (!matchedRule) {
        throw new Error('RULES_EXIST_BUT_NOT_APPLICABLE') // Handled by frontend
    }

    let selectedRule: PricingRule = matchedRule
    let baseAmountCents = calculateRuleAmount(selectedRule, durationHours)

    // OPTIMIZATION: "Daily Max" Logic
    if (selectedRule && selectedRule.rate_type === 'DAILY') {
        const hourlyRule = rules.find(r =>
            r.id !== selectedRule!.id &&
            r.rate_type === 'HOURLY' &&
            isRuleApplicable(r, startTime, propertyTimezone, durationHours)
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

    const { amountCents, discountApplied, discountAmountCents } = await applyDiscount(baseAmountCents, propertyId, discountCode)

    let effectiveDurationHours: number | undefined = undefined;
    if (selectedRule.is_custom_product && selectedRule.end_time) {
        effectiveDurationHours = calculateCustomProductDuration(startTime, selectedRule.end_time, propertyTimezone);
    }

    return {
        amountCents,
        ruleApplied: selectedRule,
        discountApplied,
        discountAmountCents,
        effectiveDurationHours
    }
}

export async function calculatePriceForRule(
    propertyId: string,
    ruleId: string,
    discountCode?: string
): Promise<PriceCalculationResult> {
    const supabase = await createClient()

    // Fetch the specific rule and property timezone
    const { data: ruleData, error } = await supabase
        .from('pricing_rules')
        .select('*, properties(timezone)')
        .eq('id', ruleId)
        .eq('property_id', propertyId)
        .single()

    if (error || !ruleData) {
        throw new Error('Pricing rule not found')
    }

    const { properties, ...ruleObj } = ruleData as any
    const rule = ruleObj as PricingRule
    const propertyTimezone = properties?.timezone || 'UTC'

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

    let effectiveDurationHours: number | undefined = undefined;
    if (rule.is_custom_product && rule.end_time) {
        // Assume checkout time is now when applying a specific rule directly
        effectiveDurationHours = calculateCustomProductDuration(new Date(), rule.end_time, propertyTimezone);
    }

    return {
        amountCents,
        ruleApplied: rule,
        discountApplied,
        discountAmountCents,
        effectiveDurationHours
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


export function isRuleApplicable(rule: PricingRule, date: Date, timezone: string, durationHours?: number | null): boolean {
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
            // Overnight window (e.g., 16:00 to 12:00)
            // Valid if time is greater than Start OR less than End
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

    // 3. Check Duration (if provided)
    if (durationHours !== undefined && durationHours !== null) {
        const durationMins = durationHours * 60
        if (rule.min_duration_minutes !== null && durationMins < rule.min_duration_minutes) {
            return false
        }
        if (rule.max_duration_minutes !== null && durationMins > rule.max_duration_minutes) {
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

export function calculateCustomProductDuration(startTime: Date, ruleEndTime: string, timezone: string): number {
    const zonedNow = toZonedTime(startTime, timezone)
    const targetTime = parse(ruleEndTime, 'HH:mm:ss', zonedNow)

    let targetEnd = targetTime
    // If target > now, today. If target < now, tomorrow.
    // E.g., Now = 11PM, Target = 8AM. Target < Now => Tomorrow.
    if (isBefore(targetEnd, zonedNow)) {
        targetEnd = addDays(targetEnd, 1)
    }

    const diffMs = targetEnd.getTime() - zonedNow.getTime()
    return diffMs / (1000 * 60 * 60)
}
