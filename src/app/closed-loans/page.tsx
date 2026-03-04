"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Archive, Search, Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ClosedLoan {
    _id: string
    glNo: string
    loanNo: string
    memberName?: string
    demandYear: number
    dueDate?: string
    grandTotal: number
    contactNumber?: string
}

export default function ClosedLoansPage() {
    const { status } = useSession()
    const router = useRouter()

    const [loans, setLoans] = useState<ClosedLoan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    useEffect(() => {
        async function fetchClosedLoans() {
            try {
                const res = await fetch("/api/loans/closed")
                if (res.ok) {
                    const data = await res.json()
                    setLoans(data)
                }
            } catch (error) {
                console.error("Failed to fetch closed loans:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (status === "authenticated") {
            fetchClosedLoans()
        }
    }, [status])

    const filteredLoans = loans.filter(loan => {
        const query = searchQuery.toLowerCase()
        return (
            loan.glNo.toLowerCase().includes(query) ||
            loan.loanNo.toLowerCase().includes(query) ||
            (loan.memberName || "").toLowerCase().includes(query) ||
            loan.demandYear.toString().includes(query)
        )
    })

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const totalPages = Math.ceil(filteredLoans.length / itemsPerPage)
    const paginatedLoans = filteredLoans.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleExport = () => {
        const headers = ["GL No", "Loan No", "Member Name", "Demand Year", "Due Date", "Demand Total", "Contact Number"]
        const csvRows = [headers.join(",")]

        for (const record of filteredLoans) {
            const row = [
                `"${record.glNo || ''}"`,
                `"${record.loanNo || ''}"`,
                `"${record.memberName || ''}"`,
                record.demandYear,
                `"${record.dueDate || ''}"`,
                record.grandTotal,
                `"${record.contactNumber || ''}"`
            ]
            csvRows.push(row.join(","))
        }

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Closed_Loans_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    if (status === "loading" || (status === "authenticated" && isLoading)) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (status === "unauthenticated") return null

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Archive className="h-6 w-6 text-primary" />
                        Closed / Unmatched Loans
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        These records were imported from repayments but do not match any active loan in the system.
                    </p>
                </div>
                <Button onClick={handleExport} variant="default" className="gap-2 shrink-0">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-4 flex-wrap">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search GL, Loan, Name or Year..."
                            className="pl-9 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                        Total Records: {filteredLoans.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/40 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 font-semibold">GL No</th>
                                <th className="px-4 py-3 font-semibold">Loan No</th>
                                <th className="px-4 py-3 font-semibold">Member Name</th>
                                <th className="px-4 py-3 font-semibold">Year</th>
                                <th className="px-4 py-3 font-semibold">Due Date</th>
                                <th className="px-4 py-3 font-semibold text-right">Demand Total</th>
                                <th className="px-4 py-3 font-semibold">Phone</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginatedLoans.length > 0 ? (
                                paginatedLoans.map((loan) => (
                                    <tr key={loan._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{loan.glNo}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{loan.loanNo}</td>
                                        <td className="px-4 py-3">{loan.memberName || <span className="text-muted-foreground italic">—</span>}</td>
                                        <td className="px-4 py-3 font-medium text-primary">{loan.demandYear}</td>
                                        <td className="px-4 py-3 text-xs">{loan.dueDate || <span className="text-muted-foreground italic">—</span>}</td>
                                        <td className="px-4 py-3 text-right font-semibold">
                                            ₹{loan.grandTotal.toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-4 py-3 text-xs">{loan.contactNumber || <span className="text-muted-foreground italic">—</span>}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        <Archive className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                                        <p>No unmatched loans found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between bg-muted/10 flex-wrap gap-2">
                        <p className="text-sm text-muted-foreground">
                            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredLoans.length)} of {filteredLoans.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                            </Button>
                            <span className="text-sm font-medium px-2">Page {currentPage} of {totalPages}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
