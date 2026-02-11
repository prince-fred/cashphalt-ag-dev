import { getProperty, generateQrCode, getParkingUnits } from '@/actions/properties'
import { getOrganizations } from '@/actions/organizations'
import { PropertyEditor } from '../components/PropertyEditor'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import { PropertyUnitsEditor } from '../components/PropertyUnitsEditor'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const isNew = id === 'new'
    const property = !isNew ? await getProperty(id) : undefined
    const organizations = await getOrganizations()
    // Fetch units if property exists
    const units = property ? await getParkingUnits(property.id) : []

    // Generate QR for preview if property exists
    const publicUrl = property ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${property.id}` : ''
    const qrDataUrl = property ? await generateQrCode(publicUrl) : null

    return (
        <div className="space-y-6">
            <Link
                href="/admin/properties"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Properties
            </Link>

            <div className="flex items-start gap-8 flex-col lg:flex-row">
                <div className="flex-1 w-full">
                    <h1 className="text-2xl font-bold text-slate-900 mb-6">{isNew ? 'New Property' : 'Edit Property'}</h1>
                    <PropertyEditor property={property} organizations={organizations} />

                    {property && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            <Link href={`/admin/properties/${property.id}/pricing`} className="p-6 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600">Pricing Rules</h3>
                                <p className="text-slate-500 text-sm mt-1">Manage rates, time windows, and schedules.</p>
                            </Link>
                            <Link href={`/admin/properties/${property.id}/discounts`} className="p-6 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600">Discounts</h3>
                                <p className="text-slate-500 text-sm mt-1">Create promo codes and manage usage limits.</p>
                            </Link>
                        </div>
                    )}

                    {property && (
                        <PropertyUnitsEditor
                            propertyId={property.id}
                            propertySlug={property.slug}
                            allocationMode={property.allocation_mode}
                            units={units}
                        />
                    )}
                </div>

                {!isNew && qrDataUrl && (
                    <div className="w-full lg:w-80">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">QR Signage</h2>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                            <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm mb-4">
                                <Image
                                    src={qrDataUrl}
                                    alt="QR Code"
                                    width={200}
                                    height={200}
                                    className="rounded"
                                />
                            </div>
                            <h3 className="font-bold text-slate-900">{property?.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 mb-4 break-all">{publicUrl}</p>

                            <a
                                href={qrDataUrl}
                                download={`qr-${property?.slug}.png`}
                                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                            >
                                <Download size={16} /> Download PNG
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
