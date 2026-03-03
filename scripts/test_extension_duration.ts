import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { calculatePrice } from '../lib/parking/pricing'
import { addMinutes } from 'date-fns'

dotenv.config({ path: '.env.local' })

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'

async function debug(durationHours: number) {
    console.log(`\nTesting Extension by ${durationHours} hours:`)
    const currentEnd = new Date()
    const propertyTimezone = 'America/New_York'
    
    // We get the price and what rule is being applied
    const { amountCents, ruleApplied, effectiveDurationHours } = await calculatePrice(PROPERTY_ID, currentEnd, durationHours, undefined, propertyTimezone)

    // 3. Determine the actual duration we are granting
    let grantedMinutes = durationHours * 60;
    
    if (effectiveDurationHours) {
        grantedMinutes = effectiveDurationHours * 60;
    } else if (ruleApplied?.max_duration_minutes && ruleApplied.rate_type === 'FLAT') {
        grantedMinutes = ruleApplied.max_duration_minutes;
    }

    const newEnd = addMinutes(currentEnd, grantedMinutes)
    
    console.log("Rule matched:", ruleApplied?.name)
    console.log("Amount Cents:", amountCents)
    console.log("Granted Minutes:", grantedMinutes)
    console.log("Granted Hours:", grantedMinutes / 60)
}

async function run() {
    await debug(24) // 1 Day
    await debug(48) // 2 Days
}

run().catch(console.error)
