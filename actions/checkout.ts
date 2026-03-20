'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { calculatePrice, calculatePriceForRule } from '@/lib/parking/pricing'
import { addMinutes, parse, isBefore, addDays, set, startOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

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

    // 0. Fetch Property & Org (Moved up)
    // Use an Admin client here to bypass RLS so we can read the organization's stripe_connect_id,
    // even though this server action is called by an anonymous user.
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: property } = await supabaseAdmin
        .from('properties')
        .select('*, organizations(*)')
        .eq('id', propertyId)
        .single()

    if (!property) throw new Error("Property not found")

    const org = property?.organizations
    const platformFeePercent = org?.platform_fee_percent || 10
    const stripeConnectId = org?.stripe_connect_id

    // 1. Calculate Price Authoritatively
    const startTime = new Date()
    let priceResult;

    if (ruleId) {
        priceResult = await calculatePriceForRule(propertyId, ruleId, discountCode)
    } else if (durationHours) {
        // Pass property timezone to avoid re-fetching
        priceResult = await calculatePrice(propertyId, startTime, durationHours, discountCode, property.timezone, unitId)
    } else {
        throw new Error("Must provide either ruleId or durationHours")
    }

    const { amountCents, ruleApplied, discountApplied, discountAmountCents } = priceResult

    // Determine duration
    let finalDurationMinutes = 0

    if (ruleApplied?.max_duration_minutes && ruleApplied.rate_type === 'FLAT') {
        // If it's a FLAT bucket (like an Event Rate), the duration extends to the max bucket duration
        finalDurationMinutes = ruleApplied.max_duration_minutes
    } else if (durationHours) {
        // Otherwise use what the user asked for
        finalDurationMinutes = durationHours * 60
    } else if (ruleApplied?.max_duration_minutes) {
        // Fallback to rule limit
        finalDurationMinutes = ruleApplied.max_duration_minutes
    } else {
        // Ultimate Fallback
        finalDurationMinutes = 60
    }

    let endTimeInitial: Date;
    if (finalDurationMinutes % 1440 === 0 && property.timezone) {
        // Safe Add Days logic preserving Wall Clock time across DST boundaries
        const daysToAdd = finalDurationMinutes / 1440;
        const zonedStart = toZonedTime(startTime, property.timezone);
        const newZonedStart = addDays(zonedStart, daysToAdd);
        endTimeInitial = fromZonedTime(newZonedStart, property.timezone);
    } else {
        endTimeInitial = addMinutes(startTime, finalDurationMinutes);
    }

    // 2. Create Session in DB


    const SERVICE_FEE_CENTS = 100
    // If base price > 0, we add service fee. If free, no fee.
    const finalAmountCents = amountCents > 0 ? amountCents + SERVICE_FEE_CENTS : 0



    // If free, status is ACTIVE immediately
    const initialStatus = finalAmountCents === 0 ? 'ACTIVE' : 'PENDING_PAYMENT'

    const { data: session, error: sessionError } = await (supabase
        .from('sessions') as any)
        .insert({
            property_id: propertyId,
            start_time: startTime.toISOString(),
            end_time_initial: endTimeInitial.toISOString(),
            end_time_current: endTimeInitial.toISOString(),
            total_price_cents: finalAmountCents, // Includes service fee
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
    if (finalAmountCents > 0) {
        // Calculate Fees
        // Service Fee (100) + Platform Fee (% of Parking Rate)
        // Parking Rate = finalAmountCents - SERVICE_FEE_CENTS
        // (We already know this is amountCents)
        const platformShare = Math.round(amountCents * (platformFeePercent / 100))
        const totalApplicationFee = SERVICE_FEE_CENTS + platformShare

        const paymentIntentParams: any = {
            amount: finalAmountCents,
            currency: 'usd',
            metadata: {
                sessionId: session.id,
                propertyId: propertyId,
                type: 'INITIAL',
                durationHours: (finalDurationMinutes / 60).toString(),
                app: 'axis-parking'
            },
            automatic_payment_methods: { enabled: true }
        }

        // Add Connect logic if ID exists
        if (stripeConnectId) {
            console.log(`[Checkout] Creating PaymentIntent with Connect ID: ${stripeConnectId}`)
            console.log(`[Checkout] Application Fee: ${totalApplicationFee} (Service: ${SERVICE_FEE_CENTS}, Platform Share: ${platformShare})`)
            paymentIntentParams.application_fee_amount = totalApplicationFee
            paymentIntentParams.transfer_data = {
                destination: stripeConnectId,
            }
        } else {
            console.log('[Checkout] Creating PaymentIntent WITHOUT Connect ID (Platform only)')
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)
        console.log(`[Checkout] PaymentIntent created: ${paymentIntent.id}`)

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
