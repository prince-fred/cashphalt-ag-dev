import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { toZonedTime } from 'date-fns-tz'
import { parse, isBefore, isAfter, getDay } from 'date-fns'
import { isRuleApplicable } from '../lib/parking/pricing'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function debugDefaultClient() {
    console.log(`Fetching rules directly from Supabase using NEXT_PUBLIC_SUPABASE_ANON_KEY`)
    let query = supabase
        .from('pricing_rules')
        .select('*, properties(timezone)')
        .eq('property_id', PROPERTY_ID)
        .eq('is_active', true)
        .eq('is_custom_product', true)

    query = query.or(`unit_id.is.null,unit_id.eq.${UNIT_ID}`)

    const { data: rules, error } = await query
    if (error) {
        console.error(error)
        return
    }

    console.log(`Found ${rules.length} custom products visible to anonymous users.`)
}

debugDefaultClient().catch(console.error)
