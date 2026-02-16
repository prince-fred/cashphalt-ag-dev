'use client'

import { useState } from 'react'
import { Database } from '@/db-types'
import { upsertProperty } from '@/actions/properties'
import { uploadPropertyLogo } from '@/actions/upload'
import { useRouter } from 'next/navigation'
import { Save, Upload, Trash2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

type Property = Database['public']['Tables']['properties']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

interface PropertyEditorProps {
    property?: Property
    organizations: Organization[]
}

export function PropertyEditor({ property, organizations }: PropertyEditorProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState<Partial<Property>>({
        ...property,
        name: property?.name || '',
        slug: property?.slug || '',
        organization_id: property?.organization_id || (organizations.length > 0 ? organizations[0].id : ''),
        max_booking_duration_hours: property?.max_booking_duration_hours || 24,
        allocation_mode: property?.allocation_mode || 'ZONE',
        timezone: property?.timezone || 'America/New_York',
        qr_enabled: property?.qr_enabled ?? true,
        sms_enabled: property?.sms_enabled ?? true,
        price_hourly_cents: property?.price_hourly_cents || 500,
        logo_url: property?.logo_url || '',
        address: property?.address || '',
        min_duration_hours: property?.min_duration_hours || 1,
        custom_product_name: property?.custom_product_name || '',
        custom_product_end_time: property?.custom_product_end_time || '',
        custom_product_price_cents: property?.custom_product_price_cents || 0,
        custom_product_enabled: property?.custom_product_enabled || false,
    })

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB')
            return
        }

        const formData = new FormData()
        formData.append('file', file)

        setUploading(true)
        try {
            const publicUrl = await uploadPropertyLogo(formData)
            setFormData(prev => ({ ...prev, logo_url: publicUrl }))
            toast.success('Logo uploaded successfully')
        } catch (error) {
            console.error(error)
            toast.error('Failed to upload logo')
        } finally {
            setUploading(false)
        }
    }

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
                            Property Logo
                        </label>
                        <div className="flex items-start gap-4">
                            {formData.logo_url ? (
                                <div className="relative group">
                                    <div className="w-24 h-24 relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                        <Image
                                            src={formData.logo_url}
                                            alt="Property Logo"
                                            fill
                                            className="object-contain p-2"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        title="Remove Logo"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                    <ImageIcon size={24} className="mb-1" />
                                    <span className="text-xs">No Logo</span>
                                </div>
                            )}

                            <div className="flex-1">
                                <label className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                                    <Upload size={16} />
                                    {uploading ? 'Uploading...' : 'Upload New Logo'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/svg+xml"
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-2">
                                    Optimized for PNG, JPG or SVG (max 2MB).
                                    <br />
                                    This logo will be displayed on the payment page for this property.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Min Duration (Hours)</label>
                            <input
                                name="min_duration_hours"
                                type="number"
                                min="1"
                                value={formData.min_duration_hours}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max Duration (Hours)</label>
                            <input
                                name="max_booking_duration_hours"
                                type="number"
                                min="1"
                                value={formData.max_booking_duration_hours}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
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
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Base Hourly Rate ($)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500">$</span>
                            <input
                                name="price_hourly_cents"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price_hourly_cents !== undefined ? formData.price_hourly_cents / 100 : ''}
                                onChange={e => setFormData({ ...formData, price_hourly_cents: Math.round(parseFloat(e.target.value) * 100) })}
                                className="w-full pl-7 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Fallback rate if no rules match.</p>
                    </div>
                </div>



                <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium text-slate-900">Custom Parking Product</h3>
                            <p className="text-sm text-slate-500">Enable a special parking option (e.g. Overnight, Event) with a fixed end time and price.</p>
                        </div>
                        <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="custom_product_enabled"
                                    checked={formData.custom_product_enabled || false}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>

                    {formData.custom_product_enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    name="custom_product_name"
                                    placeholder="e.g. Overnight Parking"
                                    value={formData.custom_product_name || ''}
                                    onChange={(e) => setFormData({ ...formData, custom_product_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Time (24h)</label>
                                <input
                                    type="time"
                                    name="custom_product_end_time"
                                    value={formData.custom_product_end_time || ''}
                                    onChange={(e) => setFormData({ ...formData, custom_product_end_time: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Price ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.custom_product_price_cents !== undefined && formData.custom_product_price_cents !== null ? formData.custom_product_price_cents / 100 : ''}
                                        onChange={e => setFormData({ ...formData, custom_product_price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                                        className="w-full pl-7 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
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
            </form >
        </div >
    )
}
