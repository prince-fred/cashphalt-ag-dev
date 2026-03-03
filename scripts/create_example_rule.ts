import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PROPERTY_ID = '4571357c-606c-4e14-9c1b-5c18db292148'
const UNIT_ID = '81a25521-cf0f-424c-af07-6902605a0f46'

async function createExampleRules() {
    console.log('Creating example Overnight rule for Property:', PROPERTY_ID, ' Unit:', UNIT_ID)

    // Example 1: Overnight Parking (Custom Product)
    const overnightRule = {
        property_id: PROPERTY_ID,
        unit_id: UNIT_ID,
        name: 'Overnight Parking Pass',
        description: 'Valid until 12:00 PM the following day',
        priority: 0,
        rate_type: 'FLAT',
        amount_cents: 2500, // $25.00
        is_active: true,
        is_custom_product: true,
        // Becomes available at 4 PM (16:00:00)
        start_time: '16:00:00',
        // Expires perfectly at 12 PM the next day
        end_time: '12:00:00',
        // Available every day
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
    }

    // Example 2: Standard Hourly Rate for the same zone
    const hourlyRule = {
        property_id: PROPERTY_ID,
        unit_id: UNIT_ID,
        name: 'Standard Hourly',
        description: 'Standard hourly parking rate',
        priority: 0,
        rate_type: 'HOURLY',
        amount_cents: 500, // $5.00 per hour
        is_active: true,
        is_custom_product: false,
    }

    const { error: overnightError } = await supabase.from('pricing_rules').insert(overnightRule)
    if (overnightError) {
        console.error('Failed to create overnight rule:', overnightError)
    } else {
        console.log('✅ Created Overnight Parking Pass')
    }

    // Check if an hourly rule already exists for this unit
    const { data: existingHourly } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('property_id', PROPERTY_ID)
        .eq('unit_id', UNIT_ID)
        .eq('rate_type', 'HOURLY')
        .limit(1)

    if (!existingHourly || existingHourly.length === 0) {
        const { error: hourlyError } = await supabase.from('pricing_rules').insert(hourlyRule)
        if (hourlyError) {
            console.error('Failed to create hourly rule:', hourlyError)
        } else {
            console.log('✅ Created Standard Hourly Rule')
        }
    } else {
        console.log('ℹ️ Standard Hourly Rule already exists for this zone, skipping creation.')
    }
}

createExampleRules().then(() => console.log('Done.')).catch(console.error)
