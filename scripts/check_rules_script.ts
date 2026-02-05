
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRules() {
    const propertyId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

    const { data: rules, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('property_id', propertyId)
        .order('priority', { ascending: false })

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Pricing Rules for Property:', propertyId)
        console.table(rules)
    }
}

checkRules()
