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
                const { sessionId } = paymentIntent.metadata

                if (sessionId) {
                    console.log(`[Stripe] Payment Succeeded for Session: ${sessionId}`)

                    const { error } = await supabase
                        .from('sessions')
                        .update({
                            status: 'ACTIVE',
                            payment_intent_id: paymentIntent.id
                        })
                        .eq('id', sessionId)

                    if (error) {
                        console.error('[Stripe] DB Update Error:', error)
                        return new NextResponse('Database update failed', { status: 500 })
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
