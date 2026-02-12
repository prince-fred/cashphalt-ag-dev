import { getAdminStats } from '@/actions/admin'
import { ArrowUpRight, Car, DollarSign, Building } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default async function AdminDashboardPage() {
    const stats = await getAdminStats()

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-matte-black uppercase tracking-tight">Dashboard</h1>
                <p className="text-gray-600 mt-2">Real-time overview of your parking operations.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Revenue Today</p>
                        <h3 className="text-3xl font-bold text-matte-black mt-2">
                            ${stats.revenueToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-gray-600 text-sm mt-2">Since midnight</p>
                    </div>
                    <div className="p-3 bg-matte-black text-signal-yellow rounded-lg shadow-md">
                        <DollarSign size={24} />
                    </div>
                </Card>

                <Card className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-matte-black mt-2">
                            ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-success-green text-sm mt-2 font-bold bg-green-50 px-2 py-0.5 rounded">
                            <ArrowUpRight size={14} /> +Lifetime
                        </span>
                    </div>
                    <div className="p-3 bg-gray-100 text-gray-600 rounded-lg shadow-sm">
                        <DollarSign size={24} />
                    </div>
                </Card>

                <Card className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Active Sessions</p>
                        <h3 className="text-3xl font-bold text-matte-black mt-2">
                            {stats.activeCount}
                        </h3>
                        {stats.totalUnits > 0 && (
                            <p className="text-gray-600 text-sm mt-2">
                                {Math.round((stats.activeCount / stats.totalUnits) * 100)}% Occupancy
                            </p>
                        )}
                        {stats.totalUnits === 0 && (
                            <p className="text-gray-600 text-sm mt-2">Currently parked</p>
                        )}
                    </div>
                    <div className="p-3 bg-matte-black text-signal-yellow rounded-lg shadow-md">
                        <Car size={24} />
                    </div>
                </Card>

                <Card className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Properties</p>
                        <h3 className="text-3xl font-bold text-matte-black mt-2">
                            {stats.propertyCount}
                        </h3>
                        <p className="text-gray-600 text-sm mt-2">Managed locations</p>
                    </div>
                    <div className="p-3 bg-gray-100 text-gray-600 rounded-lg shadow-sm">
                        <Building size={24} />
                    </div>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="overflow-hidden p-0">
                <div className="p-6 border-b border-slate-outline bg-concrete-grey">
                    <h3 className="font-bold text-matte-black uppercase tracking-wide">Recent Sessions</h3>
                </div>
                {stats.recentSessions.length === 0 ? (
                    <div className="p-12 text-center text-gray-600 italic">
                        No recent activity to display.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {stats.recentSessions.map((session: any) => (
                            <div key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                        {session.vehicle_plate.slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-matte-black">{session.vehicle_plate}</p>
                                        <p className="text-xs text-gray-500">{session.properties?.name || 'Unknown Property'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-matte-black">${(session.total_price_cents / 100).toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">{new Date(session.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
