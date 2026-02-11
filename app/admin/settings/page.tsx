import Link from 'next/link'
import { Users, CreditCard, UserCircle } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin/settings/team" className="block p-6 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Users size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Team Management</h2>
                    <p className="text-slate-500 text-sm">Invite staff members and manage roles.</p>
                </Link>

                <div className="p-6 bg-white border border-slate-200 rounded-xl opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 mb-4">
                        <CreditCard size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Billing</h2>
                    <p className="text-slate-500 text-sm">Manage subscription and payment methods.</p>
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-xl opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 mb-4">
                        <UserCircle size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Profile</h2>
                    <p className="text-slate-500 text-sm">Update your personal account details.</p>
                </div>
            </div>
        </div>
    )
}
