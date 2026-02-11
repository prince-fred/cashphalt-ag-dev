'use client'

import { useState } from 'react'
import { Database } from '@/db-types'
import { upsertDiscount, deleteDiscount } from '@/actions/discounts'
import { Plus, Trash2, Tag, Calendar, Percent, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

type Discount = Database['public']['Tables']['discounts']['Row']
type DiscountInsert = Database['public']['Tables']['discounts']['Insert']

interface DiscountsEditorProps {
    propertyId: string
    discounts: Discount[]
}

export function DiscountsEditor({ propertyId, discounts }: DiscountsEditorProps) {
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<DiscountInsert>>({
        property_id: propertyId,
        type: 'PERCENTAGE',
        amount: 20, // 20%
        code: '',
        usage_limit: null,
        expires_at: null,
        is_active: true
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await upsertDiscount({
                ...formData,
                property_id: propertyId
            } as DiscountInsert)
            toast.success('Discount created successfully')
            setIsAdding(false)
            setFormData({
                property_id: propertyId,
                type: 'PERCENTAGE',
                amount: 20,
                code: '',
                usage_limit: null,
                expires_at: null,
                is_active: true
            })
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this discount code?')) return
        try {
            await deleteDiscount(id, propertyId)
            toast.success('Discount deleted')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Discount Codes</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={16} /> Create Code
                </button>
            </div>

            <div className="space-y-4">
                {discounts.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <Tag className="mx-auto text-slate-300 mb-2" size={32} />
                        <h3 className="text-slate-900 font-medium">No Active Discounts</h3>
                        <p className="text-slate-500 text-sm">Create a promo code to offer special rates.</p>
                    </div>
                ) : (
                    discounts.map((discount) => (
                        <div key={discount.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-100 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded text-sm tracking-wide border border-slate-200">
                                        {discount.code}
                                    </h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${discount.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {discount.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1 font-medium text-indigo-600">
                                        <Percent size={14} />
                                        {discount.type === 'PERCENTAGE' ? `${discount.amount}% OFF` : `$${(discount.amount / 100).toFixed(2)} OFF`}
                                    </div>
                                    {discount.expires_at && (
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <Calendar size={14} />
                                            Expires {format(new Date(discount.expires_at), 'MMM d, yyyy')}
                                        </div>
                                    )}
                                    {discount.usage_limit && (
                                        <div className="text-slate-500">
                                            {discount.usage_count || 0} / {discount.usage_limit} used
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(discount.id)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete Discount"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Create Discount Code">
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                        <input
                            required
                            placeholder="e.g. SUMMER20"
                            value={formData.code || ''}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {formData.type === 'PERCENTAGE' ? 'Percentage' : 'Amount ($)'}
                            </label>
                            <input
                                type="number"
                                step={formData.type === 'PERCENTAGE' ? '1' : '0.01'}
                                min="0"
                                required
                                value={formData.type === 'PERCENTAGE' ? formData.amount : (formData.amount ? formData.amount / 100 : '')}
                                onChange={e => {
                                    const val = parseFloat(e.target.value)
                                    setFormData({
                                        ...formData,
                                        amount: formData.type === 'PERCENTAGE' ? Math.round(val) : Math.round(val * 100)
                                    })
                                }}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expires On (Optional)</label>
                            <input
                                type="date"
                                value={formData.expires_at ? new Date(formData.expires_at).toISOString().split('T')[0] : ''}
                                onChange={e => setFormData({ ...formData, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usage Limit (Optional)</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Unlimited"
                                value={formData.usage_limit || ''}
                                onChange={e => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Creating...' : 'Create Code'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}
