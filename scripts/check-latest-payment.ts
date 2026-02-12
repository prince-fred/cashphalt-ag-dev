
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia', // Update to match your version
})

async function checkLatestPayment() {
    console.log('--- Checking Latest Session ---')

    // 1. Get latest session
    const { data: session, error } = await supabase
        .from('sessions')
        .select(`
            *,
            properties (
                name,
                organizations (
                    id,
                    name,
                    stripe_connect_id,
                    platform_fee_percent
                )
            )
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        console.error('Failed to fetch session:', error)
        return
    }

    if (!session) {
        console.log('No sessions found.')
        return
    }

    console.log(`Session ID: ${session.id}`)
    console.log(`Property: ${(session.properties as any)?.name}`)
    console.log(`Organization: ${(session.properties as any)?.organizations?.name}`)
    console.log(`Org Connect ID: ${(session.properties as any)?.organizations?.stripe_connect_id}`)
    console.log(`Payment Intent ID: ${session.payment_intent_id}`)
    console.log(`Amount: ${session.total_price_cents} cents`)
    console.log(`Status: ${session.status}`)

    if (!session.payment_intent_id) {
        console.log('WARNING: No Payment Intent ID on session!')
        return
    }

    // 2. Fetch Stripe Info
    try {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent_id, {
            expand: ['transfer_data', 'latest_charge']
        })

        console.log('\n--- Stripe Payment Intent Details ---')
        console.log(`ID: ${pi.id}`)
        console.log(`Status: ${pi.status}`)
        console.log(`Amount: ${pi.amount}`)
        console.log(`Application Fee Amount: ${pi.application_fee_amount}`)
        console.log(`Transfer Data Destination: ${pi.transfer_data?.destination}`)

        if (pi.latest_charge) {
            const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge.id
            console.log(`Latest Charge ID: ${chargeId}`)
            const charge = await stripe.charges.retrieve(chargeId)
            console.log(`Charge Status: ${charge.status}`)
            console.log(`Transfer Group: ${charge.transfer_group}`)
        }

    } catch (err: any) {
        console.error('Stripe Error:', err.message)
    }
}

checkLatestPayment()
