import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { LayoutDashboard, FileText, Landmark } from "lucide-react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loan Management CRM | Cooperative Society",
  description: "Advanced Full-Stack Loan Management CRM for tracking cooperative society loan data, disbursements, and multi-year repayment ledgers.",
  keywords: ["Loan CRM", "Loan Management", "Cooperative Society", "Finance Dashboard"],
  authors: [{ name: "Admin" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col hidden md:flex border-r border-sidebar-border/10">
              {/* Logo area */}
              <div className="h-16 flex items-center justify-between px-6 font-bold text-lg border-b border-sidebar-border/10">
                <div className="flex items-center space-x-2">
                  <Landmark className="w-6 h-6 text-primary" />
                  <span>CoopLend<br /><span className="text-xs uppercase font-normal tracking-wider text-muted-foreground">Manager</span></span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 py-6 px-4 space-y-1">
                <div className="px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">General</div>
                <Link href="/" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group">
                  <LayoutDashboard className="w-5 h-5 text-sidebar-accent-foreground/70 group-hover:text-sidebar-accent-foreground" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link href="/loans" className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group">
                  <FileText className="w-5 h-5 text-sidebar-accent-foreground/70 group-hover:text-sidebar-accent-foreground" />
                  <span className="font-medium">Loan Records</span>
                </Link>
              </div>

              {/* Profile area */}
              <div className="p-4 border-t border-sidebar-border/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    OA
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Officer Admin</div>
                    <div className="text-xs text-sidebar-foreground/60">admin@cooplend.com</div>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
