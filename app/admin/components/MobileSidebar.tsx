"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Ticket,
    Settings,
    LogOut,
    ShieldCheck as Shield,
    Users,
    Activity,
    Menu,
    X
} from "lucide-react";
import { signOut } from "@/actions/auth";

export function MobileSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on path change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const navLinks = [
        { href: "/admin", icon: LayoutDashboard, label: "Overview" },
        { href: "/admin/operations", icon: Activity, label: "Operations" },
        { href: "/admin/properties", icon: Building2, label: "Properties" },
        { href: "/admin/organizations", icon: Building2, label: "Organizations" },
        { href: "/admin/sessions", icon: Ticket, label: "Sessions" },
        { href: "/admin/enforcement", icon: Shield, label: "Enforcement" },
        { href: "/admin/users", icon: Users, label: "Team" },
        { href: "/admin/settings", icon: Settings, label: "Settings" },
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 -mr-2 text-matte-black hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Open global menu"
            >
                <Menu size={24} />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Drawer */}
            <div
                className={`fixed inset-y-0 left-0 w-64 bg-matte-black text-white z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 bg-white rounded p-1">
                            <Image
                                src="/axis-parking-logo.svg"
                                alt="Axis Parking Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            Axis Parking <span className="text-signal-yellow">Admin</span>
                        </h1>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 -mr-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto w-full">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium flex-nowrap ${isActive
                                    ? "text-white bg-white/5"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <Icon size={20} className="shrink-0" />
                                <span className="truncate">{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 shrink-0">
                    <form action={signOut}>
                        <button type="submit" className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 w-full rounded-lg transition-colors font-medium text-left">
                            <LogOut size={20} className="shrink-0" />
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
