'use client'

import { useState } from 'react'
import { Database } from '@/database.types'
import { Clock, CreditCard, Car, CheckCircle2 } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createParkingSession } from '@/actions/checkout'

// Initialize Stripe outside component
// process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should be set
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
        // In a real app, we might fetch the exact price here from an API route to show the user
        // For now we estimate or validte on "Review"
    }

    // Step 2 -> 3
    const handleReview = async () => {
        setIsProcessing(true)
        try {
            // Call server action to create session & get secret
            const result = await createParkingSession({
                propertyId: property.id,
                durationHours: duration,
                plate,
                customerEmail
            })

            setPriceCents(result.amountCents)
            if (result.clientSecret) {
                console.log("Client Secret received:", result.clientSecret);
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
        <div>
            {/* Progress Stepper */}
            <div className="flex items-center justify-between mb-8 px-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex flex-col items-center relative z-10">
                        <div className={twMerge(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300",
                            step >= s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                        )}>
                            {s}
                        </div>
                        {s < 3 && (
                            <div className={twMerge(
                                "absolute top-4 left-6 w-[80px] h-[2px] -z-10",
                                step > s ? "bg-indigo-600" : "bg-slate-100"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Parking Duration
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 8, 12, 24].map((hr) => (
                                <button
                                    key={hr}
                                    onClick={() => handleDurationSelect(hr)}
                                    disabled={hr > property.max_booking_duration_hours}
                                    className={twMerge(
                                        "py-3 px-2 rounded-lg border text-sm font-medium transition-all hover:scale-105 active:scale-95",
                                        duration === hr
                                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                                        hr > property.max_booking_duration_hours && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {hr} Hr{hr > 1 ? 's' : ''}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Clock size={18} />
                                <span className="text-sm">Until {new Date(Date.now() + duration * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {/* Note: This price is CLIENT SIDE estimate until we hit "Review" */}
                            <div className="text-lg font-bold text-slate-900">
                                Est. ${(duration * 5).toFixed(2)}
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                        >
                            Continue <CheckCircle2 size={18} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    License Plate
                                </label>
                                <div className="relative">
                                    <Car className="absolute left-3 top-3.5 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="ABC 123"
                                        value={plate}
                                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-lg uppercase"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Receipt (Optional)
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleReview}
                                disabled={!plate || isProcessing}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 flex justify-center items-center"
                            >
                                {isProcessing ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : 'Review & Pay'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && clientSecret && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-6 border border-slate-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Duration</span>
                                <span className="font-medium">{duration} Hour{duration > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Vehicle</span>
                                <span className="font-mono font-medium">{plate}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-lg">
                                <span className="font-bold text-slate-900">Total</span>
                                <span className="font-bold text-indigo-600">${(priceCents / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        <Elements stripe={stripePromise} options={{
                            clientSecret,
                            appearance: { theme: 'stripe', labels: 'floating' }
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
                // Ensure this route exists!
                return_url: `${window.location.origin}/pay/${propertyId}/success`,
            }
        })

        if (error) {
            setMsg(error.message ?? 'Payment failed')
        }
        setIsProcessing(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {msg && <div className="text-red-500 text-sm">{msg}</div>}
            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        Complete Payment
                        <CreditCard size={18} />
                    </>
                )}
            </button>
        </form>
    )
}
