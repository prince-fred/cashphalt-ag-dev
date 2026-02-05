'use server'

import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe'
import { calculatePrice } from '@/lib/parking/pricing'
import { addMinutes, differenceInHours } from 'date-fns'

interface ExtendSessionParams {
    sessionId: string
    durationHours: number
}

export async function extendSession({ sessionId, durationHours }: ExtendSessionParams) {
    const supabase = await createClient()

    // 1. Fetch Session
    const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
            *,
            properties (
                max_booking_duration_hours
            )
        `)
        .eq('id', sessionId)
        .single()

    if (sessionError || !session) {
        throw new Error('Session not found')
    }

    // 2. Validate Duration Cap
    const currentEnd = new Date(session.end_time_current)
    const newEnd = addMinutes(currentEnd, durationHours * 60)
    const startTime = new Date(session.start_time)

    // Total duration in hours (approx)
    const totalDurationHours = differenceInHours(newEnd, startTime)

    // @ts-ignore join types
    const maxDuration = session.properties?.max_booking_duration_hours || 24

    if (totalDurationHours > maxDuration) {
        throw new Error(`Cannot extend. Total duration would exceed limit of ${maxDuration} hours.`)
    }

    // 3. Calculate Price for the Extension
    // Price based on the extension start time (which is the current end time)
    const { amountCents, ruleApplied } = await calculatePrice(session.property_id, currentEnd, durationHours)

    if (amountCents === 0) {
        // Free extension? Just update DB directly?
        // For MVP, handle via stripe even if $0 (stripe might error if <$0.50).
        // If $0, skip stripe.
    }

    // 4. Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        metadata: {
            sessionId: session.id,
            propertyId: session.property_id,
            type: 'EXTENSION',
            durationHours: durationHours.toString()
        },
        automatic_payment_methods: { enabled: true }
    })

    return {
        clientSecret: paymentIntent.client_secret,
        amountCents,
        newEndTime: newEnd.toISOString()
    }
}
