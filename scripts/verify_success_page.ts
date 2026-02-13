
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    console.log('--- Creating Dummy Session for Success Page Verification ---')

    // 1. Get Property
    const { data: property } = await supabase.from('properties').select().limit(1).single()
    if (!property) throw new Error('No property found')

    // 2. Get Unit (optional)
    const { data: unit } = await supabase.from('parking_units').select().eq('property_id', property.id).limit(1).single()

    // 3. Create Session
    const paymentIntentId = 'pi_test_success_page_' + Date.now()
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours

    const { data: session, error } = await supabase
        .from('sessions')
        .insert({
            property_id: property.id,
            spot_id: unit?.id || null,
            vehicle_plate: 'SUCCESS-TEST',
            start_time: startTime.toISOString(),
            end_time_initial: endTime.toISOString(),
            end_time_current: endTime.toISOString(),
            total_price_cents: 1000,
            customer_email: 'test@example.com',
            status: 'ACTIVE',
            payment_intent_id: paymentIntentId
        })
        .select()
        .single()

    if (error) throw new Error('Failed to create session: ' + error.message)

    const url = `http://localhost:3000/pay/${property.id}/success?payment_intent=${paymentIntentId}`
    console.log('SUCCESS_URL=' + url)
}

run().catch(console.error)
