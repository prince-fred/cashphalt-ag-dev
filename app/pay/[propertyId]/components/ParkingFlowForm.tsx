'use client'

import { useState } from 'react'
import { Database } from '@/database.types'
import { Clock, CreditCard, Car, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type Property = Database['public']['Tables']['properties']['Row']

interface ParkingFlowFormProps {
    property: Property
}

export function ParkingFlowForm({ property }: ParkingFlowFormProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [duration, setDuration] = useState(1) // Hours
    const [plate, setPlate] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    // Pricing calculation (client-side estimate, server authoritative later)
    // Assuming simple flat rate for now or dummy calculation
    const estimatedPrice = duration * 500 // $5.00/hr dummy

    const handleSubmit = async () => {
        setIsProcessing(true)
        // Call server action to create session
        // Redirect to Stripe
        setTimeout(() => setIsProcessing(false), 2000)
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
                        {/* Connecting Line */}
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
                            {[1, 2, 3, 4, 8, 12].map((hr) => (
                                <button
                                    key={hr}
                                    onClick={() => setDuration(hr)}
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
                            <div className="text-lg font-bold text-slate-900">
                                ${(estimatedPrice / 100).toFixed(2)}
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Vehicle Information
                        </label>
                        <div className="relative">
                            <Car className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="License Plate"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-lg uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 ml-1">
                            Enter your plate number exactly as it appears on your vehicle.
                        </p>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!plate}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                            >
                                Review
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-6 border border-slate-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Duration</span>
                                <span className="font-medium">{duration} Hour{duration > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Vehicle</span>
                                <span className="font-mono font-medium">{plate}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                <span className="font-semibold text-slate-900">Total</span>
                                <span className="text-xl font-bold text-indigo-600">${(estimatedPrice / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isProcessing}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Pay with <span className="font-bold">Card</span>
                                    <CreditCard size={18} />
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700"
                        >
                            Edit Details
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
