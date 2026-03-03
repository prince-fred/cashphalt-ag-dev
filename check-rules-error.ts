import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const propertyId = '4571357c-606c-4e14-9c1b-5c18db292148';
    const unitId = '6aa9583f-f735-473d-a058-2053893a579c';
    
    const { data: rules } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('property_id', propertyId)

    console.log("All Rules for Property:", JSON.stringify(rules, null, 2));
}

run()
