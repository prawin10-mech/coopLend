"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentForm } from "@/components/PaymentForm"
import { format } from "date-fns"
import { ArrowLeft, CheckCircle2, Calendar, FileBarChart2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"

const YEARS = [2025, 2026, 2027, 2028, 2029]
const yearBadge = (year: number) => {
    const now = new Date().getFullYear()
    if (year < now) return "bg-red-100 text-red-700 border-red-200"
    if (year === now) return "bg-amber-100 text-amber-700 border-amber-200"
    return "bg-blue-50 text-blue-600 border-blue-200"
}
const fmtINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)

export default function BorrowerProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { id } = params

    const [loan, setLoan] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Partial Payment Modal State
    const [payModalOpen, setPayModalOpen] = useState(false)
    const [payModalData, setPayModalData] = useState<{ year: number, totalAmount: number } | null>(null)
    const [payAmount, setPayAmount] = useState<string>("")

    const fetchLoan = async () => {
        try {
            const res = await fetch(`/api/loans/${id}`)
            if (!res.ok) {
                if (res.status === 404) router.push('/loans')
                return
            }
            const json = await res.json()
            setLoan(json)
        } catch (error) {
            console.error("Error fetching loan:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) fetchLoan()
    }, [id])

    const handleLogPayment = async (data: any) => {
        if (!loan) return
        setSubmitting(true)

        try {
            // Find current active demand year (start with current year, fallback to past unpaid)
            const currentYear = new Date().getFullYear()
            let targetDemandYear: number | null = null

            if (loan.annualDemands && !data.remarks?.includes("Demand]")) {
                const demandYears = Object.keys(loan.annualDemands).map(Number).sort((a, b) => a - b)
                for (const yr of demandYears) {
                    if (yr > currentYear) continue
                    const demand = loan.annualDemands[yr]
                    const paidTowards = (loan.repaymentHistory || [])
                        .filter((p: any) => p.remarks?.includes(`[${yr} Demand]`))
                        .reduce((sum: number, p: any) => sum + p.amountPaid, 0)

                    if (paidTowards < demand.grandTotal) {
                        targetDemandYear = yr
                        break // target the oldest unpaid demand up to current year
                    }
                }
            }

            const autoRemark = targetDemandYear
                ? `[${targetDemandYear} Demand] ${data.remarks || 'Standard repayment'}`
                : data.remarks || 'Standard repayment'

            // Append the new payment to the existing history
            const updatedHistory = [...(loan.repaymentHistory || []), {
                paymentDate: new Date(data.paymentDate).toISOString(),
                amountPaid: Number(data.amountPaid),
                remarks: autoRemark
            }]

            const res = await fetch(`/api/loans/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repaymentHistory: updatedHistory }),
            })

            if (res.ok) {
                fetchLoan() // refresh data
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleClose = async () => {
        if (!loan) return
        setSubmitting(true)

        try {
            const res = await fetch(`/api/loans/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isClosed: !loan.isClosed }),
            })

            if (res.ok) {
                fetchLoan() // refresh data
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8">Loading borrower profile...</div>
    if (!loan) return <div className="p-8">Loan not found.</div>

    const totalRepaid = loan.repaymentHistory?.reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0
    const isPaidOff = loan.outstandingAmount <= 0 || loan.isClosed

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{loan.memberName}</h2>
                        <p className="text-muted-foreground">Loan Number: {loan.loanNumber}</p>
                    </div>
                    {isPaidOff && (
                        <div className="hidden sm:flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 ml-4">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            <span className="font-semibold text-sm">{loan.isClosed ? "Closed" : "Fully Paid"}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isPaidOff && (
                        <div className="sm:hidden flex flex-1 justify-center items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            <span className="font-semibold text-sm">{loan.isClosed ? "Closed" : "Fully Paid"}</span>
                        </div>
                    )}
                    <Button
                        variant={loan.isClosed ? "outline" : "secondary"}
                        onClick={handleToggleClose}
                        disabled={submitting}
                        className="flex-1 sm:flex-none"
                    >
                        {loan.isClosed ? "Reopen Loan" : "Mark as Closed"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Loan Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Principal Amount</p>
                                <p className="text-lg font-semibold">₹{loan.totalPrincipalAmount?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Repaid</p>
                                <p className="text-lg font-semibold text-green-600">₹{totalRepaid.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                                <p className={`text-lg font-semibold ${loan.outstandingAmount > 0 ? 'text-red-500' : ''}`}>
                                    ₹{loan.outstandingAmount?.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Disbursal Date</p>
                                <p>{loan.disbursalDate ? format(new Date(loan.disbursalDate), "dd MMM yyyy") : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                                <p>{loan.dueDate ? format(new Date(loan.dueDate), "dd MMM yyyy") : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Scheme</p>
                                <p>{loan.scheme || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Borrower Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                                <p>{loan.contactNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Aadhaar Card No</p>
                                <p>{loan.aadhaarCardNo || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Village</p>
                                <p>{loan.village || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Father/Spouse Name</p>
                                <p>{loan.fatherSpouseName || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Demand Schedule from repayments.xls */}
                    <Card className="glass-card border-amber-200/60">
                        <CardHeader className="pb-3 border-b bg-amber-50/40 dark:bg-amber-950/10">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileBarChart2 className="h-4 w-4 text-amber-500" />
                                Annual Demand Schedule
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Society Loan No: <span className="font-mono font-semibold">{loan.societyLoanNo || "—"}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-3 pb-2">
                            {!loan.annualDemands || Object.keys(loan.annualDemands).length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4 text-center">
                                    {loan.societyLoanNo
                                        ? "No demand data found for this loan record."
                                        : "Society Loan No. not available for this record."}
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {YEARS.map(yr => {
                                        const row = loan.annualDemands[yr]
                                        if (!row) return null
                                        const now = new Date().getFullYear()
                                        const isPast = yr < now
                                        const isCurrent = yr === now
                                        const demandPayments = loan.repaymentHistory?.filter((p: any) => p.remarks?.includes(`[${yr} Demand]`)) || []
                                        const paidTowardsDemand = demandPayments.reduce((sum: number, p: any) => sum + p.amountPaid, 0)
                                        const isFullyPaid = paidTowardsDemand >= row.grandTotal
                                        const isPartlyPaid = paidTowardsDemand > 0 && !isFullyPaid

                                        const remainingAmount = Math.max(0, row.grandTotal - paidTowardsDemand)

                                        return (
                                            <div key={yr} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg px-3 py-3 border text-sm ${isFullyPaid ? "bg-green-50/60 border-green-200 dark:bg-green-950/20" :
                                                isPartlyPaid ? "bg-blue-50/60 border-blue-200 dark:bg-blue-950/20" :
                                                    isPast ? "bg-red-50/60 border-red-200 dark:bg-red-950/20" :
                                                        isCurrent ? "bg-amber-50/60 border-amber-200 dark:bg-amber-950/20" :
                                                            "bg-slate-50/60 border-slate-200 dark:bg-slate-900/40"
                                                }`}>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isFullyPaid ? "bg-green-100 text-green-700 border-green-300" :
                                                        isPartlyPaid ? "bg-blue-100 text-blue-700 border-blue-300" : yearBadge(yr)
                                                        }`}>
                                                        {yr}
                                                        {isFullyPaid ? " (Fully Paid)" : isPartlyPaid ? " (Partly Paid)" : isCurrent ? " ←" : isPast ? " ↑" : ""}
                                                    </span>
                                                    {row.dueDate && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />{row.dueDate}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                                    <div className="text-right">
                                                        <span className={`font-bold text-sm ${isFullyPaid ? "line-through opacity-60" : ""}`}>
                                                            {fmtINR(row.grandTotal)}
                                                        </span>
                                                        {isPartlyPaid && (
                                                            <div className="text-[10px] text-muted-foreground uppercase mt-0.5 tracking-wider font-semibold">
                                                                Balance: {fmtINR(remainingAmount)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!isFullyPaid && row.grandTotal > 0 && !isPaidOff && (
                                                        <Button
                                                            size="sm"
                                                            variant={isPast ? "destructive" : isCurrent ? "default" : isPartlyPaid ? "outline" : "secondary"}
                                                            className="h-7 text-xs px-3"
                                                            onClick={() => {
                                                                setPayModalData({ year: yr, totalAmount: remainingAmount })
                                                                setPayAmount(remainingAmount.toString())
                                                                setPayModalOpen(true)
                                                            }}
                                                            disabled={submitting}
                                                        >
                                                            Pay Demand
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Log Payment</CardTitle>
                            <CardDescription>Record a new repayment for this loan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isPaidOff ? (
                                <div className="text-center p-4 bg-muted rounded-md text-sm">
                                    This loan is fully paid off. No further payments required.
                                </div>
                            ) : (
                                <PaymentForm onSubmit={handleLogPayment} isSubmitting={submitting} />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Repayment Ledger</CardTitle>
                            <CardDescription>History of all payments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loan.repaymentHistory && loan.repaymentHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {[...loan.repaymentHistory]
                                        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                                        .map((payment: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center pb-4 border-b last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-semibold text-sm">₹{payment.amountPaid.toLocaleString()}</p>
                                                    {payment.remarks && <p className="text-xs text-muted-foreground">{payment.remarks}</p>}
                                                </div>
                                                <p className="text-sm font-medium">{format(new Date(payment.paymentDate), "dd MMM yyyy")}</p>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-4">No payments recorded yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Partial Demand Payment Modal */}
            <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pay Demand for {payModalData?.year}</DialogTitle>
                        <DialogDescription>
                            Enter the exact amount the member is paying towards this demand.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {payModalData && (
                            <div className="flex justify-between items-center text-sm p-3 bg-muted rounded-md mb-2">
                                <span className="font-medium">Remaining Balance</span>
                                <span className="font-bold text-lg">{fmtINR(payModalData.totalAmount)}</span>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount Paid (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                placeholder="Enter amount..."
                                autoFocus
                            />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0">
                        <Button
                            variant="secondary"
                            onClick={() => setPayModalOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                const amount = Number(payAmount)
                                if (!amount || amount <= 0) return

                                setPayModalOpen(false)
                                handleLogPayment({
                                    paymentDate: new Date().toISOString().split('T')[0],
                                    amountPaid: amount,
                                    remarks: `[${payModalData?.year} Demand] Paid via schedule`
                                })
                            }}
                            disabled={submitting || !Number(payAmount) || Number(payAmount) <= 0}
                        >
                            {submitting ? "Processing..." : "Confirm Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
