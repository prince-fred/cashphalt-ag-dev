import { getSessions } from '@/actions/sessions'
import { Badge } from '@/components/ui/Badge' // Assuming we might want a badge, or standard div
import { format } from 'date-fns'

export const dynamic = 'force-dynamic' // Ensure it always refetches on load

export default async function AdminSessionsPage() {
    const sessions = await getSessions()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Parking Sessions</h1>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Plate</th>
                                <th className="px-6 py-4">Property</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No sessions found.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <StatusBadge status={session.status} />
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-900">
                                            {session.vehicle_plate}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {/* @ts-ignore join types can be tricky */}
                                            {session.properties?.name || 'Unknown Property'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {/* Calculate duration based on start/end or stored duration? 
                                                For now comparing start/end times if we wanted, 
                                                but simple display relies on implementation.
                                                Let's just show raw start/end diff or nothing for now
                                            */}
                                            <span className="text-xs text-slate-400">
                                                {format(new Date(session.end_time_initial), 'h:mm a')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            ${(session.total_price_cents / 100).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
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
    }

    const style = styles[status] || 'bg-slate-100 text-slate-500'

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
            {status.replace('_', ' ')}
        </span>
    )
}
