import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ sessionId: string }>
    searchParams: Promise<{ payment_intent?: string, redirect_status?: string, expected_end?: string }>
}

export default async function ExtensionSuccessPage({ params, searchParams }: PageProps) {
    const { sessionId } = await params
    const { redirect_status, expected_end } = await searchParams
    const supabase = await createClient()

    // Fetch session details
    const { data: session, error } = await (supabase
        .from('sessions') as any)
        .select(`
            *,
            properties (
                name, slug, timezone
            )
        `)
        .eq('id', sessionId)
        .single()

    if (error || !session) {
        notFound()
    }

    let unitName = null
    // @ts-ignore db-types mismatch
    if (session.spot_id || session.unit_id) {
        // @ts-ignore
        const idToUse = session.spot_id || session.unit_id
        const { data: unit } = await (supabase
            .from('parking_units') as any)
            .select('name')
            .eq('id', idToUse)
            .single()
        if (unit) unitName = unit.name
    }

    const isSuccess = redirect_status === 'succeeded' || session.status === 'ACTIVE'

    // Calculate display end time logic
    let displayEndTime = new Date(session.end_time_current)

    // If expected_end is provided in URL (from ExtensionFlow), use it if it's later than DB time
    // This handles the webhook race condition optimistically
    if (expected_end && !isNaN(parseInt(expected_end))) {
        const expectedDate = new Date(parseInt(expected_end))
        if (expectedDate.getTime() > displayEndTime.getTime()) {
            displayEndTime = expectedDate
        }
    }

    // @ts-ignore
    const property = session.properties

    return (
        <div className="min-h-screen bg-concrete-grey flex flex-col items-center justify-center p-4">
            <Card className="max-w-sm w-full text-center p-8 border-t-4 border-t-success-green shadow-xl">
                {isSuccess ? (
                    <>
                        <div className="w-20 h-20 bg-green-50 text-success-green rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} strokeWidth={2.5} />
                        </div>

                        <h1 className="text-3xl font-bold text-matte-black mb-2">Extension Confirmed</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Your parking session has been extended. A receipt has been sent to your email.
                        </p>

                        <div className="bg-concrete-grey border border-slate-outline rounded-xl p-4 mb-6 text-left space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="bg-white p-2 rounded-lg text-matte-black border border-slate-200">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</p>
                                    <p className="text-base font-bold text-matte-black leading-tight">
                                        {property?.name}
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
                                    <p className="text-xs font-bold text-blue-600 uppercase">New Expiration</p>
                                    <p className="text-sm font-bold text-blue-900">
                                        {formatInTimeZone(displayEndTime, property?.timezone || 'UTC', 'EEEE, MMM d, yyyy')}
                                    </p>
                                    <p className="text-base font-bold text-blue-900 mt-0.5">
                                        {formatInTimeZone(displayEndTime, property?.timezone || 'UTC', 'h:mm a')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href={
                                    // @ts-ignore
                                    `/pay/${property?.slug || session.property_id}${(session as any).spot_id ? `?unit=${(session as any).spot_id}` : ''}`
                                }
                                className="block w-full"
                            >
                                <Button className="w-full text-lg h-14 bg-matte-black hover:bg-gray-800 text-white" variant="primary">
                                    Book Another Session
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-outline">
                            <Link href="/" className="text-sm font-bold text-gray-500 hover:text-matte-black flex items-center justify-center gap-1 transition-colors">
                                RETURN TO HOME <ArrowRight size={14} />
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-bold text-error-red mb-4">Something went wrong</h1>
                        <p className="text-gray-600 mb-8">Payment was not confirmed. Please try again.</p>
                        <Link href={`/pay/extend/${sessionId}`}>
                            <Button className="w-full h-14 text-lg bg-matte-black hover:bg-gray-800">Try Again</Button>
                        </Link>
                    </>
                )}
            </Card>
        </div>
    )
}
