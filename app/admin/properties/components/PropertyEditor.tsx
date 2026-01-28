'use client'

import { useState } from 'react'
import { Database } from '@/database.types'
import { upsertProperty } from '@/actions/properties'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'

type Property = Database['public']['Tables']['properties']['Row']

export function PropertyEditor({ property }: { property?: Property }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<Property>>(property || {
        name: '',
        slug: '',
        max_booking_duration_hours: 24,
        allocation_mode: 'ZONE',
        timezone: 'UTC',
        qr_enabled: true,
        sms_enabled: true
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
            await upsertProperty(formData as any)
            router.push('/admin/properties')
            router.refresh()
        } catch (err) {
            alert('Error saving property')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL Path)</label>
                    <input
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    />
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
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Property'}
                </button>
            </div>
        </form>
    )
}
