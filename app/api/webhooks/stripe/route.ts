
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendSessionReceipt } from '@/lib/notifications'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabase = createAdminClient()

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                // Retrieve metadata
                const { sessionId, type, durationHours } = paymentIntent.metadata

                if (sessionId) {
                    const transactionType = type === 'EXTENSION' ? 'EXTENSION' : 'INITIAL'

                    console.log(`[Stripe] Payment Succeeded. Session: ${sessionId}, Type: ${transactionType}, Amount: ${paymentIntent.amount}`)

                    // 1. Log Transaction
                    const { error: txError } = await (supabase
                        .from('session_transactions') as any)
                        .insert({
                            session_id: sessionId,
                            payment_intent_id: paymentIntent.id,
                            amount_cents: paymentIntent.amount,
                            status: 'succeeded',
                            type: transactionType
                        })

                    if (txError) {
                        console.error('[Stripe] Transaction Log Error:', txError)
                    } else {
                        console.log('[Stripe] Transaction Logged Successfully')
                    }

                    // 2. Fetch Session Details for Notification & Logic
                    const { data: sessionData, error: fetchError } = await (supabase
                        .from('sessions') as any)
                        .select('*, properties(name)')
                        .eq('id', sessionId)
                        .single()

                    if (sessionData && !fetchError) {
                        let newEndTime = sessionData.end_time_current

                        // 3. Update Session State
                        if (transactionType === 'EXTENSION') {
                            const addedHours = parseFloat(durationHours || '0')
                            const currentEnd = new Date(sessionData.end_time_current)
                            newEndTime = new Date(currentEnd.getTime() + addedHours * 60 * 60 * 1000).toISOString()

                            const { error: updateError } = await (supabase
                                .from('sessions') as any)
                                .update({
                                    end_time_current: newEndTime,
                                    total_price_cents: (sessionData.total_price_cents || 0) + paymentIntent.amount
                                })
                                .eq('id', sessionId)

                            if (updateError) console.error('[Stripe] Ext Session Update Error:', updateError)
                            else console.log(`[Stripe] Extended session to ${newEndTime}`)

                        } else {
                            // INITIAL
                            const { error: updateError } = await (supabase
                                .from('sessions') as any)
                                .update({
                                    status: 'ACTIVE',
                                    payment_intent_id: paymentIntent.id
                                })
                                .eq('id', sessionId)

                            if (updateError) console.error('[Stripe] Init Session Update Error:', updateError)
                            else console.log('[Stripe] Session Activated')
                        }

                        // 4. Send Notifications
                        await sendSessionReceipt({
                            toEmail: sessionData.customer_email,
                            toPhone: null,
                            plate: sessionData.vehicle_plate,
                            propertyName: (sessionData.properties as any)?.name || 'Parking Lot',
                            amountCents: paymentIntent.amount,
                            endTime: new Date(newEndTime),
                            link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://cashphalt.com'}/pay/extend/${sessionId}`
                        })

                    } else {
                        console.error('[Stripe] Failed to fetch session details:', fetchError)
                    }

                } else {
                    console.warn('[Stripe] Missing sessionId in metadata:', paymentIntent.metadata)
                }
                break;

            case 'payment_intent.payment_failed':
                console.log('[Stripe] Payment Failed:', event.data.object.id)
                break;
        }
    } catch (err) {
        console.error('[Stripe] Handler Exception:', err)
        return new NextResponse('Webhook handler failed', { status: 500 })
    }

    return NextResponse.json({ received: true })
}
