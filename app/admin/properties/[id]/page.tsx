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
