'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/db-types'
import { Clock, CreditCard, Car, CheckCircle2, ArrowRight, ArrowLeft, Tag, MapPin, Info } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createParkingSession } from '@/actions/checkout'
import { getParkingPriceForRule, getParkingOptions } from '@/actions/parking'
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
    const [step, setStep] = useState<1 | 2 | 3>(1)

    // Buckets State
    const [buckets, setBuckets] = useState<PricingRule[]>([])
    const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null)
    const [loadingBuckets, setLoadingBuckets] = useState(true)

    const [plate, setPlate] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [priceCents, setPriceCents] = useState(0)
    const [discountCode, setDiscountCode] = useState('')
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string, amount: number } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [checkingPrice, setCheckingPrice] = useState(false)

    // Load buckets on mount
    useEffect(() => {
        const load = async () => {
            const opts = await getParkingOptions(property.id)
            setBuckets(opts)
            setLoadingBuckets(false)
            // Select first option by default? Or let user choose?
            // Let's force user to choose (no default selection) so they see options.
        }
        load()
    }, [property.id])

    // Helper for display
    const currentDurationMinutes = selectedRule?.max_duration_minutes || 60
    const clientTimeStr = useClientTime(currentDurationMinutes)

    const handleSelectRule = async (rule: PricingRule) => {
        setSelectedRule(rule)
        setPriceCents(rule.amount_cents)
        // Reset discount when rule changes because logic might differ (though usually discount applies to total)
        // But we should re-check price if discount is active.
        if (discountCode) {
            setCheckingPrice(true)
            await checkPrice(rule.id, discountCode)
            setCheckingPrice(false)
        } else {
            setAppliedDiscount(null)
            setPriceCents(rule.amount_cents)
        }
    }

    const checkPrice = async (ruleId: string, code: string) => {
        try {
            const res = await getParkingPriceForRule(property.id, ruleId, code)

            if (res.discountApplied) {
                setPriceCents(res.amountCents)
                setAppliedDiscount({
                    code: res.discountApplied.code,
                    amount: res.discountAmountCents
                })
            } else {
                // Invalid code
                setPriceCents(res.amountCents) // Reset to base
                if (code) setAppliedDiscount(null)
            }
        } catch (e) {
            console.error(e)
        }
    }

    // Step 2 -> 3
    const handleReview = async () => {
        if (!selectedRule) return

        setIsProcessing(true)
        try {
            const result = await createParkingSession({
                propertyId: property.id,
                ruleId: selectedRule.id,
                plate,
                customerEmail,
                customerPhone: phone,
                discountCode: appliedDiscount?.code,
                unitId: unit?.id
            })

            setPriceCents(result.amountCents)

            if (result.clientSecret) {
                setClientSecret(result.clientSecret)
                setStep(3)
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
                                Select duration
                            </label>
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

                            {loadingBuckets ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {buckets.map(rule => {
                                        const isSelected = selectedRule?.id === rule.id
                                        return (
                                            <button
                                                key={rule.id}
                                                onClick={() => handleSelectRule(rule)}
                                                className={twMerge(
                                                    "text-left p-4 rounded-xl border-2 transition-all duration-200 flex justify-between items-center group",
                                                    isSelected
                                                        ? "border-signal-yellow bg-yellow-50/50 shadow-md"
                                                        : "border-slate-outline bg-white hover:border-slate-400"
                                                )}
                                            >
                                                <div>
                                                    <p className={twMerge(
                                                        "font-bold text-lg",
                                                        isSelected ? "text-slate-900" : "text-slate-700"
                                                    )}>
                                                        {rule.name ?? `${rule.max_duration_minutes} Minutes`}
                                                    </p>
                                                    {rule.description && (
                                                        <p className="text-sm text-slate-500 mt-0.5">{rule.description}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {rule.amount_cents === 0 ? (
                                                        <span className="inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded text-sm uppercase tracking-wide">
                                                            Free
                                                        </span>
                                                    ) : (
                                                        <span className={twMerge(
                                                            "text-xl font-bold",
                                                            isSelected ? "text-matte-black" : "text-slate-600"
                                                        )}>
                                                            ${(rule.amount_cents / 100).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}

                                    {buckets.length === 0 && (
                                        <div className="text-center py-8 text-slate-500">
                                            No parking options available.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedRule && (
                            <div className="bg-concrete-grey p-5 rounded-xl flex items-center justify-between border border-slate-outline animate-in slide-in-from-bottom-2 fade-in duration-300">
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
                                    {appliedDiscount ? (
                                        <div>
                                            <p className="text-sm text-gray-400 line-through decoration-red-500">
                                                ${(selectedRule.amount_cents / 100).toFixed(2)}
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
                        )}

                        {/* Promo Code Input - Only show if rule selected */}
                        {selectedRule && (
                            <div className="flex gap-2 items-center">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-3 top-3 text-gray-500" size={16} />
                                    <Input
                                        placeholder="Promocode"
                                        className="pl-9 h-10 text-sm uppercase text-matte-black font-medium"
                                        value={discountCode}
                                        onChange={e => setDiscountCode(e.target.value.toUpperCase().trim())}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    className="h-10 text-xs px-3"
                                    onClick={async () => {
                                        if (!selectedRule) return
                                        setCheckingPrice(true)
                                        await checkPrice(selectedRule.id, discountCode)
                                        setCheckingPrice(false)
                                    }}
                                    disabled={checkingPrice || !discountCode}
                                >
                                    {checkingPrice ? '...' : 'Apply'}
                                </Button>
                            </div>
                        )}

                        <Button
                            onClick={() => setStep(2)}
                            className="w-full h-14 text-lg"
                            disabled={!selectedRule}
                        >
                            Continue <ArrowRight size={20} className="ml-2" />
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                        {unit && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                                <div className="bg-blue-100 p-1.5 rounded-md text-blue-700">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Parking at</p>
                                    <p className="text-sm font-bold text-blue-900">{unit.name}</p>
                                </div>
                            </div>
                        )}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-matte-black uppercase tracking-wide mb-2">
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
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-matte-black uppercase tracking-wide mb-2">
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
                                <label className="block text-sm font-bold text-matte-black uppercase tracking-wide mb-2">
                                    Email Receipt <span className="text-gray-500 normal-case font-normal">(Optional)</span>
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
                                disabled={!plate || !phone || isProcessing}
                                className="flex-1 h-12 text-lg"
                            >
                                {isProcessing ? (
                                    <div className="animate-spin w-5 h-5 border-2 border-matte-black/30 border-t-matte-black rounded-full" />
                                ) : (
                                    priceCents === 0 ? 'Start Parking' : 'Review & Pay'
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && clientSecret && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-concrete-grey rounded-xl p-5 mb-6 border border-slate-outline">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-700 font-medium">PLATE</span>
                                <span className="font-mono font-bold text-lg bg-white px-2 py-0.5 rounded border border-slate-outline">{plate}</span>
                            </div>
                            {unit && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-700 font-medium">LOCATION</span>
                                    <span className="font-bold text-matte-black">{unit.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-700 font-medium">OPTION</span>
                                <span className="font-bold">{selectedRule?.name}</span>
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
