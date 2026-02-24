import { getSessions, getAssignedProperties } from '@/actions/sessions'
// Badge import removed
import { format, isPast } from 'date-fns'
import { SessionsFilter } from './SessionsFilter'
import { Mail, Phone } from 'lucide-react'

export const dynamic = 'force-dynamic' // Ensure it always refetches on load

export default async function AdminSessionsPage({
    searchParams,
}: {
    searchParams: Promise<{ propertyId?: string; status?: string; search?: string }>
}) {
    const params = await searchParams
    const sessions = await getSessions(params)
    const properties = await getAssignedProperties()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Parking Sessions</h1>

            <SessionsFilter properties={properties} />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Plate</th>
                                <th className="px-6 py-4">Property</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Duration/End</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Created Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No sessions found.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                status={session.status === 'ACTIVE' && isPast(new Date(session.end_time_current)) ? 'EXPIRED' : session.status}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-900">
                                            {session.vehicle_plate}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {/* @ts-ignore join types can be tricky */}
                                            {session.properties?.name || 'Unknown Property'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-xs text-slate-600">
                                                {session.customer_email ? (
                                                    <a href={`mailto:${session.customer_email}`} className="flex items-center gap-1 hover:text-blue-600">
                                                        <Mail size={12} /> {session.customer_email}
                                                    </a>
                                                ) : <span className="text-slate-400 italic">No email</span>}
                                                {session.customer_phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone size={12} /> {session.customer_phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    Ends at:
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {format(new Date(session.end_time_current), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            ${(session.total_price_cents / 100).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {format(new Date(session.created_at), 'MMM d, h:mm a')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        ACTIVE: 'bg-green-100 text-green-700 border-green-200',
        COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
        PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        EXPIRED: 'bg-red-100 text-red-700 border-red-200',
    }

    const style = styles[status] || 'bg-slate-100 text-slate-500'

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
            {status.replace('_', ' ')}
        </span>
    )
}
