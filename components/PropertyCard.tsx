'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Car, ArrowRight, MapPin } from 'lucide-react'
import { Database } from '@/db-types'
import { Button } from '@/components/ui/Button'

type Property = Database['public']['Tables']['properties']['Row']
type ParkingUnit = {
    id: string
    name: string
}

interface PropertyCardProps {
    property: Property
    units: ParkingUnit[]
}

export function PropertyCard({ property, units }: PropertyCardProps) {
    const [selectedUnitId, setSelectedUnitId] = useState<string>('')

    const hasUnits = units && units.length > 0

    // Construct the href based on selection
    const href = selectedUnitId
        ? `/pay/${property.slug}?unit=${selectedUnitId}`
        : `/pay/${property.slug}`

    return (
        <div className="group bg-white rounded-xl border border-slate-300 p-6 shadow-sm hover:shadow-lg hover:border-matte-black transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-signal-yellow opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="pl-2">
                <div className="flex items-start justify-between mb-5">
                    <div className="bg-concrete-grey text-matte-black p-3 rounded-lg group-hover:bg-signal-yellow transition-colors">
                        <Car size={24} strokeWidth={2.5} />
                    </div>
                    {property.allocation_mode === 'ZONE' && (
                        <span className="bg-matte-black text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                            Zone
                        </span>
                    )}
                </div>

                <h3 className="text-2xl font-bold text-matte-black mb-2 group-hover:underline decoration-signal-yellow decoration-4 underline-offset-4">
                    {property.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-700 font-medium mb-4">
                    <span className="inline-block w-2 h-2 bg-success-green rounded-full animate-pulse"></span>
                    Open 24/7 • Max {property.max_booking_duration_hours}h
                </div>

                {hasUnits && (
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Select {property.allocation_mode === 'ZONE' ? 'Zone' : 'Spot'}
                        </label>
                        <select
                            value={selectedUnitId}
                            onChange={(e) => setSelectedUnitId(e.target.value)}
                            className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-matte-black focus:outline-none focus:border-matte-black focus:ring-1 focus:ring-matte-black transition-colors"
                        >
                            <option value="">-- Start without selecting --</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="mt-4 pl-2">
                <Link
                    href={href}
                    className="flex items-center text-sm font-bold text-matte-black gap-2 group-hover:gap-3 transition-all"
                >
                    START SESSION <ArrowRight size={18} className="text-signal-yellow" />
                </Link>
            </div>
        </div>
    )
}
