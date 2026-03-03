import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
    const propertyId = '013f3b3d-6182-41fc-a89d-faa5ff20f631';
    const unitId = '51ce5d6b-ebf9-4496-ae35-a74a3c4d76cb';

    // Check property pricing rules
    const { data: rules } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('property_id', propertyId)

    console.log("All Rules for Property:", JSON.stringify(rules, null, 2));

    // Check unit pricing rules
    const { data: unitOverrides } = await supabase
        .from('pricing_rule_units')
        .select(`
             pricing_rule_id,
             pricing_rules (*)
        `)
        .eq('unit_id', unitId)

    console.log("Overrides for Unit:", JSON.stringify(unitOverrides, null, 2));
}

run()
