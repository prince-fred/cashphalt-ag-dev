'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SessionsFilterProps {
    properties: { id: string, name: string }[]
}

export function SessionsFilter({ properties }: SessionsFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [status, setStatus] = useState(searchParams.get('status') || 'all')
    const [propertyId, setPropertyId] = useState(searchParams.get('propertyId') || 'all')
    const [search, setSearch] = useState(searchParams.get('search') || '')

    // Sync state with URL params when they change (e.g. on Reset)
    useEffect(() => {
        setStatus(searchParams.get('status') || 'all')
        setPropertyId(searchParams.get('propertyId') || 'all')
        setSearch(searchParams.get('search') || '')
    }, [searchParams])

    const applyFiltersWith = useCallback((newStatus: string, newPropertyId: string, newSearch: string) => {
        const params = new URLSearchParams()
        if (newStatus !== 'all') params.set('status', newStatus)
        if (newPropertyId !== 'all') params.set('propertyId', newPropertyId)
        if (newSearch.trim()) params.set('search', newSearch.trim())

        router.push(`/admin/sessions?${params.toString()}`)
    }, [router])

    const handleSearchSubmit = () => {
        applyFiltersWith(status, propertyId, search)
    }

    const resetFilters = () => {
        router.push('/admin/sessions')
    }

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center mb-6">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search license plate..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm text-slate-900 placeholder:text-slate-400"
                />
            </div>

            <select
                value={status}
                onChange={(e) => {
                    setStatus(e.target.value);
                    applyFiltersWith(e.target.value, propertyId, search);
                }}
                className="w-full md:w-auto px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm text-slate-900"
            >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
            </select>

            {properties.length > 0 && (
                <select
                    value={propertyId}
                    onChange={(e) => {
                        setPropertyId(e.target.value);
                        applyFiltersWith(status, e.target.value, search);
                    }}
                    className="w-full md:w-auto px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm text-slate-900"
                >
                    <option value="all">All Properties</option>
                    {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            )}

            <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={handleSearchSubmit} className="flex-1 md:flex-none">
                    Search
                </Button>
                <Button variant="outline" onClick={resetFilters} className="flex-1 md:flex-none text-slate-500">
                    Reset
                </Button>
            </div>
        </div>
    )
}
