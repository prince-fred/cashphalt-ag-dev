import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { isRuleApplicable } from './lib/parking/pricing'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const propertyId = '4571357c-606c-4e14-9c1b-5c18db292148'

    const { data: rules } = await supabase
        .from('pricing_rules')
        .select('*, properties(timezone)')
        .eq('property_id', propertyId)
        .order('priority', { ascending: false })

    const now = new Date()

    console.log("=== Active Rules ===")
    for (const rule of rules || []) {
        const isApplicable = isRuleApplicable(rule as any, now, rule.properties?.timezone || 'UTC')
        console.log(`Rule: ${rule.name} | Applicable right now: ${isApplicable} | Min Mins: ${rule.min_duration_minutes} | Max Mins: ${rule.max_duration_minutes}`)
    }
}

run()
