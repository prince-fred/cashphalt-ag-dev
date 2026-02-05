import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'
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
                    console.log(`[Stripe] Payment Succeeded for Session: ${sessionId} Type: ${type || 'INITIAL'}`)

                    const transactionType = type === 'EXTENSION' ? 'EXTENSION' : 'INITIAL'

                    // 1. Log Transaction
                    const { error: txError } = await supabase
                        .from('session_transactions')
                        .insert({
                            session_id: sessionId,
                            payment_intent_id: paymentIntent.id,
                            amount_cents: paymentIntent.amount,
                            status: 'succeeded',
                            type: transactionType
                        })

                    if (txError) console.error('[Stripe] Transaction Log Error:', txError)

                    // 2. Update Session
                    if (transactionType === 'EXTENSION') {
                        // Fetch current end time to add to it
                        const { data: session } = await supabase
                            .from('sessions')
                            .select('end_time_current, total_price_cents')
                            .eq('id', sessionId)
                            .single()

                        if (session) {
                            // Add hours
                            const addedHours = parseFloat(durationHours || '0')
                            const currentEnd = new Date(session.end_time_current)
                            const newEnd = new Date(currentEnd.getTime() + addedHours * 60 * 60 * 1000)

                            await supabase
                                .from('sessions')
                                .update({
                                    end_time_current: newEnd.toISOString(),
                                    // Update total price context if needed, or just rely on transactions sum
                                    total_price_cents: session.total_price_cents + paymentIntent.amount
                                })
                                .eq('id', sessionId)
                        }

                    } else {
                        // INITIAL
                        await supabase
                            .from('sessions')
                            .update({
                                status: 'ACTIVE',
                                payment_intent_id: paymentIntent.id
                            })
                            .eq('id', sessionId)
                    }
                }
                break;

            case 'payment_intent.payment_failed':
                // Optional: Log failure or notify user
                break;
        }
    } catch (err) {
        console.error(err)
        return new NextResponse('Webhook handler failed', { status: 500 })
    }

    return NextResponse.json({ received: true })
}
