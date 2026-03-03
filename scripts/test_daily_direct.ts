import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { isRuleApplicable } from '../lib/parking/pricing'

dotenv.config({ path: '.env.local' })

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function debug(durationHours: number) {
    console.log(`\nTesting ${durationHours} hours:`)
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: rules } = await supabase.from('pricing_rules').select('*, properties(timezone)').eq('property_id', PROPERTY_ID).eq('unit_id', UNIT_ID)
    
    if (!rules || rules.length === 0) return console.log("No rules")

    const propertyTimezone = rules[0].properties?.timezone || 'UTC'
    const startTime = new Date()

    const matchedRule = rules.find((rule: any) => isRuleApplicable(rule, startTime, propertyTimezone, durationHours))
    if (!matchedRule) {
        return console.log("No matching rule applicable")
    }

    let selectedRule = matchedRule
    
    // calculateRuleAmount logic
    let baseAmountCents = 0
    if (selectedRule.rate_type === 'FLAT') baseAmountCents = selectedRule.amount_cents
    else if (selectedRule.rate_type === 'DAILY') baseAmountCents = selectedRule.amount_cents * Math.ceil(durationHours / 24)
    else baseAmountCents = selectedRule.amount_cents * durationHours

    console.log("Matched Rule:", selectedRule.name)
    console.log("Base Amount:", baseAmountCents)

    // Daily Max Logic
    if (selectedRule.rate_type === 'DAILY') {
        const hourlyRule = rules.find((r: any) =>
            r.id !== selectedRule.id &&
            r.rate_type === 'HOURLY' &&
            isRuleApplicable(r, startTime, propertyTimezone, durationHours)
        )

        if (hourlyRule) {
            let hourlyAmount = hourlyRule.amount_cents * durationHours
            if (hourlyAmount < baseAmountCents) {
                console.log(`[OPTIMIZATION] Switched to HOURLY (${hourlyAmount}) from DAILY (${baseAmountCents})`)
                baseAmountCents = hourlyAmount
                selectedRule = hourlyRule
            }
        }
    }

    // Now test what checkout.ts does with this duration
    let finalDurationMinutes = 0
    if (selectedRule.max_duration_minutes && selectedRule.rate_type === 'FLAT') {
        finalDurationMinutes = selectedRule.max_duration_minutes
    } else if (durationHours) {
        finalDurationMinutes = durationHours * 60
    } else if (selectedRule.max_duration_minutes) {
        finalDurationMinutes = selectedRule.max_duration_minutes
    } else {
        finalDurationMinutes = 60
    }

    console.log(`Final calculated backend session duration: ${finalDurationMinutes / 60} hours (input: ${durationHours} hours)`)
}

async function run() {
    await debug(24)
    await debug(48)
}

run().catch(console.error)
