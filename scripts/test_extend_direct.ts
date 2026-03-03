import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { isRuleApplicable } from '../lib/parking/pricing'

dotenv.config({ path: '.env.local' })

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function debug(durationHours: number) {
    console.log(`\nTesting ${durationHours} hours:`)
    const currentEnd = new Date()
    const propertyTimezone = 'America/New_York'

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: rules } = await supabase.from('pricing_rules').select('*').eq('property_id', PROPERTY_ID).eq('unit_id', UNIT_ID)

    if (!rules || rules.length === 0) return console.log("No rules")

    const rule = rules[0]
    console.log("Rule:", rule.name, "Min duration:", rule.min_duration_minutes)

    const applicable = isRuleApplicable(rule as any, currentEnd, propertyTimezone, durationHours)
    console.log("Is Applicable:", applicable)
}

debug(1).catch(console.error)
