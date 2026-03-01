"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const paymentFormSchema = z.object({
    paymentDate: z.string().min(1, "Payment Date is required"),
    amountPaid: z.coerce.number().min(1, "Amount must be greater than 0"),
    remarks: z.string().optional(),
})

export function PaymentForm({
    onSubmit,
    isSubmitting
}: {
    onSubmit: (data: z.infer<typeof paymentFormSchema>) => void
    isSubmitting: boolean
}) {
    const form = useForm<z.infer<typeof paymentFormSchema>>({
        resolver: zodResolver(paymentFormSchema) as any,
        defaultValues: {
            paymentDate: new Date().toISOString().split("T")[0],
            amountPaid: 0,
            remarks: "",
        },
    })

    const handleSubmit = (values: z.infer<typeof paymentFormSchema>) => {
        onSubmit(values)
        form.reset({
            paymentDate: new Date().toISOString().split("T")[0],
            amountPaid: 0,
            remarks: "",
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="flex gap-4 items-start">
                    <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Date</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="amountPaid"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Amount (₹)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks (Optional)</FormLabel>
                            <FormControl><Input placeholder="E.g., Cash, Bank Transfer..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Logging Payment..." : "Log Payment"}
                </Button>
            </form>
        </Form>
    )
}
