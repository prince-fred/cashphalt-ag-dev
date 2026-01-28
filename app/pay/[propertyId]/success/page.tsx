import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function SuccessPage({ params }: { params: { propertyId: string } }) {
    // In a real app, verify the payment_intent_client_secret from query params
    // and show specific session details.

    return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full border border-green-100">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
                <p className="text-slate-500 mb-8">
                    Your parking session is active. You will receive an email receipt shortly.
                </p>

                <Link
                    href={`/pay/${params.propertyId}`}
                    className="block w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                >
                    Book Another Session
                </Link>
            </div>
        </div>
    )
}
