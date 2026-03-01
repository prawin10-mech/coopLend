"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, FileEdit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import Link from "next/link"

export const getColumns = (
    onEdit: (loan: any) => void,
    onDelete: (loanId: string) => void
): ColumnDef<any>[] => [
        {
            accessorKey: "admissionNumber",
            header: "Admission No",
        },
        {
            accessorKey: "loanNumber",
            header: "Loan #",
        },
        {
            accessorKey: "glNo",
            header: "GL No.",
            filterFn: "equals",
        },
        {
            accessorKey: "societyLoanNo",
            header: "Society Loan No.",
        },
        {
            accessorKey: "ledgerFolioNumber",
            header: "Ledger Folio No.",
        },
        {
            accessorKey: "memberName",
            header: "Member Name",
        },
        {
            accessorKey: "fatherSpouseName",
            header: "Father/Spouse Name",
        },
        {
            accessorKey: "contactNumber",
            header: "Contact Number",
        },
        {
            accessorKey: "gender",
            header: "Gender",
        },
        {
            accessorKey: "age",
            header: "Age",
        },
        {
            accessorKey: "casteCategory",
            header: "Caste",
        },
        {
            accessorKey: "village",
            header: "Village",
        },
        {
            accessorKey: "scheme",
            header: "Scheme",
        },
        {
            accessorKey: "aadhaarCardNo",
            header: "Aadhaar Card No.",
        },
        {
            accessorKey: "purposeDescription",
            header: "Purpose",
        },
        {
            accessorKey: "disbursalDate",
            header: "Disbursal Date",
            cell: ({ row }) => {
                const date = row.getValue("disbursalDate");
                if (!date) return "N/A";
                return format(new Date(date as string), "dd-MMM-yyyy")
            }
        },
        {
            accessorKey: "roi",
            header: "ROI",
        },
        {
            accessorKey: "penalRoi",
            header: "Penal ROI",
        },
        {
            accessorKey: "ioaRoi",
            header: "IOA ROI",
        },
        {
            accessorKey: "totalPrincipalAmount",
            header: "Principal",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("totalPrincipalAmount"))
                if (isNaN(amount)) return "N/A"
                return new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                }).format(amount)
            },
        },
        {
            accessorKey: "outstandingAmount",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Outstanding
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("outstandingAmount"))
                if (isNaN(amount)) return "N/A"
                return new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0
                }).format(amount)
            },
        },
        {
            accessorKey: "dueDate",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Due Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = row.getValue("dueDate");
                if (!date) return "N/A";
                try {
                    return format(new Date(date as string), "dd-MMM-yyyy")
                } catch (e) {
                    return "Invalid Date";
                }
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const loan = row.original
                const viewHref = loan.glNo
                    ? `/loans/gl/${encodeURIComponent(loan.glNo)}`
                    : `/loans/${loan._id}`
                return (
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" asChild title={loan.glNo ? `View all GL #${loan.glNo} records` : "View loan profile"}>
                            <Link href={viewHref}>
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(loan)}>
                            <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(loan._id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]
