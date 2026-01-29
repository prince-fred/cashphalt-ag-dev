'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/database.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createProperty, updateProperty } from '@/actions/properties'
import { Save, Trash2, ArrowRight } from 'lucide-react'

type Property = Database['public']['Tables']['properties']['Row']

interface PropertyEditorProps {
    property?: Property
}

export function PropertyEditor({ property }: PropertyEditorProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState(property?.name ?? '')
    const [slug, setSlug] = useState(property?.slug ?? '')
    // Default to a sane address or existing
    const [address, setAddress] = useState(property?.address ?? '')
    const [hourlyRate, setHourlyRate] = useState(property?.price_hourly_cents ? (property.price_hourly_cents / 100).toString() : '5')


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const priceCents = Math.round(parseFloat(hourlyRate) * 100)

            if (property) {
                // Update
                await updateProperty(property.id, {
                    name,
                    slug,
                    price_hourly_cents: priceCents
                })
            } else {
                // Create
                await createProperty({
                    name,
                    slug,
                    price_hourly_cents: priceCents,
                    organization_id: '00000000-0000-0000-0000-000000000000' // Placeholder for MVP
                })
            }

            router.push('/admin/properties')
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Failed to save property')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Property Name</label>
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Downtown Garage"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">URL Slug</label>
                    <Input
                        value={slug}
                        onChange={e => setSlug(e.target.value)}
                        placeholder="e.g. downtown-garage"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Hourly Rate ($)</label>
                    <Input
                        type="number"
                        step="0.50"
                        value={hourlyRate}
                        onChange={e => setHourlyRate(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button type="submit" disabled={isLoading} className="bg-slate-900 text-white hover:bg-slate-800">
                    {isLoading ? 'Saving...' : (
                        <>
                            <Save size={16} className="mr-2" />
                            Save Property
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
