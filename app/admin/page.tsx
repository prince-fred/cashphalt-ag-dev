import { getAdminStats } from '@/actions/admin'
import { ArrowUpRight, Car, DollarSign, Building } from 'lucide-react'

export default async function AdminDashboardPage() {
    const stats = await getAdminStats()

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-2">Real-time overview of your parking operations.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">
                            ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm mt-2 font-medium bg-green-50 px-2 py-0.5 rounded">
                            <ArrowUpRight size={14} /> +12%
                        </span>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Active Sessions</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">
                            {stats.activeCount}
                        </h3>
                        <p className="text-slate-400 text-sm mt-2">Currently parked vehicles</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Car size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Properties</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">
                            {stats.propertyCount}
                        </h3>
                        <p className="text-slate-400 text-sm mt-2">Managed locations</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Building size={24} />
                    </div>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Recent Sessions</h3>
                </div>
                <div className="p-8 text-center text-slate-500">
                    No recent activity to display.
                </div>
            </div>
        </div>
    )
}
