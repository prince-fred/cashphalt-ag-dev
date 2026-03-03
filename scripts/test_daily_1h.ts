import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { isRuleApplicable } from '../lib/parking/pricing'

dotenv.config({ path: '.env.local' })

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function debug(durationHours: number) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: rules } = await supabase.from('pricing_rules').select('*, properties(timezone)').eq('property_id', PROPERTY_ID).eq('unit_id', UNIT_ID)
    
    const rule = rules![0]
    
    // Test the createParkingSession duration logic:
    let finalDurationMinutes = 0

    if (rule.max_duration_minutes && rule.rate_type === 'FLAT') {
        finalDurationMinutes = rule.max_duration_minutes
    } else if (durationHours) {
        finalDurationMinutes = durationHours * 60
    } else if (rule.max_duration_minutes) {
        finalDurationMinutes = rule.max_duration_minutes
    } else {
        finalDurationMinutes = 60
    }
    
    console.log("Input hours:", durationHours)
    console.log("Calculated Hours for Session DB Entry:", finalDurationMinutes / 60)
}

debug(1).catch(console.error)
