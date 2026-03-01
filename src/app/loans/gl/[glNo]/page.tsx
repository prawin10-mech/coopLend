"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ArrowLeft, Layers, IndianRupee, CreditCard, TrendingDown, User, Phone, MapPin, Calendar } from "lucide-react"
import Link from "next/link"

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
const fmtDate = (d: string) => { try { return format(new Date(d), "dd-MMM-yyyy") } catch { return "—" } }

export default function GLGroupPage() {
    const params = useParams()
    const router = useRouter()
    const glNo = decodeURIComponent(params.glNo as string)

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!glNo) return
        fetch(`/api/loans/gl/${encodeURIComponent(glNo)}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(setData)
            .catch(() => router.push("/loans"))
            .finally(() => setLoading(false))
    }, [glNo])

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">Loading GL group…</div>
    )
    if (!data) return null

    const { loans, summary } = data
    const member = loans[0] // All loans under same GL belong to same member

    return (
        <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 flex-wrap">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/loans"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-3xl font-bold tracking-tight text-primary">GL #{glNo}</h2>
                        <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full border border-primary/20">
                            {summary.totalLoans} Loan{summary.totalLoans > 1 ? "s" : ""}
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">All loan accounts under this General Ledger number</p>
                </div>
            </div>

            {/* Member Info Card */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <User className="h-5 w-5 text-primary" />
                        {member.memberName}
                    </CardTitle>
                    <CardDescription className="text-sm space-y-0.5 pt-1">
                        <span className="font-mono text-xs">{member.admissionNumber && `Admission: ${member.admissionNumber}`}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                        {member.fatherSpouseName && (
                            <div><p className="text-muted-foreground text-xs font-medium">Father/Spouse</p><p className="font-semibold">{member.fatherSpouseName}</p></div>
                        )}
                        {member.village && (
                            <div className="flex gap-1.5 items-start">
                                <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                <div><p className="text-muted-foreground text-xs font-medium">Village</p><p className="font-semibold">{member.village}</p></div>
                            </div>
                        )}
                        {member.contactNumber && (
                            <div className="flex gap-1.5 items-start">
                                <Phone className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                <div><p className="text-muted-foreground text-xs font-medium">Contact</p><p className="font-semibold">{member.contactNumber}</p></div>
                            </div>
                        )}
                        {member.gender && <div><p className="text-muted-foreground text-xs font-medium">Gender</p><p className="font-semibold">{member.gender}</p></div>}
                        {member.age > 0 && <div><p className="text-muted-foreground text-xs font-medium">Age</p><p className="font-semibold">{member.age}</p></div>}
                        {member.casteCategory && <div><p className="text-muted-foreground text-xs font-medium">Caste</p><p className="font-semibold">{member.casteCategory}</p></div>}
                        {member.aadhaarCardNo && <div><p className="text-muted-foreground text-xs font-medium">Aadhaar</p><p className="font-semibold font-mono">{member.aadhaarCardNo}</p></div>}
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Loans", value: summary.totalLoans, icon: Layers, color: "text-blue-600" },
                    { label: "Total Principal", value: fmt(summary.totalPrincipal), icon: IndianRupee, color: "text-green-600" },
                    { label: "Total Repaid", value: fmt(summary.totalRepaid), icon: CreditCard, color: "text-emerald-600" },
                    { label: "Total Outstanding", value: fmt(summary.totalOutstanding), icon: TrendingDown, color: "text-red-500" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="border shadow-sm">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                                    <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                                </div>
                                <Icon className={`h-5 w-5 mt-0.5 ${color} opacity-70`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Individual Loan Cards */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" /> Loan Accounts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {loans.map((loan: any, i: number) => {
                        const repaid = (loan.repaymentHistory || []).reduce((s: number, p: any) => s + (p.amountPaid || 0), 0)
                        const outstanding = (loan.totalPrincipalAmount || 0) - repaid
                        return (
                            <Card key={loan._id} className="border shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 border-b bg-muted/10">
                                    <CardTitle className="text-sm flex justify-between items-center">
                                        <span className="text-muted-foreground font-medium">Loan {i + 1}</span>
                                        <span className="font-mono text-xs bg-background border px-2 py-0.5 rounded">{loan.societyLoanNo || loan.loanNumber}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-3 pb-4 space-y-2 text-sm">
                                    {[
                                        ["Scheme", loan.scheme],
                                        ["Loan Number", loan.loanNumber],
                                        ["Ledger Folio", loan.ledgerFolioNumber],
                                        ["Purpose", loan.purposeDescription],
                                        ["ROI", loan.roi ? `${loan.roi}%` : null],
                                        ["Penal ROI", loan.penalRoi ? `${loan.penalRoi}%` : null],
                                        ["Disbursal Date", loan.disbursalDate ? fmtDate(loan.disbursalDate) : null],
                                        ["Due Date", loan.dueDate ? fmtDate(loan.dueDate) : null],
                                    ].filter(([, v]) => v).map(([label, value]) => (
                                        <div key={label as string} className="flex justify-between items-baseline gap-2 border-b border-border/30 last:border-0 pb-1">
                                            <span className="text-muted-foreground text-xs shrink-0 w-28">{label}</span>
                                            <span className="text-xs font-mono text-right">{value as string}</span>
                                        </div>
                                    ))}
                                    <div className="pt-2 flex justify-between rounded-lg bg-muted/30 px-3 py-2 mt-2">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Principal</p>
                                            <p className="font-bold text-sm text-green-600">{fmt(loan.totalPrincipalAmount || 0)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Repaid</p>
                                            <p className="font-bold text-sm text-emerald-600">{fmt(repaid)}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Outstanding</p>
                                            <p className="font-bold text-sm text-red-500">{fmt(outstanding)}</p>
                                        </div>
                                    </div>
                                    {loan.repaymentHistory?.length > 0 && (
                                        <div className="pt-2">
                                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Repayment History</p>
                                            <div className="space-y-1 max-h-28 overflow-y-auto">
                                                {loan.repaymentHistory.map((p: any, j: number) => (
                                                    <div key={j} className="flex justify-between text-xs bg-background border rounded px-2 py-1">
                                                        <span className="text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />{fmtDate(p.paymentDate)}
                                                        </span>
                                                        <span className="font-semibold text-emerald-600">{fmt(p.amountPaid)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="px-4 pb-3 flex justify-end">
                                    <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                                        <Link href={`/loans/${loan._id}`}>Full Profile →</Link>
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
