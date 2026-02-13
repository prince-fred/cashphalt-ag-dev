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

                {session && (
                    <div className="bg-concrete-grey border border-slate-outline rounded-xl p-4 mb-6 text-left space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-white p-2 rounded-lg text-matte-black border border-slate-200">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</p>
                                <p className="text-base font-bold text-matte-black leading-tight">
                                    {/* @ts-ignore */}
                                    {session.properties?.name}
                                </p>
                                {unitName && <p className="text-sm text-gray-600 mt-0.5">Spot/Zone: {unitName}</p>}
                            </div>
                        </div>

                        <div className="h-px bg-slate-200" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vehicle</p>
                                <p className="text-lg font-bold text-matte-black font-mono">{session.vehicle_plate}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Paid</p>
                                <p className="text-lg font-bold text-matte-black">${(session.total_price_cents / 100).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3">
                            <Clock size={18} className="text-blue-600" />
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase">Valid Until</p>
                                <p className="text-sm font-bold text-blue-900">
                                    {new Date(session.end_time_current).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {session && (
                        <Link href={`/pay/extend/${session.id}`} className="block w-full">
                            <Button className="w-full text-lg h-14 bg-matte-black hover:bg-gray-800 text-white" variant="primary">
                                Extend Parking
                            </Button>
                        </Link>
                    )}

                    <Link href={`/pay/${propertyId}`} className="block w-full">
                        <Button className="w-full text-lg h-14 bg-white text-matte-black border-2 border-slate-200 hover:bg-gray-50" variant="outline">
                            Book Another Session
                        </Button>
                    </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-outline">
                    <Link href="/" className="text-sm font-bold text-gray-500 hover:text-matte-black flex items-center justify-center gap-1 transition-colors">
                        RETURN TO HOME <ArrowRight size={14} />
                    </Link>
                </div>
            </Card>
        </div>
    )
}
