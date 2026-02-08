import Link from 'next/link'
import { getOrganizations } from '@/actions/organizations'
import { Plus, Building2, Settings } from 'lucide-react'

export default async function AdminOrganizationsPage() {
    const organizations = await getOrganizations()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
                    <p className="text-slate-600 text-sm mt-1">Manage organization details and billing.</p>
                </div>
                <Link
                    href="/admin/organizations/new"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    Add Organization
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {!organizations.length ? (
                    <div className="p-12 text-center text-slate-500">
                        No organizations found. Create your first one!
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {organizations.map((org) => (
                            <div key={org.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{org.name}</h3>
                                        <p className="text-sm text-slate-600 font-mono mt-0.5">/{org.slug}</p>
                                        {org.stripe_connect_id && (
                                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium mt-2 inline-block">
                                                Connected
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/organizations/${org.id}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm"
                                    >
                                        <Settings size={16} />
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
