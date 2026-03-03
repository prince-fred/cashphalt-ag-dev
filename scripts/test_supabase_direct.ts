import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { toZonedTime } from 'date-fns-tz'
import { parse, isBefore, isAfter, getDay } from 'date-fns'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function debug() {
    console.log(`Fetching rules directly from Supabase`)
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

    console.log(`Found ${rules.length} custom products in DB for this property/zone.`)
    console.dir(rules, { depth: null })
    
    // Now apply applicability check
    const now = new Date()
    const validProducts = rules.filter((r: any) => {
        const timezone = r.properties?.timezone || 'UTC'
        const zonedDate = toZonedTime(now, timezone)
        
        if (r.days_of_week && r.days_of_week.length > 0) {
            const day = getDay(zonedDate)
            if (!r.days_of_week.includes(day)) return false
        }
        
        if (r.start_time && r.end_time) {
            const ruleStart = parse(r.start_time, 'HH:mm:ss', zonedDate)
            const ruleEnd = parse(r.end_time, 'HH:mm:ss', zonedDate)

            if (isBefore(ruleEnd, ruleStart)) {
                if (isBefore(zonedDate, ruleStart) && isAfter(zonedDate, ruleEnd)) return false
            } else {
                if (isBefore(zonedDate, ruleStart) || isAfter(zonedDate, ruleEnd)) return false
            }
        }
        return true
    })
    
    console.log(`\nFound ${validProducts.length} APPLICABLE products:`)
    console.dir(validProducts, { depth: null })

}

debug().catch(console.error)
