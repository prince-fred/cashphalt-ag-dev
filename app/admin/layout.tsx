import Link from 'next/link'
import { LayoutDashboard, Building2, Ticket, Settings, LogOut } from 'lucide-react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold tracking-tight">Cashphalt Admin</h1>
                    <p className="text-xs text-slate-500 mt-1">Production v1.0</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LayoutDashboard size={20} />
                        Overview
                    </Link>
                    <Link
                        href="/admin/properties"
                        className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Building2 size={20} />
                        Properties
                    </Link>
                    <Link
                        href="/admin/sessions"
                        className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Ticket size={20} />
                        Sessions
                    </Link>
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Settings size={20} />
                        Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 w-full rounded-lg transition-colors">
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-slate-200 p-4 md:hidden flex items-center justify-between">
                    <span className="font-bold text-slate-900">Cashphalt</span>
                    {/* Mobile menu trigger would go here */}
                </header>
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
