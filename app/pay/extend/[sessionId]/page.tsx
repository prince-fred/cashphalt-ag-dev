import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ExtensionFlow } from './components/ExtensionFlow'
import { Card } from '@/components/ui/Card'
import { Clock } from 'lucide-react'

interface PageProps {
    params: Promise<{ sessionId: string }>
}

export default async function ExtensionPage({ params }: PageProps) {
    const { sessionId } = await params
    const supabase = await createClient()

    // Fetch session details
    const { data: session, error } = await supabase
        .from('sessions')
        .select(`
            *,
            properties (
                id, name, timezone, max_booking_duration_hours
            )
        `)
        .eq('id', sessionId)
        .single()

    if (error || !session) {
        notFound()
    }

    if (session.status === 'EXPIRED' || session.status === 'COMPLETED') {
        // Maybe allow expired extension within grace period? For MVP, just show status.
    }

    // @ts-ignore join types
    const property = session.properties

    return (
        <div className="min-h-screen bg-concrete-grey flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-matte-black text-white p-6 rounded-t-2xl text-center border-b-4 border-signal-yellow relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-center mb-2">
                            <Clock className="text-signal-yellow" size={24} />
                        </div>
                        <h1 className="text-xl font-bold">Extend Parking</h1>
                        <p className="text-gray-400 text-sm mt-1">{property.name}</p>
                    </div>
                </div>

                <Card className="rounded-t-none border-t-0 shadow-xl">
                    <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg text-center">
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Current Expiry</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {new Date(session.end_time_current).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                    </div>

                    <ExtensionFlow session={session} property={property} />
                </Card>
            </div>
        </div>
    )
}
