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
    const { data: session, error: sessionError } = await (supabase
        .from('sessions') as any)
        .select(`
            *,
            properties (
                max_booking_duration_hours,
                timezone
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
    const propertyTimezone = session.properties?.timezone

    if (totalDurationHours > maxDuration) {
        throw new Error(`Cannot extend. Total duration would exceed limit of ${maxDuration} hours.`)
    }

    // 3. Calculate Price for the Extension
    // Price based on the extension start time (which is the current end time)
    const { amountCents, ruleApplied } = await calculatePrice(session.property_id, currentEnd, durationHours, undefined, propertyTimezone)

    // 4. Create Snapshot Logic (Audit)
    if (ruleApplied) {
        await (supabase.from('session_pricing_snapshots') as any).insert({
            session_id: session.id,
            pricing_rule_id: ruleApplied.id,
            applied_rate_cents: ruleApplied.amount_cents,
            applied_rate_type: ruleApplied.rate_type
        })
    }

    // 5. Handle Payment (or Free)
    // Stripe minimum is $0.50 usually.
    if (amountCents < 50) {
        // FREE Extension / Below Stripe Limit -> Grant immediately
        // Log warning if it was supposed to be paid but calculated low? 
        if (amountCents > 0) console.warn(`Extension amount ${amountCents} is below Stripe min. Treating as free.`)

        const { error: updateError } = await (supabase
            .from('sessions') as any)
            .update({
                end_time_current: newEnd.toISOString(),
                // Add to total price? Technically we didn't collect it. 
                // Let's assume we don't add uncollected amounts.
            })
            .eq('id', sessionId)

        if (updateError) throw new Error("Failed to extend session")

        return {
            clientSecret: null, // No payment needed
            amountCents: 0,
            newEndTime: newEnd.toISOString(),
            success: true
        }
    }

    // 6. Create Payment Intent
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
