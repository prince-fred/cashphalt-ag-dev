import { getPropertyBySlugOrId } from '@/actions/parking'
import { notFound } from 'next/navigation'
import { ParkingFlowForm } from './components/ParkingFlowForm'

interface PageProps {
    params: Promise<{ propertyId: string }>
}

export default async function PublicParkingPage({ params }: PageProps) {
    const { propertyId } = await params

    const property = await getPropertyBySlugOrId(propertyId)

    if (!property) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-6 text-white text-center">
                    <h1 className="text-xl font-bold tracking-tight">{property.name}</h1>
                    <p className="text-slate-400 text-sm mt-1">Pay for Parking</p>
                </div>

                <div className="p-6">
                    <ParkingFlowForm property={property} />
                </div>

                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400">Powered by Cashphalt</p>
                </div>
            </div>
        </div>
    )
}
