import { getAdminStats } from '@/actions/admin'
import { ArrowUpRight, Car, DollarSign, Building } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default async function AdminDashboardPage() {
    const stats = await getAdminStats()

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-matte-black uppercase tracking-tight">Dashboard</h1>
                <p className="text-gray-500 mt-2">Real-time overview of your parking operations.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-matte-black mt-2">
                            ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-success-green text-sm mt-2 font-bold bg-green-50 px-2 py-0.5 rounded">
                            <ArrowUpRight size={14} /> +12%
                        </span>
                    </div>
                    <div className="p-3 bg-matte-black text-signal-yellow rounded-lg shadow-md">
                        <DollarSign size={24} />
                    </div>
                </Card>

                <Card className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Sessions</p>
                        <h3 className="text-3xl font-bold text-matte-black mt-2">
                            {stats.activeCount}
                        </h3>
                        <p className="text-gray-400 text-sm mt-2">Currently parked vehicles</p>
                    </div>
                    <div className="p-3 bg-matte-black text-signal-yellow rounded-lg shadow-md">
                        <Car size={24} />
                    </div>
                </Card>

                <Card className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Properties</p>
                        <h3 className="text-3xl font-bold text-matte-black mt-2">
                            {stats.propertyCount}
                        </h3>
                        <p className="text-gray-400 text-sm mt-2">Managed locations</p>
                    </div>
                    <div className="p-3 bg-matte-black text-signal-yellow rounded-lg shadow-md">
                        <Building size={24} />
                    </div>
                </Card>
            </div>

            {/* Recent Activity Placeholder */}
            <Card className="overflow-hidden p-0">
                <div className="p-6 border-b border-slate-outline bg-concrete-grey">
                    <h3 className="font-bold text-matte-black uppercase tracking-wide">Recent Sessions</h3>
                </div>
                <div className="p-12 text-center text-gray-500 italic">
                    No recent activity to display.
                </div>
            </Card>
        </div>
    )
}
