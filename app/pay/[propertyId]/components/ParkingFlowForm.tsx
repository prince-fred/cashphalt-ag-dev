'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/db-types'
import { Clock, CreditCard, Car, CheckCircle2, ArrowRight, ArrowLeft, Tag, MapPin, Info, Plus, Minus } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createParkingSession } from '@/actions/checkout'
import { getParkingPrice } from '@/actions/parking'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Helper hook for hydration-safe time
function useClientTime(durationMinutes: number) {
    const [timeStr, setTimeStr] = useState<string>('--:--')

    useEffect(() => {
        const date = new Date(Date.now() + durationMinutes * 60 * 1000)
        setTimeStr(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, [durationMinutes])

    return timeStr
}

// Initialize Stripe
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) {
    console.error("Stripe Publishable Key is missing!");
}
const stripePromise = loadStripe(publishableKey!);

type Property = Database['public']['Tables']['properties']['Row']
type PricingRule = Database['public']['Tables']['pricing_rules']['Row']

interface ParkingFlowFormProps {
    property: Property
    unit?: { id: string, name: string } | null
}

export function ParkingFlowForm({ property, unit }: ParkingFlowFormProps) {
    const [step, setStep] = useState<1 | 2>(1)

    // Duration State
    const minHours = property.min_duration_hours || 1
    const maxHours = property.max_booking_duration_hours || 24
    const [duration, setDuration] = useState(minHours)


    const [plate, setPlate] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [priceCents, setPriceCents] = useState(0)
    const [discountCode, setDiscountCode] = useState('')
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, amount: number } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [checkingPrice, setCheckingPrice] = useState(false)

    // Load price when duration or discount changes
    // Load price when duration changes (using currently applied discount)
    useEffect(() => {
        const fetchPrice = async () => {
            setCheckingPrice(true)
            try {
                // Use the APPLIED discount, not the input text
                const codeToUse = appliedDiscount?.code
                const res = await getParkingPrice(property.id, duration, codeToUse)
                setPriceCents(res.amountCents)

                // If the duration change somehow invalidated the discount (unlikely but possible), sync state
                if (res.discountApplied) {
                    setAppliedDiscount({
                        code: res.discountApplied.code,
                        amount: res.discountAmountCents
                    })
                } else if (codeToUse) {
                    // Code was applied but now rejected? (e.g. usage limit hit in maintime)
                    setAppliedDiscount(null)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setCheckingPrice(false)
            }
        }

        fetchPrice()
    }, [property.id, duration, appliedDiscount?.code])

    const handleApplyPromo = async () => {
        if (!discountCode) return
        setCheckingPrice(true)
        try {
            const res = await getParkingPrice(property.id, duration, discountCode)
            setPriceCents(res.amountCents)
            if (res.discountApplied) {
                setAppliedDiscount({
                    code: res.discountApplied.code,
                    amount: res.discountAmountCents
                })
            } else {
                setAppliedDiscount(null)
                // Optional: Show "Invalid Code" toast or message
            }
        } catch (e) {
            console.error(e)
        } finally {
            setCheckingPrice(false)
        }
    }

    // Helper for display
    const clientTimeStr = useClientTime(duration * 60)

    // Removed handleSelectRule

    // Simplified checkPrice is now part of the effect, but we can keep a manual trigger if needed
    // or just rely on the effect.

    // Step 1 -> 2
    const handleReview = async () => {
        if (!plate || !phone || !customerEmail || !termsAccepted) return

        setIsProcessing(true)
        try {
            const result = await createParkingSession({
                propertyId: property.id,
                durationHours: duration, // We need to update createParkingSession to accept durationHours instead of/in addition to ruleId
                plate,
                customerEmail,
                customerPhone: phone,
                discountCode: appliedDiscount?.code,
                unitId: unit?.id
            })

            setPriceCents(result.amountCents)

            if (result.clientSecret) {
                setClientSecret(result.clientSecret)
                setStep(2)
            } else if (result.amountCents === 0 && result.sessionId) {
                // Free session succes
                window.location.href = `/pay/${property.id}/success?session_id=${result.sessionId}`
            } else {
                console.error("No client secret returned", result);
                alert("Something went wrong. Please try again.")
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
                {[1, 2].map((s) => (
                    <div key={s} className={twMerge(
                        "h-1.5 flex-1 rounded-full transition-all duration-300",
                        step >= s ? "bg-signal-yellow" : "bg-slate-100"
                    )} />
                ))}
            </div>

            <div className="min-h-[300px]">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
                        {unit && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-md text-blue-700">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">Current Location</p>
                                    <p className="text-lg font-bold text-blue-900">{unit.name}</p>
                                </div>
                            </div>
                        )}

                        {/* PART 1: DURATION SELECTION (STEPPER STYLE) */}
                        <div>
                            <label className="block text-sm font-bold text-matte-black uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="bg-matte-black text-signal-yellow w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                Select Duration
                            </label>

                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border-2 border-slate-outline">
                                <Button
                                    variant="outline"
                                    onClick={() => setDuration(prev => Math.max(minHours, prev - 1))}
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
                                        {duration === 1 ? 'Hour' : 'Hours'}
                                    </div>
                                    {priceCents > 0 && (
                                        <div className="inline-block mt-2 font-bold text-signal-yellow bg-matte-black px-3 py-1 rounded-full text-sm">
                                            ${(priceCents / 100).toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setDuration(prev => Math.min(maxHours, prev + 1))}
                                    disabled={duration >= maxHours}
                                    className="h-16 w-16 rounded-xl border-2 hover:bg-slate-200 shrink-0"
                                >
                                    <Plus size={28} />
                                </Button>
                            </div>
                        </div>


                        {/* PART 2: SUMMARY & PROMO */}
                        <div className="bg-concrete-grey p-5 rounded-xl border border-slate-outline animate-in slide-in-from-bottom-2 fade-in duration-300 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-md border border-slate-outline">
                                        <Clock size={18} className="text-matte-black" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">Expires At</p>
                                        <p className="font-mono font-bold text-matte-black">
                                            {clientTimeStr}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-600 uppercase">Total</p>
                                    {checkingPrice ? (
                                        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                                    ) : appliedDiscount ? (
                                        <div>
                                            <p className="text-sm text-gray-400 line-through decoration-red-500">
                                                {/* We don't have base price easily available unless checkingPrice returns it, let's just show final */}
                                                {/* ${(selectedRule.amount_cents / 100).toFixed(2)} */}
                                            </p>
                                            <p className="text-2xl font-bold text-signal-yellow bg-matte-black px-2 rounded">
                                                ${(priceCents / 100).toFixed(2)}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-2xl font-bold text-matte-black">
                                            {priceCents === 0 ? 'FREE' : `$${(priceCents / 100).toFixed(2)}`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Promocode */}
                            <div className="flex gap-2 items-center pt-2 border-t border-slate-200">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-3 top-3 text-gray-500" size={16} />
                                    <Input
                                        placeholder="Promocode"
                                        className="pl-9 h-10 text-sm uppercase text-matte-black font-medium bg-white"
                                        value={discountCode}
                                        onChange={e => setDiscountCode(e.target.value.toUpperCase().trim())}
                                    />
                                </div>
                                {/* Auto-applies via effect, button is just visual feedback or force re-check */}
                                <Button
                                    variant="outline"
                                    className="h-10 text-xs px-3 bg-white"
                                    disabled={checkingPrice || !discountCode || (!!appliedDiscount && appliedDiscount.code === discountCode)}
                                    onClick={handleApplyPromo}
                                >
                                    {checkingPrice ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-matte-black/30 border-t-matte-black rounded-full" />
                                    ) : appliedDiscount ? (
                                        <span className="text-green-600 font-bold">Applied</span>
                                    ) : (
                                        'Apply'
                                    )}
                                </Button>
                            </div>
                        </div>


                        {/* PART 3: VEHICLE & CONTACT DETAILS */}
                        <div className="space-y-5 pt-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                            <label className="block text-sm font-bold text-matte-black uppercase tracking-wide flex items-center gap-2">
                                <span className="bg-matte-black text-signal-yellow w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                Enter Details
                            </label>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">
                                    License Plate
                                </label>
                                <div className="relative">
                                    <Car className="absolute left-4 top-4 text-gray-500" size={20} />
                                    <Input
                                        type="text"
                                        placeholder="ABC 123"
                                        value={plate}
                                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                        className="pl-12 font-mono text-xl uppercase h-14 border-2 focus-visible:border-matte-black"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="(555) 123-4567"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="h-12"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 ml-1">
                                        Email Receipt <span className="text-red-500">*</span>
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

                            {/* Terms and Conditions Checkbox */}
                            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex bg-white h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-300 has-[:checked]:bg-matte-black has-[:checked]:border-matte-black focus-within:ring-2 focus-within:ring-matte-black/20">
                                    <input
                                        id="terms"
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="h-4 w-4 opacity-0 absolute cursor-pointer"
                                    />
                                    <CheckCircle2 size={14} className={`text-signal-yellow transition-opacity pointer-events-none ${termsAccepted ? 'opacity-100' : 'opacity-0'}`} />
                                </div>
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="terms"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-700"
                                    >
                                        I agree to the <a href="/terms" target="_blank" className="underline font-bold text-matte-black hover:text-blue-600">Terms and Conditions</a>
                                    </label>
                                    <p className="text-xs text-muted-foreground text-gray-500">
                                        By checking this box, you agree to our terms of service and privacy policy.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleReview}
                            className="w-full h-14 text-lg mt-4"
                            disabled={!plate || !phone || !customerEmail || !termsAccepted || isProcessing}
                        >
                            {isProcessing ? (
                                <div className="animate-spin w-5 h-5 border-2 border-matte-black/30 border-t-matte-black rounded-full" />
                            ) : (
                                <>
                                    Review & Pay <ArrowRight size={20} className="ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {step === 2 && clientSecret && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <Button
                            variant="outline"
                            onClick={() => setStep(1)}
                            className="mb-6 px-0 pl-2 pr-4 h-10 text-sm gap-2 text-gray-600"
                        >
                            <ArrowLeft size={16} /> Back to Details
                        </Button>

                        <div className="bg-concrete-grey rounded-xl p-5 mb-6 border border-slate-outline">
                            <h3 className="font-bold text-lg mb-4 text-matte-black border-b border-slate-200 pb-2">Order Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-medium">License Plate</span>
                                    <span className="font-mono font-bold text-lg bg-white px-2 py-0.5 rounded border border-slate-outline">{plate}</span>
                                </div>
                                {unit && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 font-medium">Location</span>
                                        <span className="font-bold text-matte-black text-right">{unit.name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-medium">Duration</span>
                                    <span className="font-bold text-right">{duration} Hours</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-medium">Contact</span>
                                    <span className="font-medium text-right text-sm">{customerEmail}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t-2 border-slate-200 space-y-2">
                                <div className="flex justify-between items-center text-slate-600">
                                    <span className="text-sm font-medium">Parking Fee</span>
                                    <span className="font-medium">${(priceCents / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span className="text-sm font-medium">Service Fee</span>
                                    <span className="font-medium">$1.00</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    <span className="font-bold text-lg text-gray-800">Total Due</span>
                                    <span className="font-bold text-2xl text-matte-black">${((priceCents + 100) / 100).toFixed(2)}</span>
                                </div>
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
        </div >
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
            <PaymentElement
                onReady={(element) => {
                    console.log("[PaymentElement] Ready. Available methods check:", element)
                    // Unfortunately element.s doesn't expose methods directly in public API, 
                    // but we can log that it mounted.
                }}
                onChange={(event) => {
                    console.log("[PaymentElement] Change:", event)
                }}
                options={{
                    wallets: {
                        applePay: 'auto',
                        googlePay: 'auto'
                    }
                }}
            />
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
