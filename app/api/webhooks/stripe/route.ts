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
                    const transactionType = type === 'EXTENSION' ? 'EXTENSION' : 'INITIAL'

                    console.log(`[Stripe] Payment Succeeded. Session: ${sessionId}, Type: ${transactionType}, Amount: ${paymentIntent.amount}`)

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

                    if (txError) {
                        console.error('[Stripe] Transaction Log Error:', txError)
                        console.error('[Stripe] Tx Context:', { sessionId, pi: paymentIntent.id })
                    } else {
                        console.log('[Stripe] Transaction Logged Successfully')
                    }

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

                            const { error: updateError } = await supabase
                                .from('sessions')
                                .update({
                                    end_time_current: newEnd.toISOString(),
                                    total_price_cents: (session.total_price_cents || 0) + paymentIntent.amount
                                })
                                .eq('id', sessionId)

                            if (updateError) console.error('[Stripe] Ext Session Update Error:', updateError)
                            else console.log(`[Stripe] Extended session to ${newEnd.toISOString()}`)
                        } else {
                            console.error('[Stripe] Session not found for extension:', sessionId)
                        }

                    } else {
                        // INITIAL
                        const { error: updateError } = await supabase
                            .from('sessions')
                            .update({
                                status: 'ACTIVE',
                                payment_intent_id: paymentIntent.id
                            })
                            .eq('id', sessionId)

                        if (updateError) console.error('[Stripe] Init Session Update Error:', updateError)
                        else console.log('[Stripe] Session Activated')
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
