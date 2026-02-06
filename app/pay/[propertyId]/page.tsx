import { getPropertyBySlugOrId } from '@/actions/parking'
import { notFound } from 'next/navigation'
import { ParkingFlowForm } from './components/ParkingFlowForm'
import { Card } from '@/components/ui/Card'
import { MapPin } from 'lucide-react'
import { Database } from '@/db-types'

type Property = Database['public']['Tables']['properties']['Row']

interface PageProps {
    params: Promise<{ propertyId: string }>
}

export default async function PublicParkingPage({ params }: PageProps) {
    const { propertyId } = await params

    const property = await getPropertyBySlugOrId(propertyId) as Property | null

    if (!property) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-concrete-grey flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header Section */}
                <div className="bg-matte-black text-white p-8 rounded-t-2xl text-center relative overflow-hidden border-b-4 border-signal-yellow">
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-2 text-signal-yellow mb-2 font-bold uppercase tracking-wider text-xs">
                            <MapPin size={14} />
                            <span>Official Zone</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight mb-1">{property.name}</h1>
                        <p className="text-gray-400 text-sm">Pay for Parking</p>
                    </div>
                    {/* Background Texture */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                </div>

                {/* Main Card */}
                <Card className="rounded-t-none border-t-0 shadow-xl">
                    <ParkingFlowForm property={property} />
                </Card>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                        Powered by <span className="text-matte-black">Cashphalt</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
