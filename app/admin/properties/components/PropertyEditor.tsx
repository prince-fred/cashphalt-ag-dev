'use client'

import { useState } from 'react'
import { Database } from '@/db-types'
import { upsertProperty, createParkingUnit, deleteParkingUnit } from '@/actions/properties'
import { useRouter } from 'next/navigation'
import { Save, Plus, Trash2, QrCode, Download, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Property = Database['public']['Tables']['properties']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']
type ParkingUnit = { id: string, property_id: string, name: string }

interface PropertyEditorProps {
    property?: Property
    organizationId: string
    onSave: () => void
    onCancel: () => void
}

interface FormData {
    name: string
    slug: string
    timezone: string
    allocation_mode: 'SPOT' | 'ZONE'
    max_booking_duration_hours: number
    qr_enabled: boolean
    sms_enabled: boolean
    price_hourly_cents: number
    logo_url?: string | null
}

export function PropertyEditor({ property, organizationId, onSave, onCancel }: PropertyEditorProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<Property>>({
        ...property,
        name: property?.name || '',
        slug: property?.slug || '',
        organization_id: property?.organization_id || organizationId,
        max_booking_duration_hours: property?.max_booking_duration_hours || 24,
        allocation_mode: property?.allocation_mode || 'ZONE',
        timezone: property?.timezone || 'America/New_York',
        qr_enabled: property?.qr_enabled ?? true,
        sms_enabled: property?.sms_enabled ?? true,
        price_hourly_cents: property?.price_hourly_cents || 500,
        logo_url: property?.logo_url || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await upsertProperty({
                ...formData,
                organization_id: formData.organization_id || organizationId
            } as any)
            onSave()
        } catch (err: any) {
            toast.error(err.message || 'Error saving property')
        } finally {
            setLoading(false)
        }
    }

    const [newUnitName, setNewUnitName] = useState('')
    const [isAddingUnit, setIsAddingUnit] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await upsertProperty(formData as any)
            router.push('/admin/properties')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Error saving property')
        } finally {
            setLoading(false)
        }
    }

    const handleAddUnit = async () => {
        if (!property?.id || !newUnitName.trim()) return
        setIsAddingUnit(true)
        try {
            await createParkingUnit(property.id, newUnitName.trim())
            setNewUnitName('')
            toast.success('Unit added successfully')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to add unit')
        } finally {
            setIsAddingUnit(false)
        }
    }

    const handleDeleteUnit = async (id: string) => {
        if (!confirm('Are you sure you want to delete this unit?')) return
        try {
            await deleteParkingUnit(id)
            toast.success('Unit deleted')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete unit')
        }
    }

    return (
        <div className="space-y-8">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                        <select
                            name="organization_id"
                            value={formData.organization_id}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {organizations.length === 0 && <option value="">No organizations found</option>}
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                        {organizations.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                                No organizations available. Please contact support.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Property Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL Slug
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Logo URL (Optional)
                        </label>
                        <input
                            type="url"
                            name="logo_url"
                            value={formData.logo_url || ''}
                            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                            placeholder="https://example.com/logo.png"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter a direct link to your logo image. This will be displayed on the payment page.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Max Duration (Hours)</label>
                        <input
                            name="max_booking_duration_hours"
                            type="number"
                            value={formData.max_booking_duration_hours}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                        <select
                            name="timezone"
                            value={formData.timezone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="America/Chicago">Central Time</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Allocation Mode</label>
                        <select
                            name="allocation_mode"
                            value={formData.allocation_mode}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="ZONE">Zone Based (General Lot)</option>
                            <option value="SPOT">Spot Based (Numbered Spaces)</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={loading || organizations.length === 0}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Property'}
                    </button>
                </div>
            </form>

            {property && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        {formData.allocation_mode === 'SPOT' ? 'Parking Spots' : 'Zones'}
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {units.length}
                        </span>
                    </h2>

                    <div className="flex gap-2 mb-6">
                        <input
                            placeholder={formData.allocation_mode === 'SPOT' ? "e.g. Spot 101" : "e.g. Zone A"}
                            value={newUnitName}
                            onChange={e => setNewUnitName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onKeyDown={e => e.key === 'Enter' && handleAddUnit()}
                        />
                        <button
                            onClick={handleAddUnit}
                            disabled={!newUnitName.trim() || isAddingUnit}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </div>

                    <div className="space-y-2">
                        {units.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                No {formData.allocation_mode === 'SPOT' ? 'spots' : 'zones'} added yet.
                            </div>
                        ) : (
                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Direct Link</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {units.map(unit => {
                                            const link = `${process.env.NEXT_PUBLIC_APP_URL || ''}/pay/${property.id}?unit=${unit.id}`
                                            return (
                                                <tr key={unit.id} className="hover:bg-slate-50 group">
                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                        {unit.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <a href={link} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1">
                                                            /pay/...{unit.id.substring(0, 8)}
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                                        <button
                                                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                            onClick={() => handleDeleteUnit(unit.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
