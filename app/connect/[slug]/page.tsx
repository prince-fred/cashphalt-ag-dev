
'use client'

import { useEffect, useState } from 'react'
import { createStripeConnectAccountForSlug } from '@/actions/organizations'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ConnectPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const slug = params.slug as string
    const connected = searchParams.get('connected')

    const [loading, setLoading] = useState(!connected)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (connected) return

        const initConnect = async () => {
            try {
                const { url } = await createStripeConnectAccountForSlug(slug)
                if (url) window.location.href = url
                else throw new Error("Could not generate Stripe link")
            } catch (err: any) {
                setError(err.message || "Failed to initialize Stripe Connect")
                setLoading(false)
            }
        }

        initConnect()
    }, [slug, connected])

    if (connected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Payouts Connected!</h1>
                    <p className="text-slate-600">
                        Your account has been successfully connected to Stripe. You can now receive payouts.
                    </p>
                    <p className="text-sm text-slate-400">
                        You can close this window.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="text-center space-y-4">
                {error ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full">
                        <h1 className="text-xl font-bold text-red-600 mb-2">Connection Failed</h1>
                        <p className="text-slate-600">{error}</p>
                    </div>
                ) : (
                    <>
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                        <h1 className="text-xl font-medium text-slate-900">Redirecting to Stripe...</h1>
                        <p className="text-slate-500">Please wait while we set up your secure connection.</p>
                    </>
                )}
            </div>
        </div>
    )
}
