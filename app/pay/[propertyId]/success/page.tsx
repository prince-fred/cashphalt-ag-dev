import Link from 'next/link'
import { CheckCircle2, ArrowRight, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getSessionByPaymentIntent } from '@/actions/sessions'

export default async function SuccessPage({
    params,
    searchParams
}: {
    params: Promise<{ propertyId: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { propertyId } = await params
    const { payment_intent } = await searchParams

    let session: any = null
    let unitName = null

    if (payment_intent && typeof payment_intent === 'string') {
        session = await getSessionByPaymentIntent(payment_intent)
        // @ts-ignore join types
        unitName = session?.parking_units?.name
    }

    return (
        <div className="min-h-screen bg-concrete-grey flex flex-col items-center justify-center p-4">
            <Card className="max-w-sm w-full text-center p-8 border-t-4 border-t-success-green shadow-xl">
                <div className="w-20 h-20 bg-green-50 text-success-green rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>

                <h1 className="text-3xl font-bold text-matte-black mb-2">Payment Successful</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Your parking session is active. A receipt has been sent to your email.
                </p>

                {unitName && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-left">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Parked at</p>
                                <p className="text-lg font-bold text-blue-900">{unitName}</p>
                            </div>
                        </div>
                        {session && (
                            <div className="flex items-center gap-2 text-sm text-blue-800/70 mt-3 pt-3 border-t border-blue-200/50">
                                <Clock size={14} />
                                <span className="font-medium">Valid until {new Date(session.end_time_initial).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                            </div>
                        )}
                    </div>
                )}

                <Link href={`/pay/${propertyId}`} className="block w-full">
                    <Button className="w-full text-lg h-14" variant="primary">
                        Book Another Session
                    </Button>
                </Link>

                <div className="mt-6 pt-6 border-t border-slate-outline">
                    <Link href="/" className="text-sm font-bold text-gray-500 hover:text-matte-black flex items-center justify-center gap-1 transition-colors">
                        RETURN TO HOME <ArrowRight size={14} />
                    </Link>
                </div>
            </Card>
        </div>
    )
}
