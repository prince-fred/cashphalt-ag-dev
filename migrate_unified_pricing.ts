import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function migrate() {
    console.log("Starting Pricing Unified Migration...")

    const { data: properties, error: propError } = await supabase.from('properties').select('*')
    if (propError || !properties) {
        console.error("Failed to fetch properties:", propError)
        return
    }

    for (const property of properties) {
        console.log(`Processing Property: ${property.name} (${property.id})`)

        // 1. Create Default Base Rate Rule (Priority 0)
        const baseRate = property.price_hourly_cents || property.hourly_rate_cents || 500
        const { error: baseRuleError } = await supabase.from('pricing_rules').insert({
            property_id: property.id,
            name: 'Standard Hourly Rate',
            description: 'Legacy base hourly rate',
            rate_type: 'HOURLY',
            amount_cents: baseRate,
            priority: 0,
            is_active: true,
            unit_id: null,
            is_custom_product: false
        })

        if (baseRuleError) {
            console.error(`  [!] Failed to insert base rate for ${property.name}:`, baseRuleError)
        } else {
            console.log(`  [+] Created Base Rate ($${(baseRate / 100).toFixed(2)}/hr)`)
        }

        // 2. Create Custom Product Rule if enabled
        if (property.custom_product_enabled && property.custom_product_price_cents !== null) {
            const { error: eventRuleError } = await supabase.from('pricing_rules').insert({
                property_id: property.id,
                name: property.custom_product_name || 'Special Event Rate',
                description: 'Migrated custom product/event rate',
                rate_type: 'FLAT',
                amount_cents: property.custom_product_price_cents,
                start_time: null,
                end_time: property.custom_product_end_time, // This effectively acts as the expiration if we enforce it right
                priority: 1000, // Very high priority
                is_active: false, // Leave inactive so admin can manage it
                unit_id: null,
                is_custom_product: true
            })

            if (eventRuleError) {
                console.error(`  [!] Failed to insert custom product rule for ${property.name}:`, eventRuleError)
            } else {
                console.log(`  [+] Created Custom Product Rule (${property.custom_product_name})`)
            }
        }
    }

    console.log("Migration complete. PLEASE RUN `npm run check-types` after updating db-types.ts")
}

migrate()
