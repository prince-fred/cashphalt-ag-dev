'use client'

import { useState } from 'react'
import { Database } from '@/db-types'
import { upsertOrganization, deleteOrganization, createStripeConnectAccount } from '@/actions/organizations'
import { useRouter } from 'next/navigation'
import { Save, Trash2, CreditCard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

type Organization = Database['public']['Tables']['organizations']['Row']

export function OrganizationEditor({ organization }: { organization?: Organization }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<Organization>>(organization || {
        name: '',
        slug: '',
        stripe_connect_id: '',
        platform_fee_percent: 10,
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

    const handleConnect = async () => {
        if (!organization?.id) {
            toast.error("Please save the organization first before connecting Stripe.")
            return
        }
        setLoading(true)
        try {
            const { url } = await createStripeConnectAccount(organization.id)
            if (url) window.location.href = url
        } catch (err: any) {
            toast.error(err.message || "Failed to start Stripe onboarding")
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
                        <div className="flex gap-2">
                            <input
                                name="stripe_connect_id"
                                value={formData.stripe_connect_id || ''}
                                onChange={handleChange}
                                placeholder="acct_..."
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                            />
                            {organization?.id && (
                                <button
                                    type="button"
                                    onClick={handleConnect}
                                    disabled={loading}
                                    className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {formData.stripe_connect_id ? <ExternalLink size={14} /> : <CreditCard size={14} />}
                                    {formData.stripe_connect_id ? 'Update Payouts' : 'Connect Payouts'}
                                </button>
                            )}
                        </div>
                        {!organization?.id && <p className="text-xs text-orange-500 mt-1">Save organization first to connect Stripe.</p>}

                        {organization?.id && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Shareable Connection Link</label>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-white px-2 py-1.5 rounded border border-slate-200 text-xs text-slate-600 truncate">
                                        {typeof window !== 'undefined' ? `${window.location.origin}/connect/${organization.slug}` : `.../connect/${organization.slug}`}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = `${window.location.origin}/connect/${organization.slug}`
                                            navigator.clipboard.writeText(url)
                                            toast.success('Link copied to clipboard')
                                        }}
                                        className="text-indigo-600 hover:text-indigo-700 text-xs font-medium px-2 py-1.5 hover:bg-indigo-50 rounded transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Share this link with the property owner to set up payouts.</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Platform Fee (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="platform_fee_percent"
                                value={formData.platform_fee_percent ?? 10}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">%</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Cashphalt takes this % + $1.00 service fee.</p>
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
