'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, FileText, Landmark, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileNav } from '@/components/MobileNav';

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    const pathname = usePathname();
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors group
                ${isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                    : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
        >
            <Icon className={`w-5 h-5 ${isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-accent-foreground/70 group-hover:text-sidebar-accent-foreground'}`} />
            <span className="font-medium">{label}</span>
        </Link>
    );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const router = useRouter();

    const userName = session?.user?.name ?? 'Officer Admin';
    const username = session?.user?.username ?? 'admin';
    const initials = userName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    async function handleLogout() {
        await signOut({ redirect: false });
        router.push('/login');
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar — hidden on mobile */}
            <aside className="w-64 bg-sidebar text-sidebar-foreground flex-col hidden md:flex border-r border-sidebar-border/10 shrink-0">
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 font-bold text-lg border-b border-sidebar-border/10">
                    <div className="flex items-center space-x-2">
                        <Landmark className="w-6 h-6 text-primary" />
                        <span>
                            CoopLend
                            <br />
                            <span className="text-xs uppercase font-normal tracking-wider text-muted-foreground">Manager</span>
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <div className="flex-1 py-6 px-4 space-y-1">
                    <div className="px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">General</div>
                    <NavLink href="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavLink href="/loans" icon={FileText} label="Loan Records" />
                </div>

                {/* Profile */}
                <div className="p-4 border-t border-sidebar-border/10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{userName}</p>
                                <div className="text-xs text-sidebar-foreground/60 truncate">@{username}</div>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    {session && (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md py-1.5 px-2 transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                        </button>
                    )}
                </div>
            </aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile top bar */}
                <MobileNav />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
