import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default async function SuccessPage({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params

    return (
        <div className="min-h-screen bg-concrete-grey flex flex-col items-center justify-center p-4">
            <Card className="max-w-sm w-full text-center p-8 border-t-4 border-t-success-green shadow-xl">
                <div className="w-20 h-20 bg-green-50 text-success-green rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>

                <h1 className="text-3xl font-bold text-matte-black mb-2">Payment Successful</h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Your parking session is active. A receipt has been sent to your email.
                </p>

                <Link href={`/pay/${propertyId}`} className="block w-full">
                    <Button className="w-full text-lg h-14" variant="primary">
                        Book Another Session
                    </Button>
                </Link>

                <div className="mt-6 pt-6 border-t border-slate-outline">
                    <Link href="/" className="text-sm font-bold text-gray-400 hover:text-matte-black flex items-center justify-center gap-1 transition-colors">
                        RETURN TO HOME <ArrowRight size={14} />
                    </Link>
                </div>
            </Card>
        </div>
    )
}
