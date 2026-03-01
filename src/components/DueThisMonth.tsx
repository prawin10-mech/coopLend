"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { CalendarClock, ChevronRight, X, IndianRupee, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import * as XLSX from "xlsx"

export default function DueThisMonth() {
    const [data, setData] = useState<any>(null)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/loans/due-this-month")
            .then(r => r.json())
            .then(setData)
            .finally(() => setLoading(false))
    }, [])

    const fmt = (n: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

    const fmtDate = (d: string) => {
        try { return format(new Date(d), "dd MMM yyyy") } catch { return "—" }
    }

    const handleExport = () => {
        if (!data?.loans?.length) return
        const rows = data.loans.map((l: any) => ({
            "GL No.": l.glNo ?? "",
            "Member Name": l.memberName ?? "",
            "Loan #": l.loanNumber ?? "",
            "Village": l.village ?? "",
            "Scheme": l.scheme ?? "",
            "Contact": l.contactNumber ?? "",
            "Principal (₹)": l.totalPrincipalAmount ?? 0,
            "Due Date": l.dueDate ? fmtDate(l.dueDate) : "",
        }))
        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Due This Month")
        XLSX.writeFile(wb, `due_${data.month?.replace(" ", "_")}.xlsx`)
    }


    return (
        <>
            {/* Dashboard Summary Card */}
            <Card
                className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow hover:border-orange-400/60 group"
                onClick={() => setOpen(true)}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Due This Month</CardTitle>
                    <CalendarClock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="h-8 bg-muted/40 animate-pulse rounded w-16" />
                    ) : (
                        <>
                            <div className="text-2xl font-bold text-orange-600">{data?.count ?? 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {data?.month} · {data?.totalPrincipal ? fmt(data.totalPrincipal) : "—"}
                            </p>
                            <p className="text-xs text-orange-500 mt-2 group-hover:underline flex items-center gap-1">
                                View list <ChevronRight className="h-3 w-3" />
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Slide-over / modal panel */}
            {open && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />

                    {/* Panel */}
                    <div className="w-full max-w-2xl bg-background/80 backdrop-blur-xl border-l shadow-2xl flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <CalendarClock className="h-5 w-5 text-orange-500" />
                                    Loans Due — {data?.month}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {data?.count} loans · {data?.totalPrincipal ? fmt(data.totalPrincipal) : "—"} total principal
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExport} disabled={!data?.loans?.length}>
                                    <Download className="h-3.5 w-3.5" /> Export
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading && (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-20 bg-muted/40 animate-pulse rounded-lg" />
                                    ))}
                                </div>
                            )}
                            {!loading && data?.loans?.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                                    <CalendarClock className="h-10 w-10 opacity-30" />
                                    <p className="text-sm">No loans due this month</p>
                                </div>
                            )}
                            {!loading && data?.loans?.map((loan: any) => (
                                <div key={loan._id} className="flex items-start gap-3 rounded-xl border p-4 bg-card hover:bg-muted/20 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm text-foreground">{loan.memberName}</span>
                                            {loan.glNo && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">GL: {loan.glNo}</span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 mt-2 text-xs text-muted-foreground">
                                            <span>Village: <span className="text-foreground font-medium">{loan.village || "—"}</span></span>
                                            <span>Scheme: <span className="text-foreground font-medium">{loan.scheme || "—"}</span></span>
                                            <span>Contact: <span className="text-foreground font-medium">{loan.contactNumber || "—"}</span></span>
                                            <span className="flex items-center gap-1">
                                                <IndianRupee className="h-3 w-3" />
                                                Principal: <span className="text-foreground font-medium">{fmt(loan.totalPrincipalAmount || 0)}</span>
                                            </span>
                                            <span>Due: <span className="text-orange-600 font-semibold">{fmtDate(loan.dueDate)}</span></span>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs" asChild>
                                        <Link href={loan.glNo ? `/loans/gl/${encodeURIComponent(loan.glNo)}` : `/loans/${loan._id}`}>
                                            View
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
