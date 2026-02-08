import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Building2, Ticket, Settings, LogOut } from 'lucide-react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-concrete-grey flex">
            {/* Sidebar */}
            <aside className="w-64 bg-matte-black text-white hidden md:flex flex-col border-r border-white/5">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-8 h-8 bg-white rounded p-1">
                            <Image
                                src="/cashphalt-logo.svg"
                                alt="Cashphalt Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            Cashphalt <span className="text-signal-yellow">Admin</span>
                        </h1>
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest pl-1">Production v1.0</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-white hover:text-signal-yellow hover:bg-white/5 rounded-lg transition-all font-medium"
                    >
                        <LayoutDashboard size={20} />
                        Overview
                    </Link>
                    <Link
                        href="/admin/properties"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all font-medium"
                    >
                        <Building2 size={20} />
                        Properties
                    </Link>
                    <Link
                        href="/admin/organizations"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all font-medium"
                    >
                        <Building2 size={20} />
                        Organizations
                    </Link>
                    <Link
                        href="/admin/sessions"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all font-medium"
                    >
                        <Ticket size={20} />
                        Sessions
                    </Link>
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all font-medium"
                    >
                        <Settings size={20} />
                        Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 w-full rounded-lg transition-colors font-medium">
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-slate-outline p-4 md:hidden flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 bg-white rounded p-1 border border-slate-200">
                            <Image
                                src="/cashphalt-logo.svg"
                                alt="Cashphalt Logo"
                                fill
                                className="object-contain" // The logo is yellow/black, might need contrast on white header. 
                            // Actually the logo is likely designed for light bg (black text) or dark bg (white text). 
                            // Assuming the svg has black text based on generation prompt. 
                            // If it's transparent, it should work.
                            />
                        </div>
                        <span className="font-bold text-matte-black">Cashphalt</span>
                    </div>
                    {/* Mobile menu trigger would go here */}
                </header>
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
