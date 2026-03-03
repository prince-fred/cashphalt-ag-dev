import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { getParkingPrice } from '../actions/parking'

dotenv.config({ path: '.env.local' })

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function debug() {
    console.log("Testing 24 hours:")
    
    // We can't import getParkingPrice because of next headers issue.
    // Let's just query the DB directly and run the logic ourselves to see what happens.
    
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: rules } = await supabase.from('pricing_rules').select('*').eq('property_id', PROPERTY_ID).eq('unit_id', UNIT_ID)
    
    console.log("Unit Rules:", rules)
}

debug().catch(console.error)
