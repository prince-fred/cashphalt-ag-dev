'use client'

import { useState, useEffect, useCallback } from 'react'
import { getEnforcementData } from '@/actions/enforcement'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search, RotateCcw, Filter, Car, MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format, formatDistanceToNow, isPast, differenceInMinutes } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export default function EnforcementPage() {
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        plate: '',
        spot: '',
        hoursAgo: 24 as number | null,
        status: 'all' as 'all' | 'active' | 'expired'
    })
    const [lastRefreshed, setLastRefreshed] = useState(new Date())

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getEnforcementData(filters)
            if (res.error) {
                toast.error(res.error)
            } else {
                setSessions(res.sessions)
                setLastRefreshed(new Date())
            }
        } catch (error) {
            toast.error('Failed to fetch enforcement data')
        } finally {
            setLoading(false)
        }
    }, [filters])

    // Debounce filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, 500)
        return () => clearTimeout(timer)
    }, [fetchData])

    const handleRefresh = () => {
        fetchData()
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Enforcement Dashboard</h1>
                    <p className="text-slate-500 mt-1">Monitor active and recently expired sessions.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Last updated: {format(lastRefreshed, 'h:mm:ss a')}</span>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                        <RotateCcw size={14} className={cn("mr-2", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="License Plate..."
                            className="pl-10 uppercase font-mono"
                            value={filters.plate}
                            onChange={(e) => setFilters(prev => ({ ...prev, plate: e.target.value }))}
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Spot or Zone..."
                            className="pl-10"
                            value={filters.spot}
                            onChange={(e) => setFilters(prev => ({ ...prev, spot: e.target.value }))}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            className="flex h-12 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 pl-10 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            className="flex h-12 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 pl-10 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filters.hoursAgo?.toString() ?? 'all'}
                            onChange={(e) => {
                                const val = e.target.value
                                setFilters(prev => ({
                                    ...prev,
                                    hoursAgo: val === 'all' ? null : parseInt(val)
                                }))
                            }}
                        >
                            <option value="4">Last 4 Hours</option>
                            <option value="12">Last 12 Hours</option>
                            <option value="24">Last 24 Hours</option>
                            <option value="72">Last 3 Days</option>
                            <option value="168">Last 7 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Dashboard List */}
            <div className="space-y-4">
                {loading && sessions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading sessions...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Filter size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No sessions found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your filters or check back later.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sessions.map((session) => (
                            <SessionCard key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function SessionCard({ session }: { session: any }) {
    const isActive = session.status === 'ACTIVE'
    const endTime = new Date(session.end_time_current)
    const now = new Date()
    const hasExpired = isPast(endTime)

    // Calculate time difference in minutes
    // differenceInMinutes returns (dateLeft - dateRight)
    // So (endTime - now)
    const minutesRemaining = differenceInMinutes(endTime, now)
    const isExpiringSoon = !hasExpired && minutesRemaining <= 15 && minutesRemaining > 0

    // Status Logic
    let statusConfig = {
        color: 'bg-slate-100 border-slate-200',
        textColor: 'text-slate-700',
        icon: <Clock size={16} />,
        label: 'Expired',
        badge: 'secondary' as "default" | "secondary" | "destructive" | "outline"
    }

    if (hasExpired) {
        // Expired (Active Overstay OR Completed/Ended)
        statusConfig = {
            color: 'bg-red-50 border-red-200',
            textColor: 'text-red-700',
            icon: <AlertCircle size={16} />,
            label: 'Expired',
            badge: 'destructive'
        }
    } else {
        // Not Expired (Active and Valid)
        if (isExpiringSoon) {
            statusConfig = {
                color: 'bg-yellow-50 border-yellow-200',
                textColor: 'text-yellow-700',
                icon: <Clock size={16} />,
                label: 'Expiring Soon',
                badge: 'default' // Maybe need a warning variant? Using default for now or custom class
            }
        } else {
            statusConfig = {
                color: 'bg-green-50 border-green-200',
                textColor: 'text-green-700',
                icon: <CheckCircle size={16} />,
                label: 'Active',
                badge: 'default'
            }
        }
    }

    return (
        <div className={cn("rounded-xl border p-5 shadow-sm transition-all hover:shadow-md", statusConfig.color)}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className={cn("p-2 rounded-lg bg-white bg-opacity-50", statusConfig.textColor)}>
                        {statusConfig.icon}
                    </span>
                    <span className={cn("font-bold text-lg font-mono uppercase", statusConfig.textColor)}>
                        {session.vehicle_plate}
                    </span>
                </div>
                <Badge variant={statusConfig.badge}
                    className={cn(
                        !hasExpired && !isExpiringSoon && "bg-green-600 hover:bg-green-700",
                        isExpiringSoon && "bg-yellow-500 hover:bg-yellow-600 text-white"
                    )}>
                    {statusConfig.label}
                </Badge>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500">Property</span>
                    <span className="font-medium text-slate-900 truncate max-w-[150px]" title={session.properties?.name}>
                        {session.properties?.name || 'Unknown'}
                    </span>
                </div>

                {session.parking_units?.name && (
                    <div className="flex justify-between">
                        <span className="text-slate-500">Spot/Zone</span>
                        <span className="font-medium text-slate-900">{session.parking_units.name}</span>
                    </div>
                )}

                <div className="border-t border-slate-200/50 my-2 pt-2"></div>

                <div className="flex justify-between">
                    <span className="text-slate-500">Expires</span>
                    <span className="font-semibold text-slate-900">
                        {format(endTime, 'h:mm a')}
                    </span>
                </div>

                <div className="flex justify-between items-center bg-white/50 rounded px-2 py-1">
                    <span className="text-xs text-slate-500">
                        {hasExpired ? 'Expired' : 'Expires in'}
                    </span>
                    <span className={cn("font-medium",
                        hasExpired ? "text-red-600" :
                            isExpiringSoon ? "text-yellow-600" : "text-green-600")}>
                        {formatDistanceToNow(endTime, { addSuffix: true })}
                    </span>
                </div>
            </div>
        </div>
    )
}
