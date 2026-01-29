'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/database.types'
import { Clock, CreditCard, Car, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createParkingSession } from '@/actions/checkout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Helper hook for hydration-safe time
function useClientTime(durationHours: number) {
    const [timeStr, setTimeStr] = useState<string>('--:--')

    useEffect(() => {
        const date = new Date(Date.now() + durationHours * 60 * 60 * 1000)
        setTimeStr(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, [durationHours])

    return timeStr
}

// Initialize Stripe
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) {
    console.error("Stripe Publishable Key is missing!");
}
const stripePromise = loadStripe(publishableKey!);

type Property = Database['public']['Tables']['properties']['Row']

interface ParkingFlowFormProps {
    property: Property
}

export function ParkingFlowForm({ property }: ParkingFlowFormProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [duration, setDuration] = useState(1) // Hours
    const [plate, setPlate] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [priceCents, setPriceCents] = useState(500) // Default fallback
    const [isProcessing, setIsProcessing] = useState(false)

    // Step 1 -> 2
    const handleDurationSelect = (hr: number) => {
        setDuration(hr)
    }

    // Step 2 -> 3
    const handleReview = async () => {
        setIsProcessing(true)
        try {
            const result = await createParkingSession({
                propertyId: property.id,
                durationHours: duration,
                plate,
                customerEmail
            })

            setPriceCents(result.amountCents)
            if (result.clientSecret) {
                setClientSecret(result.clientSecret)
                setStep(3)
            } else {
                console.error("No client secret returned", result);
            }
        } catch (err) {
            console.error(err)
            alert("Failed to initialize payment. Please try again.")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Minimal Stepper */}
            <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={twMerge(
                        "h-1.5 flex-1 rounded-full transition-all duration-300",
                        step >= s ? "bg-signal-yellow" : "bg-slate-100"
                    )} />
                ))}
            </div>

            <div className="min-h-[300px]">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-matte-black uppercase tracking-wide mb-3">
                                Select Duration
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 8, 12, 24].map((hr) => (
                                    <button
                                        key={hr}
                                        onClick={() => handleDurationSelect(hr)}
                                        disabled={hr > property.max_booking_duration_hours}
                                        className={twMerge(
                                            "relative py-4 rounded-lg font-bold text-lg border-2 transition-all active:scale-95",
                                            duration === hr
                                                ? "border-matte-black bg-matte-black text-signal-yellow shadow-md"
                                                : "border-slate-outline bg-white text-matte-black hover:border-matte-black",
                                            hr > property.max_booking_duration_hours && "opacity-20 cursor-not-allowed border-none bg-slate-50"
                                        )}
                                    >
                                        {hr}h
                                        {duration === hr && (
                                            <div className="absolute -top-2 -right-2 bg-signal-yellow text-matte-black rounded-full p-1 shadow-sm">
                                                <CheckCircle2 size={12} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-concrete-grey p-5 rounded-xl flex items-center justify-between border border-slate-outline">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-md border border-slate-outline">
                                    <Clock size={18} className="text-matte-black" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Ends At</p>
                                    <p className="font-mono font-bold text-matte-black">
                                        {useClientTime(duration)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-500 uppercase">Total</p>
                                <p className="text-2xl font-bold text-matte-black">
                                    ${(duration * 5).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <Button onClick={() => setStep(2)} className="w-full h-14 text-lg">
                            Continue <ArrowRight size={20} className="ml-2" />
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-matte-black uppercase tracking-wide mb-2">
                                    License Plate
                                </label>
                                <div className="relative">
                                    <Car className="absolute left-4 top-4 text-gray-400" size={20} />
                                    <Input
                                        type="text"
                                        placeholder="ABC 123"
                                        value={plate}
                                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                        className="pl-12 font-mono text-xl uppercase h-14 border-2 focus-visible:border-matte-black"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-matte-black uppercase tracking-wide mb-2">
                                    Email Receipt <span className="text-gray-400 normal-case font-normal">(Optional)</span>
                                </label>
                                <Input
                                    type="email"
                                    placeholder="you@email.com"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    className="h-12"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="w-14 px-0 flex-none"
                            >
                                <ArrowLeft size={20} />
                            </Button>
                            <Button
                                onClick={handleReview}
                                disabled={!plate || isProcessing}
                                className="flex-1 h-12 text-lg"
                            >
                                {isProcessing ? (
                                    <div className="animate-spin w-5 h-5 border-2 border-matte-black/30 border-t-matte-black rounded-full" />
                                ) : (
                                    'Review & Pay'
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && clientSecret && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-concrete-grey rounded-xl p-5 mb-6 border border-slate-outline">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-500 font-medium">PLATE</span>
                                <span className="font-mono font-bold text-lg bg-white px-2 py-0.5 rounded border border-slate-outline">{plate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 font-medium">DURATION</span>
                                <span className="font-bold">{duration} Hour{duration > 1 ? 's' : ''}</span>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-outline flex justify-between items-center">
                                <span className="font-bold text-lg">Total Due</span>
                                <span className="font-bold text-2xl text-matte-black">${(priceCents / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        <Elements stripe={stripePromise} options={{
                            clientSecret,
                            appearance: {
                                theme: 'flat',
                                variables: {
                                    colorPrimary: '#121212',
                                    colorBackground: '#ffffff',
                                    colorText: '#121212',
                                    colorDanger: '#DC2626',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    borderRadius: '8px',
                                }
                            }
                        }}>
                            <CheckoutForm propertyId={property.id} />
                        </Elements>
                    </div>
                )}
            </div>
        </div>
    )
}

function CheckoutForm({ propertyId }: { propertyId: string }) {
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
                return_url: `${window.location.origin}/pay/${propertyId}/success`,
            }
        })

        if (error) {
            setMsg(error.message ?? 'Payment failed')
        }
        setIsProcessing(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {msg && <div className="text-error-red text-sm font-medium bg-red-50 p-3 rounded-md border border-red-100">{msg}</div>}

            <div className="flex gap-4">
                <Button
                    variant="secondary"
                    className="w-full text-lg h-14"
                    disabled={!stripe || isProcessing}
                >
                    {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Pay Now <CreditCard size={20} className="ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
