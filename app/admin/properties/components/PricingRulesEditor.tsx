'use client'

import { useState } from 'react'
import { Database } from '@/db-types'
import { upsertPricingRule, deletePricingRule } from '@/actions/pricing'
import { Plus, Trash2, Clock, Calendar, DollarSign, AlertCircle, Timer } from 'lucide-react'
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
    minDuration: number | null
    maxDuration: number | null
    hourlyRateCents: number | null
}

export function PricingRulesEditor({ propertyId, rules, timezone, minDuration, maxDuration, hourlyRateCents }: PricingRulesEditorProps) {
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)

    // UI state for the form type
    const [ruleCategory, setRuleCategory] = useState<'STANDARD' | 'BUCKET'>('BUCKET')

    const [formData, setFormData] = useState<Partial<PricingRuleInsert>>({
        property_id: propertyId,
        rate_type: 'FLAT',
        amount_cents: 500,
        priority: rules.length > 0 ? (Math.max(...rules.map(r => r.priority)) + 10) : 10,
        days_of_week: null,
        start_time: null,
        end_time: null,
        is_active: true,
        name: '',
        description: '',
        min_duration_minutes: 0,
        max_duration_minutes: 60
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Clean up data based on category
            const dataToSave = { ...formData, property_id: propertyId }

            if (ruleCategory === 'STANDARD') {
                dataToSave.min_duration_minutes = null
                dataToSave.max_duration_minutes = null
                dataToSave.description = null
            } else {
                // Bucket implies FLAT usually
                dataToSave.rate_type = 'FLAT'
            }

            await upsertPricingRule(dataToSave as PricingRuleInsert)
            toast.success('Rule saved successfully')
            setIsAdding(false)
            setFormData({
                property_id: propertyId,
                rate_type: 'FLAT',
                amount_cents: 500,
                priority: rules.length > 0 ? (Math.max(...rules.map(r => r.priority)) + 10) : 10,
                days_of_week: null,
                start_time: null,
                end_time: null,
                is_active: true,
                name: '',
                description: '',
                min_duration_minutes: 0,
                max_duration_minutes: 60
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
                    onClick={() => {
                        setRuleCategory('BUCKET')
                        setIsAdding(true)
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={16} /> Add Rule
                </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle size={16} className="text-indigo-600" />
                        Base Configuration
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        These settings apply when no specific rules match, or as limits for all bookings.
                    </p>
                    <div className="flex gap-6 mt-3 text-sm">
                        <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Hourly Rate</span>
                            <span className="font-mono font-medium text-slate-900">${((hourlyRateCents || 500) / 100).toFixed(2)}/hr</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Min Duration</span>
                            <span className="font-mono font-medium text-slate-900">{minDuration || 1} hrs</span>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Max Duration</span>
                            <span className="font-mono font-medium text-slate-900">{maxDuration || 24} hrs</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => router.push(`/admin/properties/${propertyId}`)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
                >
                    Edit Settings
                </button>
            </div>

            <div className="space-y-4">
                {rules.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <DollarSign className="mx-auto text-slate-300 mb-2" size={32} />
                        <h3 className="text-slate-900 font-medium">No Pricing Rules</h3>
                        <p className="text-slate-500 text-sm">Add buckets or standard rules to start charging.</p>
                    </div>
                ) : (
                    rules.map((rule) => {
                        const isBucket = rule.min_duration_minutes !== null && rule.max_duration_minutes !== null
                        return (
                            <div key={rule.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-100 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${isBucket ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {isBucket ? 'BUCKET' : 'STANDARD'}
                                        </span>
                                        <span className="text-slate-400 text-xs text-mono bg-slate-50 px-1.5 rounded">P{rule.priority}</span>
                                        <h3 className="font-bold text-slate-900">{rule.name || 'Unnamed Rule'}</h3>
                                        {!rule.is_active && (
                                            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">Inactive</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                                        {isBucket ? (
                                            <div className="flex items-center gap-1 font-medium text-slate-800">
                                                <Timer size={14} />
                                                {rule.min_duration_minutes} - {rule.max_duration_minutes} mins
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {rule.start_time && rule.end_time ? (
                                                    `${rule.start_time.substring(0, 5)} - ${rule.end_time.substring(0, 5)}`
                                                ) : (
                                                    '24 Hours'
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {rule.days_of_week ? (
                                                rule.days_of_week.map(d => DAYS[d].label).join(', ')
                                            ) : (
                                                'Every Day'
                                            )}
                                        </div>

                                        <div className="font-medium text-slate-900">
                                            {rule.amount_cents === 0 ? 'FREE' : `$${(rule.amount_cents / 100).toFixed(2)}`}
                                            <span className="text-slate-500 font-normal"> / {isBucket ? 'fixed' : rule.rate_type.toLowerCase()}</span>
                                        </div>
                                    </div>
                                    {isBucket && rule.description && (
                                        <p className="text-xs text-slate-500 italic">{rule.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                    title="Delete Rule"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )
                    })
                )}
            </div>

            <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Add Pricing Rule">
                <form onSubmit={handleSave} className="space-y-4 py-4">
                    {/* Category Selector */}
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                        <button
                            type="button"
                            onClick={() => setRuleCategory('BUCKET')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${ruleCategory === 'BUCKET' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Duration Bucket
                        </button>
                        <button
                            type="button"
                            onClick={() => setRuleCategory('STANDARD')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${ruleCategory === 'STANDARD' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Standard Rate
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                        <input
                            required
                            placeholder={ruleCategory === 'BUCKET' ? "e.g. 0-2 Hours" : "e.g. Weekend Rate"}
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {ruleCategory === 'BUCKET' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                <input
                                    placeholder="e.g. First 2 hours are free"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Min Minutes</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.min_duration_minutes ?? ''}
                                        onChange={e => setFormData({ ...formData, min_duration_minutes: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Minutes</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.max_duration_minutes ?? ''}
                                        onChange={e => setFormData({ ...formData, max_duration_minutes: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {ruleCategory === 'STANDARD' && (
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
                        )}
                        <div className={ruleCategory === 'BUCKET' ? 'col-span-2' : ''}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-500">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={formData.amount_cents !== undefined ? formData.amount_cents / 100 : ''}
                                    onChange={e => setFormData({ ...formData, amount_cents: Math.round(parseFloat(e.target.value) * 100) })}
                                    className="w-full pl-7 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Set to 0 for Free.</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-sm font-medium text-slate-900 mb-2">Availability Constraints (Optional)</p>
                        <div className="space-y-4">
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
                        <p className="text-xs text-slate-500 mt-1">Evaluation Order (Higher = First)</p>
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
