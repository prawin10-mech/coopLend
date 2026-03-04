"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Landmark, Menu, X, Archive } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

const NAV_LINKS = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/loans", label: "Loan Records", icon: FileText },
    { href: "/closed-loans", label: "Closed Loans", icon: Archive },
]

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close drawer whenever route changes
    useEffect(() => { setOpen(false) }, [pathname])
    // Prevent body scroll when menu open
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [open])

    return (
        <>
            {/* Mobile top bar — only shown on small screens */}
            <header className="md:hidden flex items-center justify-between h-14 px-4 border-b bg-sidebar text-sidebar-foreground shrink-0">
                <div className="flex items-center gap-2 font-bold text-base">
                    <Landmark className="w-5 h-5 text-primary" />
                    <span>CoopLend</span>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        onClick={() => setOpen(p => !p)}
                        className="p-2 rounded-md hover:bg-sidebar-accent transition-colors"
                        aria-label="Toggle menu"
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Backdrop */}
            {open && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Slide-in drawer */}
            <div className={`md:hidden fixed top-0 left-0 h-full w-64 z-50 bg-sidebar text-sidebar-foreground flex flex-col shadow-xl transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
                {/* Drawer header */}
                <div className="h-14 flex items-center justify-between px-5 border-b border-sidebar-border/10 font-bold text-base">
                    <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-primary" />
                        <span>CoopLend</span>
                    </div>
                    <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-sidebar-accent" aria-label="Close menu">
                        <X className="w-4 w-4" />
                    </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-4 py-5 space-y-1">
                    <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">General</p>
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm ${pathname === href
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                                }`}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Profile */}
                <div className="p-4 border-t border-sidebar-border/10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">OA</div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">Officer Admin</div>
                        <div className="text-xs text-sidebar-foreground/60 truncate">admin@cooplend.com</div>
                    </div>
                </div>
            </div>
        </>
    )
}
