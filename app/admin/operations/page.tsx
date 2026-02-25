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
import { isPast } from 'date-fns'

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
            title: "Gross Revenue",
            value: data ? `$${data.kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-",
            icon: <DollarSign size={20} />,
            color: "bg-green-50 text-green-600"
        },
        {
            title: "Net Revenue",
            value: data ? `$${data.kpis.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-",
            icon: <DollarSign size={20} />,
            color: "bg-emerald-50 text-emerald-600"
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
        },
        {
            title: "Occupancy",
            value: data ? `${data.kpis.occupancyRate}%` : "-",
            icon: <Activity size={20} />,
            color: "bg-indigo-50 text-indigo-600"
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
                                className="h-10 pl-3 pr-8 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 max-w-[200px]"
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
                            className="h-10 pl-3 pr-8 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
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
                                    <Area type="monotone" dataKey="amount" name="Gross Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="netAmount" name="Net Revenue" stroke="#059669" strokeWidth={2} fillOpacity={0.8} fill="url(#colorRevenue)" />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Top Parking Durations</h3>
                    <div className="space-y-4">
                        {data?.charts?.topProducts?.map((product, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-slate-700">{product.name}</span>
                                    <span className="text-slate-900">{product.count} sessions</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className="bg-indigo-500 h-2 rounded-full"
                                        style={{ width: `${Math.max(5, (product.count / (data.kpis.sessions || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {!data?.charts?.topProducts?.length && loading && (
                            <div className="text-slate-400 text-sm text-center py-8">Loading durations...</div>
                        )}
                        {!loading && !data?.charts?.topProducts?.length && (
                            <div className="text-slate-400 text-sm text-center py-8">No session data available</div>
                        )}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Customer Demographics</h3>
                    <div className="flex flex-col lg:flex-row items-center gap-8 h-full pb-8">
                        {data?.charts?.demographics && (
                            <>
                                <div className="relative w-48 h-48 rounded-full border-[16px] border-emerald-500 flex items-center justify-center">
                                    {/* Create a pseudo-pie chart using border styles or radial gradient */}
                                    <div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            background: `conic-gradient(#10b981 ${data.charts.demographics.new / (data.charts.demographics.new + data.charts.demographics.returning || 1) * 100}%, #3b82f6 0)`
                                        }}
                                    />
                                    <div className="absolute inset-2 bg-white rounded-full z-10 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold text-slate-900">
                                            {data.charts.demographics.new + data.charts.demographics.returning}
                                        </span>
                                        <span className="text-xs text-slate-500">Unique Parkers</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded bg-emerald-500"></div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-slate-900">New Customers</div>
                                            <div className="text-xs text-slate-500">{data.charts.demographics.new} unique plates</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-slate-900">Returning Customers</div>
                                            <div className="text-xs text-slate-500">{data.charts.demographics.returning} unique plates</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {!data?.charts?.demographics && loading && (
                            <div className="w-full text-center text-slate-400 py-8">Loading demographics...</div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="mt-8 relative">
                <Card className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                        <Button variant="outline" size="sm" onClick={() => fetchData()}>Refresh</Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Property</th>
                                    <th className="px-6 py-4">Plate</th>
                                    <th className="px-6 py-4">Start Time</th>
                                    <th className="px-6 py-4">End Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data?.recentActivity?.map((session) => (
                                    <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {session.properties?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono font-medium tracking-wide">
                                                {session.vehicle_plate || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {session.start_time ? new Date(session.start_time).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                            }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {session.end_time_current ? new Date(session.end_time_current).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                            }) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const displayStatus = session.status === 'ACTIVE' && session.end_time_current && isPast(new Date(session.end_time_current)) ? 'EXPIRED' : session.status
                                                return (
                                                    <span className={cn(
                                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                        displayStatus === 'ACTIVE' ? "bg-emerald-100 text-emerald-800" :
                                                            displayStatus === 'EXPIRED' ? "bg-amber-100 text-amber-800" :
                                                                "bg-slate-100 text-slate-800"
                                                    )}>
                                                        {displayStatus}
                                                    </span>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            ${((session.total_price_cents || 0) / 100).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {!data?.recentActivity?.length && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            {loading ? 'Loading recent activity...' : 'No recent activity found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    )
}
