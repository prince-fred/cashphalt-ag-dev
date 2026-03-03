import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials")
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const propertyId = '4571357c-606c-4e14-9c1b-5c18db292148'

    const { data: rules, error } = await supabase
        .from('pricing_rules')
        .select('id, name, rate_type, amount_cents, min_duration_minutes, max_duration_minutes, priority, is_active, unit_id')
        .eq('property_id', propertyId)
        .order('priority', { ascending: false })

    if (error) {
        console.error(error)
    } else {
        console.table(rules)
    }
}

run()
