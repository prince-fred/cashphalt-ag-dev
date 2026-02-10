'use server'

import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe'
import { calculatePrice } from '@/lib/parking/pricing'
import { addMinutes } from 'date-fns'

interface CreateSessionParams {
    propertyId: string
    durationHours: number
    plate: string
    customerEmail?: string
    discountCode?: string
    unitId?: string
}

export async function createParkingSession({ propertyId, durationHours, plate, customerEmail, discountCode, unitId }: CreateSessionParams) {
    const supabase = await createClient()

    // 1. Calculate Price Authoritatively
    const startTime = new Date()
    const { amountCents, ruleApplied, discountApplied, discountAmountCents } = await calculatePrice(propertyId, startTime, durationHours, discountCode)

    // 2. Create Pending Session in DB
    // This locks in the price and the rule used.
    const endTimeInitial = addMinutes(startTime, durationHours * 60)

    const { data: session, error: sessionError } = await (supabase
        .from('sessions') as any)
        .insert({
            property_id: propertyId,
            start_time: startTime.toISOString(),
            end_time_initial: endTimeInitial.toISOString(),
            end_time_current: endTimeInitial.toISOString(),
            total_price_cents: amountCents,
            status: 'PENDING_PAYMENT',
            vehicle_plate: plate,
            customer_email: customerEmail,
            discount_id: discountApplied?.id || null,
            discount_amount_cents: discountAmountCents,
            spot_id: unitId || null
        })
        .select()
        .single()

    if (sessionError || !session) {
        console.error('Session Create Error:', sessionError)
        throw new Error(`Failed to create parking session: ${sessionError?.message || 'Unknown error'}`)
    }

    // 3. Create Session Snapshot (Immutable Record)
    // We record exactly WHY it cost this much.
    if (ruleApplied) {
        await (supabase.from('session_pricing_snapshots') as any).insert({
            session_id: session.id,
            pricing_rule_id: ruleApplied.id,
            applied_rate_cents: ruleApplied.amount_cents,
            applied_rate_type: ruleApplied.rate_type
        })
    } else {
        // Fallback record (optional, or handle differently)
    }

    // 4. Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        metadata: {
            sessionId: session.id,
            propertyId: propertyId,
            app: 'cashphalt'
        },
        automatic_payment_methods: { enabled: true }
    })

    // 5. Build return object
    return {
        clientSecret: paymentIntent.client_secret,
        sessionId: session.id,
        amountCents
    }
}
