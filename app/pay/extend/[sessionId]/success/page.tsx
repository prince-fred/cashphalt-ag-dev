import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

interface PageProps {
    params: Promise<{ sessionId: string }>
    searchParams: Promise<{ payment_intent?: string, redirect_status?: string }>
}

export default async function ExtensionSuccessPage({ params, searchParams }: PageProps) {
    const { sessionId } = await params
    const { redirect_status } = await searchParams
    const supabase = await createClient()

    // Fetch session details
    const { data: session, error } = await (supabase
        .from('sessions') as any)
        .select(`
            *,
            properties (
                name, slug
            )
        `)
        .eq('id', sessionId)
        .single()

    if (error || !session) {
        notFound()
    }

    const isSuccess = redirect_status === 'succeeded' || session.status === 'ACTIVE'

    return (
        <div className="min-h-screen bg-concrete-grey flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="text-center p-8 space-y-6">
                    {isSuccess ? (
                        <>
                            <div className="flex justify-center">
                                <div className="bg-success-green/10 p-4 rounded-full">
                                    <CheckCircle2 size={48} className="text-success-green" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-matte-black uppercase tracking-tight">Extension Confirmed!</h1>
                            <p className="text-gray-500">Your parking session has been extended.</p>

                            <div className="bg-concrete-grey p-6 rounded-xl border border-slate-outline mt-4">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock size={20} className="text-matte-black" />
                                    <span className="font-bold text-lg text-matte-black">New Expiry Time</span>
                                </div>
                                <p className="text-3xl font-bold text-matte-black font-mono">
                                    {new Date(session.end_time_current).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </p>
                            </div>

                            <div className="pt-4">
                                <Link href={`/pay/${session.property_id}`}>
                                    <Button variant="outline" className="w-full">
                                        Back to Property
                                    </Button>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-bold text-error-red">Something went wrong</h1>
                            <p>Payment was not confirmed. Please try again.</p>
                            <Link href={`/pay/extend/${sessionId}`}>
                                <Button className="w-full mt-4">Try Again</Button>
                            </Link>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}
