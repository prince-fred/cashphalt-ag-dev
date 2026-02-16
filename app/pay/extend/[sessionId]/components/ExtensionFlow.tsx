'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/db-types'
import { twMerge } from 'tailwind-merge'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { extendSession } from '@/actions/extension'
import { getParkingPrice } from '@/actions/parking'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, CreditCard, ArrowRight, ArrowLeft, Clock, Plus, Minus } from 'lucide-react'
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

// Helper hook for hydration-safe time (reused from ParkingFlowForm logic)
function useClientTime(durationMinutes: number, baseTimeMs?: number) {
    const [timeStr, setTimeStr] = useState<string>('--:--')

    useEffect(() => {
        const start = baseTimeMs || Date.now()
        const date = new Date(start + durationMinutes * 60 * 1000)
        setTimeStr(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, [durationMinutes, baseTimeMs])

    return timeStr
}

export function ExtensionFlow({ session, property }: ExtensionFlowProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [duration, setDuration] = useState(1)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [priceCents, setPriceCents] = useState<number>(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const [checkingPrice, setCheckingPrice] = useState(false)

    const minHours = 1
    const maxHours = Math.min(24, property.max_booking_duration_hours)

    // Calculate expiration based on current session end time
    // @ts-ignore: end_time_current missing from generated types
    const currentEndMs = new Date((session as any).end_time_current || session.end_time).getTime()
    const clientTimeStr = useClientTime(duration * 60, currentEndMs)

    // Fetch Price Effect
    useEffect(() => {
        const fetchPrice = async () => {
            setCheckingPrice(true)
            try {
                // Fetch price for the *extension duration*
                const res = await getParkingPrice(property.id, duration)
                // Add the Service Fee ($1.00) to the displayed estimate
                // The backend extendSession adds it, so we should show it here too
                // The getParkingPrice returns just the parking rate
                // So Total = Rate + 100
                const rate = res.amountCents
                const total = rate > 0 ? rate + 100 : 0
                setPriceCents(total)
            } catch (e) {
                console.error("Failed to fetch extension price:", e)
            } finally {
                setCheckingPrice(false)
            }
        }

        fetchPrice()
    }, [property.id, duration])

    const handleExtendInit = async () => {
        setIsProcessing(true)
        try {
            const result = await extendSession({
                sessionId: session.id,
                durationHours: duration
            })

            if (result.success && !result.clientSecret) {
                // Free extension success
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
                    {/* Stepper UI */}
                    <div>
                        <label className="block text-sm font-bold text-matte-black uppercase tracking-wide mb-3 flex items-center gap-2">
                            Full Hours to Add
                        </label>

                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border-2 border-slate-outline">
                            <Button
                                variant="outline"
                                onClick={() => setDuration(Math.max(minHours, duration - 1))}
                                disabled={duration <= minHours}
                                className="h-16 w-16 rounded-xl border-2 hover:bg-slate-200 shrink-0"
                            >
                                <Minus size={28} />
                            </Button>

                            <div className="text-center flex-1 mx-4">
                                <div className="text-4xl font-bold font-mono text-matte-black">
                                    {duration}<span className="text-lg font-sans font-medium text-gray-500 uppercase ml-1">h</span>
                                </div>
                                <div className="text-sm font-medium text-gray-500 mt-1">
                                    Additional Time
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => setDuration(Math.min(maxHours, duration + 1))}
                                disabled={duration >= maxHours}
                                className="h-16 w-16 rounded-xl border-2 hover:bg-slate-200 shrink-0"
                            >
                                <Plus size={28} />
                            </Button>
                        </div>
                    </div>

                    <div className="bg-concrete-grey p-4 rounded-xl flex justify-between items-center border border-slate-outline">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-md border border-slate-outline">
                                <Clock size={18} className="text-matte-black" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium mb-0.5">New Expiration</p>
                                <p className="font-mono font-bold text-matte-black">
                                    {clientTimeStr}
                                </p>
                            </div>
                        </div>
                        <span className="font-bold text-gray-500 text-sm uppercase">Estimated Cost</span>
                        {checkingPrice ? (
                            <div className="h-6 w-20 bg-gray-200 animate-pulse rounded" />
                        ) : (
                            <span className="font-bold text-xl text-matte-black">
                                {priceCents === 0 ? 'FREE' : `$${(priceCents / 100).toFixed(2)}`}
                            </span>
                        )}
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
                    <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="mb-6 px-0 pl-2 pr-4 h-10 text-sm gap-2 text-gray-600"
                    >
                        <ArrowLeft size={16} /> Back to Duration
                    </Button>

                    <div className="bg-concrete-grey rounded-xl p-5 mb-6 border border-slate-outline">
                        <h3 className="font-bold text-lg mb-4 text-matte-black border-b border-slate-200 pb-2">Extension Summary</h3>

                        <div className="space-y-2 text-slate-600">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Extra Duration</span>
                                <span className="font-bold text-right">{duration} Hours</span>
                            </div>
                            {/* We know total is priceCents. Service fee is 100. Parking is Total - 100 */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Parking Fee</span>
                                <span className="font-medium">${(Math.max(0, priceCents - 100) / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Service Fee</span>
                                <span className="font-medium">$1.00</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                                <span className="font-bold text-lg text-gray-800">Total Due</span>
                                <span className="font-bold text-2xl text-matte-black">${(priceCents / 100).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <Elements stripe={stripePromise} options={{
                        clientSecret,
                        appearance: { theme: 'flat' }
                    }}>
                        <ExtensionPaymentForm session={session} duration={duration} />
                    </Elements>
                </div>
            )}
        </div>
    )
}

function ExtensionPaymentForm({ session, duration }: { session: Session, duration: number }) {
    const stripe = useStripe()
    const elements = useElements()
    const [msg, setMsg] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsProcessing(true)

        // Calculate expected end to pass to success page (optimistic UI)
        // @ts-ignore
        const currentEndMs = new Date((session as any).end_time_current || session.end_time).getTime()
        const expectedEndMs = currentEndMs + (duration * 60 * 60 * 1000)

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href + `/success?expected_end=${expectedEndMs}`,
            }
        })

        if (error) setMsg(error.message ?? 'Payment failed')
        setIsProcessing(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {msg && <div className="text-error-red text-sm font-medium bg-red-50 p-3 rounded-md border border-red-100">{msg}</div>}
            <Button disabled={!stripe || isProcessing} className="w-full h-12">
                {isProcessing ? 'Processing...' : 'Pay Extension'}
            </Button>
        </form>
    )
}
