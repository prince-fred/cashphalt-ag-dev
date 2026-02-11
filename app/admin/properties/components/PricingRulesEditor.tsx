'use client'

import { useState } from 'react'
import { Database } from '@/db-types'
import { upsertPricingRule, deletePricingRule } from '@/actions/pricing'
import { Plus, Trash2, Clock, Calendar, DollarSign, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useRouter } from 'next/navigation'

type PricingRule = Database['public']['Tables']['pricing_rules']['Row']
type PricingRuleInsert = Database['public']['Tables']['pricing_rules']['Insert']

const DAYS = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
]

interface PricingRulesEditorProps {
    propertyId: string
    rules: PricingRule[]
    timezone: string
}

export function PricingRulesEditor({ propertyId, rules, timezone }: PricingRulesEditorProps) {
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<PricingRuleInsert>>({
        property_id: propertyId,
        rate_type: 'HOURLY',
        amount_cents: 500,
        priority: rules.length > 0 ? (Math.max(...rules.map(r => r.priority)) + 10) : 10,
        days_of_week: null,
        start_time: null,
        end_time: null,
        is_active: true,
        name: ''
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await upsertPricingRule({
                ...formData,
                property_id: propertyId
            } as PricingRuleInsert)
            toast.success('Rule saved successfully')
            setIsAdding(false)
            setFormData({
                property_id: propertyId,
                rate_type: 'HOURLY',
                amount_cents: 500,
                priority: rules.length > 0 ? (Math.max(...rules.map(r => r.priority)) + 10) : 10,
                days_of_week: null,
                start_time: null,
                end_time: null,
                is_active: true,
                name: ''
            })
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this rule?')) return
        try {
            await deletePricingRule(id, propertyId)
            toast.success('Rule deleted')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const toggleDay = (day: number) => {
        const currentDays = formData.days_of_week || []
        if (currentDays.includes(day)) {
            setFormData({ ...formData, days_of_week: currentDays.filter(d => d !== day) })
        } else {
            setFormData({ ...formData, days_of_week: [...currentDays, day].sort() })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Pricing Rules</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={16} /> Add Rule
                </button>
            </div>

            <div className="space-y-4">
                {rules.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <DollarSign className="mx-auto text-slate-300 mb-2" size={32} />
                        <h3 className="text-slate-900 font-medium">No Custom Rules</h3>
                        <p className="text-slate-500 text-sm">Default rate applies when no rules match.</p>
                    </div>
                ) : (
                    rules.map((rule) => (
                        <div key={rule.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-100 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs">
                                        P{rule.priority}
                                    </span>
                                    <h3 className="font-bold text-slate-900">{rule.name || 'Unnamed Rule'}</h3>
                                    {!rule.is_active && (
                                        <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">Inactive</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {rule.days_of_week ? (
                                            rule.days_of_week.map(d => DAYS[d].label).join(', ')
                                        ) : (
                                            'Every Day'
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {rule.start_time && rule.end_time ? (
                                            `${rule.start_time.substring(0, 5)} - ${rule.end_time.substring(0, 5)}`
                                        ) : (
                                            '24 Hours'
                                        )}
                                    </div>
                                    <div className="font-medium text-slate-900">
                                        ${(rule.amount_cents / 100).toFixed(2)}
                                        <span className="text-slate-500 font-normal"> / {rule.rate_type.toLowerCase()}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(rule.id)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete Rule"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Add Pricing Rule">
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                        <input
                            required
                            placeholder="e.g. Weekend Special"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rate Type</label>
                            <select
                                value={formData.rate_type}
                                onChange={e => setFormData({ ...formData, rate_type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="HOURLY">Hourly</option>
                                <option value="FLAT">Flat Rate</option>
                                <option value="DAILY">Daily Max</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-500">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={formData.amount_cents ? formData.amount_cents / 100 : ''}
                                    onChange={e => setFormData({ ...formData, amount_cents: Math.round(parseFloat(e.target.value) * 100) })}
                                    className="w-full pl-7 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Days of Week</label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map(day => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${(formData.days_of_week || []).includes(day.value)
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, days_of_week: null })}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!formData.days_of_week
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                    }`}
                            >
                                All Days
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                value={formData.start_time || ''}
                                onChange={e => setFormData({ ...formData, start_time: e.target.value ? `${e.target.value}:00` : null })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                            <input
                                type="time"
                                value={formData.end_time || ''}
                                onChange={e => setFormData({ ...formData, end_time: e.target.value ? `${e.target.value}:00` : null })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                        <input
                            type="number"
                            required
                            value={formData.priority || 0}
                            onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Higher number = Checked first (e.g. 100 checked before 10)</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Saving...' : 'Save Rule'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}
