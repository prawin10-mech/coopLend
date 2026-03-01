"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import { format } from "date-fns"

const loanFormSchema = z.object({
    admissionNumber: z.string().optional().or(z.literal('')),
    loanNumber: z.string().min(1, "Loan Number is required"),
    glNo: z.string().optional().or(z.literal('')),
    societyLoanNo: z.string().optional().or(z.literal('')),
    ledgerFolioNumber: z.string().optional().or(z.literal('')),
    memberName: z.string().min(1, "Member Name is required"),
    fatherSpouseName: z.string().optional().or(z.literal('')),
    contactNumber: z.string().regex(/^\d{10}$/, "Contact number must be exactly 10 digits").optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    age: z.coerce.number().optional().or(z.literal(0)),
    casteCategory: z.string().optional().or(z.literal('')),
    village: z.string().optional().or(z.literal('')),
    scheme: z.string().optional().or(z.literal('')),
    aadhaarCardNo: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits").optional().or(z.literal('')),
    purposeDescription: z.string().optional().or(z.literal('')),
    disbursalDate: z.string().optional().or(z.literal('')),
    roi: z.coerce.number().optional().or(z.literal(0)),
    penalRoi: z.coerce.number().optional().or(z.literal(0)),
    ioaRoi: z.coerce.number().optional().or(z.literal(0)),
    dueDate: z.string().optional().or(z.literal('')),
    totalPrincipalAmount: z.coerce.number().min(0, "Amount must be positive"),
})

export function LoanFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData
}: {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => void
    initialData?: any
}) {
    const form = useForm<z.infer<typeof loanFormSchema>>({
        resolver: zodResolver(loanFormSchema) as any,
        defaultValues: {
            admissionNumber: "",
            loanNumber: "",
            glNo: "",
            societyLoanNo: "",
            ledgerFolioNumber: "",
            memberName: "",
            fatherSpouseName: "",
            contactNumber: "",
            gender: "",
            age: 0,
            casteCategory: "",
            village: "",
            scheme: "",
            aadhaarCardNo: "",
            purposeDescription: "",
            disbursalDate: "",
            roi: 0,
            penalRoi: 0,
            ioaRoi: 0,
            dueDate: "",
            totalPrincipalAmount: 0,
        },
    })

    useEffect(() => {
        if (initialData && isOpen) {
            form.reset({
                admissionNumber: initialData.admissionNumber || "",
                loanNumber: initialData.loanNumber || "",
                glNo: initialData.glNo || "",
                societyLoanNo: initialData.societyLoanNo || "",
                ledgerFolioNumber: initialData.ledgerFolioNumber || "",
                memberName: initialData.memberName || "",
                fatherSpouseName: initialData.fatherSpouseName || "",
                contactNumber: initialData.contactNumber || "",
                gender: initialData.gender || "",
                age: initialData.age || 0,
                casteCategory: initialData.casteCategory || "",
                village: initialData.village || "",
                scheme: initialData.scheme || "",
                aadhaarCardNo: initialData.aadhaarCardNo || "",
                purposeDescription: initialData.purposeDescription || "",
                disbursalDate: initialData.disbursalDate ? format(new Date(initialData.disbursalDate), "yyyy-MM-dd") : "",
                roi: initialData.roi || 0,
                penalRoi: initialData.penalRoi || 0,
                ioaRoi: initialData.ioaRoi || 0,
                dueDate: initialData.dueDate ? format(new Date(initialData.dueDate), "yyyy-MM-dd") : "",
                totalPrincipalAmount: initialData.totalPrincipalAmount || 0,
            })
        } else if (!isOpen) {
            form.reset()
        }
    }, [initialData, isOpen, form])

    const handleSubmit = (values: z.infer<typeof loanFormSchema>) => {
        onSubmit(values)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#f8faf9] border-none shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-primary font-bold">
                        {initialData ? "Edit Loan Entry" : "New Loan Entry"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Enter borrower details and loan parameters.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">

                            {/* Row 1 */}
                            <FormField control={form.control} name="admissionNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Admission Number</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="loanNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Loan Number</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 2 */}
                            <FormField control={form.control} name="glNo" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">GL Number</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="societyLoanNo" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Society Loan No.</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 3 */}
                            <FormField control={form.control} name="ledgerFolioNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Ledger Folio No.</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="memberName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Member Name</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 4 */}
                            <FormField control={form.control} name="fatherSpouseName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Father/Spouse Name</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="contactNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Contact Number</FormLabel>
                                    <FormControl><Input placeholder="10 digits" className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 5 */}
                            <FormField control={form.control} name="gender" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Gender</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-primary/20 focus-visible:ring-primary/30">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="age" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Age</FormLabel>
                                    <FormControl><Input type="number" className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 6 */}
                            <FormField control={form.control} name="casteCategory" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Caste/Category</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="village" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Village</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 7 */}
                            <FormField control={form.control} name="scheme" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Scheme</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="aadhaarCardNo" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Aadhaar Number</FormLabel>
                                    <FormControl><Input placeholder="12 digits" className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 8 */}
                            <FormField control={form.control} name="purposeDescription" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Purpose</FormLabel>
                                    <FormControl><Input className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="disbursalDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Disbursal Date</FormLabel>
                                    <FormControl><Input type="date" className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 9 */}
                            <FormField control={form.control} name="roi" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">ROI (%)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="penalRoi" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Penal ROI (%)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 10 */}
                            <FormField control={form.control} name="ioaRoi" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">IOA ROI (%)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="dueDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Due Date</FormLabel>
                                    <FormControl><Input type="date" className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Row 11 */}
                            <FormField control={form.control} name="totalPrincipalAmount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground font-semibold">Total Principal Amount (₹)</FormLabel>
                                    <FormControl><Input type="number" className="bg-white border-primary/20 focus-visible:ring-primary/30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        </div>
                        <div className="flex justify-end pt-4 space-x-2">
                            <Button type="button" variant="outline" className="text-foreground" onClick={onClose}>Cancel</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">Save</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
