"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentForm } from "@/components/PaymentForm"
import { format } from "date-fns"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function BorrowerProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { id } = params

    const [loan, setLoan] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

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
            // Append the new payment to the existing history
            const updatedHistory = [...(loan.repaymentHistory || []), {
                paymentDate: new Date(data.paymentDate).toISOString(),
                amountPaid: Number(data.amountPaid),
                remarks: data.remarks
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

    if (loading) return <div className="p-8">Loading borrower profile...</div>
    if (!loan) return <div className="p-8">Loan not found.</div>

    const totalRepaid = loan.repaymentHistory?.reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0
    const isPaidOff = loan.outstandingAmount <= 0

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/loans"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{loan.memberName}</h2>
                    <p className="text-muted-foreground">Loan Number: {loan.loanNumber}</p>
                </div>
                {isPaidOff && (
                    <div className="ml-auto flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        <span className="font-semibold text-sm">Fully Paid</span>
                    </div>
                )}
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
        </div>
    )
}
