'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAnalyticsData, AnalyticsData } from '@/actions/analytics'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { DollarSign, Users, Activity, ChevronDown, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function OperationsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        propertyId: 'all',
        dateRange: '30d' as 'today' | '7d' | '30d' | 'month' | 'all'
    })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getAnalyticsData(filters)
            if (res.error) {
                toast.error(res.error)
            } else {
                setData(res.data || null)
            }
        } catch (error) {
            toast.error('Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const kpiCards = [
        {
            title: "Total Revenue",
            value: data ? `$${data.kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-",
            icon: <DollarSign size={20} />,
            color: "bg-green-50 text-green-600"
        },
        {
            title: "Total Sessions",
            value: data ? data.kpis.sessions : "-",
            icon: <Activity size={20} />,
            color: "bg-blue-50 text-blue-600"
        },
        {
            title: "Active Now",
            value: data ? data.kpis.activeCount : "-",
            icon: <Users size={20} />,
            color: "bg-purple-50 text-purple-600"
        }
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Operations Dashboard</h1>
                    <p className="text-slate-500 mt-1">Overview of business performance and operational metrics.</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    {data?.properties && data.properties.length > 0 && (
                        <div className="relative">
                            <select
                                className="h-10 pl-3 pr-8 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 max-w-[200px]"
                                value={filters.propertyId}
                                onChange={(e) => setFilters(prev => ({ ...prev, propertyId: e.target.value }))}
                            >
                                <option value="all">All Properties</option>
                                {data.properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="relative">
                        <select
                            className="h-10 pl-3 pr-8 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                            value={filters.dateRange}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                        >
                            <option value="today">Today</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="month">This Month</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchData()}>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpiCards.map((card, i) => (
                    <Card key={i} className="p-6 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-2">{card.value}</h3>
                        </div>
                        <div className={cn("p-2 rounded-lg", card.color)}>
                            {card.icon}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Trend</h3>
                    <div className="h-[300px] w-full">
                        {data?.charts?.revenue && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.charts.revenue}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                                        formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                        {!data?.charts?.revenue && loading && (
                            <div className="h-full w-full flex items-center justify-center text-slate-400">Loading chart...</div>
                        )}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Session Volume</h3>
                    <div className="h-[300px] w-full">
                        {data?.charts?.volume && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.charts.volume}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f1f5f9' }}
                                        formatter={(value: any) => [value || 0, 'Sessions']}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {!data?.charts?.volume && loading && (
                            <div className="h-full w-full flex items-center justify-center text-slate-400">Loading chart...</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Recent Activity Table could go here */}
        </div>
    )
}
