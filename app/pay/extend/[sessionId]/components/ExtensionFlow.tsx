'use client'

import { useState } from 'react'
import { Database } from '@/db-types'
import { twMerge } from 'tailwind-merge'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { extendSession } from '@/actions/extension'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, CreditCard, ArrowRight } from 'lucide-react'
import { Slider } from '@/components/ui/Slider'

// Initialize Stripe
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(publishableKey!);

type Session = Database['public']['Tables']['sessions']['Row']
type Property = Database['public']['Tables']['properties']['Row']

interface ExtensionFlowProps {
    session: Session
    property: Property
}

export function ExtensionFlow({ session, property }: ExtensionFlowProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [duration, setDuration] = useState(1)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [priceCents, setPriceCents] = useState<number | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleExtendInit = async () => {
        setIsProcessing(true)
        try {
            const result = await extendSession({
                sessionId: session.id,
                durationHours: duration
            })

            if (result.success && !result.clientSecret) {
                // Free extension success
                // Redirect to success page or show success state
                // Since this is extension, maybe just reload or go to a success view?
                // Let's go to the success page which should handle the session view
                window.location.href = `/pay/${property.id}/success?session_id=${session.id}&extended=true`
                return
            }

            setPriceCents(result.amountCents)
            if (result.clientSecret) {
                setClientSecret(result.clientSecret)
                setStep(2)
            }
        } catch (err) {
            console.error(err)
            alert("Extension failed: " + (err as Error).message)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-6">
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div>
                        <label className="block text-sm font-bold text-matte-black uppercase tracking-wide mb-3">
                            Add Time
                        </label>
                        <div className="px-1 py-4">
                            <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                                <span>1h</span>
                                <span>{duration}h</span>
                                <span>{Math.min(24, property.max_booking_duration_hours)}h</span>
                            </div>
                            <Slider
                                min={1}
                                max={Math.min(24, property.max_booking_duration_hours)}
                                step={1}
                                value={duration}
                                onValueChange={setDuration}
                            />
                        </div>
                    </div>

                    <div className="bg-concrete-grey p-4 rounded-xl flex justify-between items-center border border-slate-outline">
                        <span className="font-bold text-gray-500 text-sm uppercase">Estimated Cost</span>
                        <span className="font-bold text-xl text-matte-black">${(duration * 5).toFixed(2)}</span>
                    </div>

                    <Button
                        onClick={handleExtendInit}
                        disabled={isProcessing}
                        className="w-full h-12 text-lg"
                    >
                        {isProcessing ? 'Processing...' : 'Review & Pay'} <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
            )}

            {step === 2 && clientSecret && (
                <div className="animate-in fade-in slide-in-from-right-4">
                    <div className="bg-concrete-grey rounded-xl p-4 mb-4 border border-slate-outline flex justify-between items-center">
                        <span className="font-bold text-gray-500 text-sm uppercase">Extension</span>
                        <span className="font-bold text-xl text-matte-black">${((priceCents || 0) / 100).toFixed(2)}</span>
                    </div>

                    <Elements stripe={stripePromise} options={{
                        clientSecret,
                        appearance: { theme: 'flat' }
                    }}>
                        <ExtensionPaymentForm />
                    </Elements>
                </div>
            )}
        </div>
    )
}

function ExtensionPaymentForm() {
    const stripe = useStripe()
    const elements = useElements()
    const [msg, setMsg] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stripe || !elements) return
        setIsProcessing(true)

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href + '/success', // Need success page for extensions too?
            }
        })

        if (error) setMsg(error.message ?? 'Payment failed')
        setIsProcessing(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {msg && <div className="text-red-500 text-sm">{msg}</div>}
            <Button disabled={!stripe || isProcessing} className="w-full h-12">
                {isProcessing ? 'Processing...' : 'Pay Extension'}
            </Button>
        </form>
    )
}
