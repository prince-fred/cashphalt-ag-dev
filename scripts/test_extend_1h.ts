import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { isRuleApplicable, calculatePrice } from '../lib/parking/pricing'

dotenv.config({ path: '.env.local' })

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function debug(durationHours: number) {
    console.log(`\nTesting ${durationHours} hours:`)
    const currentEnd = new Date()
    const propertyTimezone = 'America/New_York'

    try {
        const { amountCents, ruleApplied } = await calculatePrice(PROPERTY_ID, currentEnd, durationHours, undefined, propertyTimezone, UNIT_ID)
        console.log("Matched Rule:", ruleApplied?.name)
        console.log("Amount:", amountCents)
    } catch (e: any) {
        console.error("Error:", e.message)
    }
}

async function run() {
    await debug(1)
}

run().catch(console.error)
