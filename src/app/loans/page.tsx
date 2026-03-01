"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/DataTable"
import { getColumns } from "@/components/columns"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { LoanFormModal } from "@/components/LoanFormModal"
import { ImportModal } from "@/components/ImportModal"

export default function LoansPage() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLoan, setEditingLoan] = useState<any>(null)
    const [isImportOpen, setIsImportOpen] = useState(false)

    const fetchLoans = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/loans")
            const json = await res.json()
            setData(json)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLoans()
    }, [])

    const handleCreateNew = () => {
        setEditingLoan(null)
        setIsModalOpen(true)
    }

    const handleEdit = (loan: any) => {
        setEditingLoan(loan)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this loan?")) {
            try {
                await fetch(`/api/loans/${id}`, { method: "DELETE" })
                fetchLoans()
            } catch (error) {
                console.error(error)
            }
        }
    }

    const handleModalSubmit = async (formData: any) => {
        try {
            if (editingLoan) {
                await fetch(`/api/loans/${editingLoan._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                })
            } else {
                await fetch("/api/loans", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                })
            }
            setIsModalOpen(false)
            setEditingLoan(null)
            fetchLoans()
        } catch (error) {
            console.error(error)
        }
    }

    const columns = getColumns(handleEdit, handleDelete)

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Loan Records</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Manage society members and their active loan timelines.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsImportOpen(true)}
                        className="font-medium px-4 border-primary/40 text-primary hover:bg-primary/10"
                    >
                        <Upload className="mr-2 h-4 w-4" /> Import from File
                    </Button>
                    <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4">
                        <Plus className="mr-2 h-4 w-4" /> Create New Loan
                    </Button>
                </div>
            </div>

            {loading ? (
                <div>Loading data...</div>
            ) : (
                <DataTable columns={columns} data={data} />
            )}

            <LoanFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={editingLoan}
            />

            <ImportModal
                open={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={fetchLoans}
            />
        </div>
    )
}
