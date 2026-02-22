'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { calculatePrice } from '@/lib/parking/pricing'
import { addMinutes, differenceInHours } from 'date-fns'
import { sendSessionReceipt } from '@/lib/notifications'

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
                name,
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

    // 5. Calculate Fees & Splits
    const SERVICE_FEE_CENTS = 100
    // Final Amount = Parking Rate + Service Fee
    // If original amount was 0 (free extension), we might still charge service fee? 
    // Usually extensions are paid. If amountCents is 0, let's keep it free (no service fee).
    const finalAmountCents = amountCents > 0 ? amountCents + SERVICE_FEE_CENTS : 0

    // Fetch Org Details for Split
    // Use Admin client to bypass RLS and read organization's stripe_connect_id securely
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: property } = await supabaseAdmin
        .from('properties')
        .select(`
            organizations (
                stripe_connect_id,
                platform_fee_percent
            )
        `)
        .eq('id', session.property_id)
        .single()

    // Supabase types might infer organizations as an array for this join
    const org = Array.isArray(property?.organizations) ? property.organizations[0] : property?.organizations
    const platformFeePercent = org?.platform_fee_percent || 10
    const stripeConnectId = org?.stripe_connect_id

    // 6. Handle Payment (or Free)
    // Stripe minimum is $0.50. current finalAmountCents includes $1.00 service fee if > 0.
    if (finalAmountCents < 50) {
        // FREE Extension / Below Stripe Limit -> Grant immediately
        if (amountCents > 0) console.warn(`Extension amount ${finalAmountCents} is below Stripe min. Treating as free.`)

        const { error: updateError } = await (supabase
            .from('sessions') as any)
            .update({
                end_time_current: newEnd.toISOString(),
                // Add to total price? Technically we didn't collect it. 
                // Let's assume we don't add uncollected amounts.
            })
            .eq('id', sessionId)

        if (updateError) throw new Error("Failed to extend session")

        // Fetch Unit Name for receipt
        let unitName = null
        // @ts-ignore db-types mismatch
        if (session.spot_id) {
            const { data: unit } = await (supabase
                .from('parking_units') as any)
                .select('name')
                // @ts-ignore
                .eq('id', session.spot_id)
                .single()
            if (unit) unitName = unit.name
        }

        // Send Receipt (even if free)
        await sendSessionReceipt({
            toEmail: session.customer_email,
            toPhone: session.customer_phone,
            plate: session.vehicle_plate,
            propertyName: (session.properties as any)?.name || 'Parking Lot',
            unitName,
            amountCents: 0,
            endTime: newEnd,
            link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://cashphalt.com'}/pay/extend/${sessionId}`,
            timezone: propertyTimezone || 'UTC',
            type: 'EXTENSION'
        }).catch(err => console.error('Failed to send free extension receipt:', err))

        return {
            clientSecret: null, // No payment needed
            amountCents: 0,
            newEndTime: newEnd.toISOString(),
            success: true
        }
    }

    // 7. Create Payment Intent
    const platformShare = Math.round(amountCents * (platformFeePercent / 100))
    const totalApplicationFee = SERVICE_FEE_CENTS + platformShare

    const paymentIntentParams: any = {
        amount: finalAmountCents,
        currency: 'usd',
        metadata: {
            sessionId: session.id,
            propertyId: session.property_id,
            type: 'EXTENSION',
            durationHours: durationHours.toString()
        },
        automatic_payment_methods: { enabled: true }
    }

    // Add Connect logic if ID exists
    if (stripeConnectId) {
        console.log(`[Extension] Creating PaymentIntent with Connect ID: ${stripeConnectId}`)
        console.log(`[Extension] Application Fee: ${totalApplicationFee} (Service: ${SERVICE_FEE_CENTS}, Platform Share: ${platformShare})`)
        paymentIntentParams.application_fee_amount = totalApplicationFee
        paymentIntentParams.transfer_data = {
            destination: stripeConnectId,
        }
    } else {
        console.log('[Extension] Creating PaymentIntent WITHOUT Connect ID (Platform only)')
        // Fallback: Platform keeps everything (Service Fee + Parking Rate)
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    return {
        clientSecret: paymentIntent.client_secret,
        amountCents: finalAmountCents, // Return the TOTAL amount the user needs to pay
        newEndTime: newEnd.toISOString()
    }
}
