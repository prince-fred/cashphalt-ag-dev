'use server'

import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe'
import { calculatePrice, calculatePriceForRule } from '@/lib/parking/pricing'
import { addMinutes } from 'date-fns'

interface CreateSessionParams {
    propertyId: string
    durationHours?: number // Now optional if ruleId is provided
    ruleId?: string
    plate: string
    customerEmail?: string
    customerPhone?: string
    discountCode?: string
    unitId?: string
}

export async function createParkingSession({ propertyId, durationHours, ruleId, plate, customerEmail, customerPhone, discountCode, unitId }: CreateSessionParams) {
    const supabase = await createClient()

    // 1. Calculate Price Authoritatively
    const startTime = new Date()
    let priceResult;

    if (ruleId) {
        priceResult = await calculatePriceForRule(propertyId, ruleId, discountCode)
    } else if (durationHours) {
        priceResult = await calculatePrice(propertyId, startTime, durationHours, discountCode)
    } else {
        throw new Error("Must provide either ruleId or durationHours")
    }

    const { amountCents, ruleApplied, discountApplied, discountAmountCents } = priceResult

    // Determine duration
    let finalDurationMinutes = 0
    if (ruleApplied?.max_duration_minutes) {
        finalDurationMinutes = ruleApplied.max_duration_minutes
    } else if (durationHours) {
        finalDurationMinutes = durationHours * 60
    } else {
        // Fallback or Error
        finalDurationMinutes = 60 // Should not happen if validation is good
    }

    // 2. Create Session in DB
    const endTimeInitial = addMinutes(startTime, finalDurationMinutes)

    // If free, status is ACTIVE immediately
    const initialStatus = amountCents === 0 ? 'ACTIVE' : 'PENDING_PAYMENT'

    const { data: session, error: sessionError } = await (supabase
        .from('sessions') as any)
        .insert({
            property_id: propertyId,
            start_time: startTime.toISOString(),
            end_time_initial: endTimeInitial.toISOString(),
            end_time_current: endTimeInitial.toISOString(),
            total_price_cents: amountCents,
            status: initialStatus,
            vehicle_plate: plate,
            customer_email: customerEmail,
            customer_phone: customerPhone,
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

    // 3. Create Session Snapshot
    if (ruleApplied) {
        await (supabase.from('session_pricing_snapshots') as any).insert({
            session_id: session.id,
            pricing_rule_id: ruleApplied.id,
            applied_rate_cents: ruleApplied.amount_cents,
            applied_rate_type: ruleApplied.rate_type
        })
    }

    // 4. Handle Payment (or lack thereof)
    if (amountCents > 0) {
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

        // Update Session with Payment Intent ID
        await (supabase.from('sessions') as any)
            .update({ payment_intent_id: paymentIntent.id })
            .eq('id', session.id)

        return {
            clientSecret: paymentIntent.client_secret,
            sessionId: session.id,
            amountCents
        }
    } else {
        // Free Session
        return {
            clientSecret: null,
            sessionId: session.id,
            amountCents: 0
        }
    }
}
