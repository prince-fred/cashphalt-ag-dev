'use client'

import { useState } from 'react'
import { Database } from '@/db-types'
import { upsertOrganization, deleteOrganization } from '@/actions/organizations'
import { useRouter } from 'next/navigation'
import { Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type Organization = Database['public']['Tables']['organizations']['Row']

export function OrganizationEditor({ organization }: { organization?: Organization }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<Organization>>(organization || {
        name: '',
        slug: '',
        stripe_connect_id: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await upsertOrganization(formData)
            toast.success('Organization saved successfully')
            router.push('/admin/organizations')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Error saving organization')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!organization?.id) return
        if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) return

        setLoading(true)
        try {
            await deleteOrganization(organization.id)
            toast.success('Organization deleted')
            router.push('/admin/organizations')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Error deleting organization')
            setLoading(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <form id="org-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Stripe Connect ID</label>
                        <input
                            name="stripe_connect_id"
                            value={formData.stripe_connect_id || ''}
                            onChange={handleChange}
                            placeholder="acct_..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        />
                    </div>
                </div>
            </form>

            <div className="flex justify-between pt-4 border-t border-slate-100">
                {organization?.id ? (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        className="text-red-600 px-4 py-2.5 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Trash2 size={18} />
                        Delete Organization
                    </button>
                ) : <div />}

                <button
                    type="submit"
                    form="org-form"
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save Organization'}
                </button>
            </div>
        </div>
    )
}
