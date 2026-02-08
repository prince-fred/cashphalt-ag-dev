import { getPropertyBySlugOrId } from '@/actions/parking'
import { getParkingUnit } from '@/actions/properties'
import { notFound } from 'next/navigation'
import { ParkingFlowForm } from './components/ParkingFlowForm'
import { Card } from '@/components/ui/Card'
import { MapPin } from 'lucide-react'
import { Database } from '@/db-types'
import Image from 'next/image'

type Property = Database['public']['Tables']['properties']['Row']


interface PageProps {
    params: Promise<{ propertyId: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

type ParkingUnit = {
    id: string
    property_id: string
    name: string
}

export default async function PublicParkingPage({ params, searchParams }: PageProps) {
    const { propertyId } = await params

    const property = await getPropertyBySlugOrId(propertyId) as Property | null
    const { unit: unitId } = (await searchParams) || {}
    const unit = unitId && typeof unitId === 'string' ? await getParkingUnit(unitId) as ParkingUnit | null : null

    if (!property) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-concrete-grey flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header Section */}
                <div className="bg-matte-black text-white p-8 rounded-t-2xl text-center relative overflow-hidden border-b-4 border-signal-yellow">
                    <div className="relative z-10">
                        {property.logo_url ? (
                            <div className="mb-4 relative h-16 w-full max-w-[200px] mx-auto">
                                <Image
                                    src={property.logo_url}
                                    alt={`${property.name} Logo`}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 text-signal-yellow mb-2 font-bold uppercase tracking-wider text-xs">
                                <MapPin size={14} />
                                <span>Official Zone</span>
                            </div>
                        )}
                        <h1 className="text-2xl font-bold tracking-tight mb-1">{property.name}</h1>
                        {unit && (
                            <div className="inline-block bg-signal-yellow text-matte-black text-sm font-extrabold px-3 py-1 rounded mb-3 shadow-sm uppercase tracking-wider border border-matte-black/10">
                                {unit.name}
                            </div>
                        )}
                        <p className="text-gray-400 text-sm">Pay for Parking</p>
                    </div>
                    {/* Background Texture */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                </div>

                {/* Main Card */}
                <Card className="rounded-t-none border-t-0 shadow-xl">
                    <ParkingFlowForm property={property} unit={unit} />
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
