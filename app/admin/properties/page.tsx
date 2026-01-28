import Link from 'next/link'
import { getProperties } from '@/actions/properties'
import { Plus, MapPin, QrCode } from 'lucide-react'

export default async function AdminPropertiesPage() {
    const properties = await getProperties()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage parking locations and settings.</p>
                </div>
                <Link
                    href="/admin/properties/new"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    Add Property
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {!properties.length ? (
                    <div className="p-12 text-center text-slate-500">
                        No properties found. Create your first one!
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {properties.map((p) => (
                            <div key={p.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{p.name}</h3>
                                        <p className="text-sm text-slate-500 font-mono mt-0.5">/{p.slug}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                                {p.allocation_mode}
                                            </span>
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                Max: {p.max_booking_duration_hours}h
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/pay/${p.id}`} // Helper to view public page easily
                                        target="_blank"
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="View Public Page"
                                    >
                                        <span className="text-xs font-bold mr-1">View</span>
                                    </Link>
                                    <Link
                                        href={`/admin/properties/${p.id}`}
                                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white hover:border-slate-300 transition-colors"
                                    >
                                        <SettingsIcon size={16} />
                                        Manage
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function SettingsIcon({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
