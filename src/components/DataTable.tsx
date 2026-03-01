"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { LayoutGrid, LayoutList, Download } from "lucide-react"
import { format } from "date-fns"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import XLSXStyle from "xlsx-js-style"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

const FILTER_COLS = [
    { id: "glNo", label: "GL No." },
    { id: "loanNumber", label: "Loan #" },
    { id: "admissionNumber", label: "Admission No" },
    { id: "memberName", label: "Member Name" },
    { id: "village", label: "Village" },
    { id: "scheme", label: "Scheme" },
    { id: "gender", label: "Gender" },
    { id: "contactNumber", label: "Contact No." },
    { id: "aadhaarCardNo", label: "Aadhaar No." },
    { id: "societyLoanNo", label: "Society Loan No." },
]

const COL_WIDTHS: Record<string, string> = {
    glNo: "w-20 min-w-[80px]",
    loanNumber: "w-44 min-w-[175px]",
    admissionNumber: "w-44 min-w-[175px]",
    memberName: "w-52 min-w-[200px]",
    fatherSpouseName: "w-40 min-w-[160px]",
    contactNumber: "w-32 min-w-[130px]",
    gender: "w-16 min-w-[64px]",
    age: "w-14 min-w-[56px]",
    casteCategory: "w-20 min-w-[80px]",
    village: "w-36 min-w-[140px]",
    scheme: "w-24 min-w-[90px]",
    aadhaarCardNo: "w-36 min-w-[140px]",
    societyLoanNo: "w-32 min-w-[128px]",
    ledgerFolioNumber: "w-28 min-w-[112px]",
    purposeDescription: "w-36 min-w-[140px]",
    disbursalDate: "w-28 min-w-[112px]",
    dueDate: "w-28 min-w-[112px]",
    roi: "w-16 min-w-[64px]",
    penalRoi: "w-20 min-w-[80px]",
    ioaRoi: "w-20 min-w-[80px]",
    totalPrincipalAmount: "w-32 min-w-[128px]",
    outstandingAmount: "w-32 min-w-[128px]",
    actions: "w-24 min-w-[96px] sticky right-0 z-20 bg-background/80 backdrop-blur-md shadow-[-4px_0_8px_rgba(0,0,0,0.05)] border-l",
}

function filtersFromParams(params: URLSearchParams): ColumnFiltersState {
    const filters: ColumnFiltersState = []
    FILTER_COLS.forEach(fc => {
        const v = params.get(`f_${fc.id}`)
        if (v) filters.push({ id: fc.id, value: v })
    })
    return filters
}

function exportToExcel(rows: any[], filename: string) {
    const exportCols = [
        "admissionNumber", "loanNumber", "glNo", "societyLoanNo", "ledgerFolioNumber",
        "memberName", "fatherSpouseName", "contactNumber", "gender", "age", "casteCategory",
        "village", "scheme", "aadhaarCardNo", "purposeDescription",
        "disbursalDate", "dueDate", "roi", "penalRoi", "ioaRoi",
        "totalPrincipalAmount", "outstandingAmount",
    ]
    const headerLabels: Record<string, string> = {
        admissionNumber: "Admission No", loanNumber: "Loan #", glNo: "GL No.",
        societyLoanNo: "Society Loan No.", ledgerFolioNumber: "Ledger Folio No.",
        memberName: "Member Name", fatherSpouseName: "Father/Spouse Name",
        contactNumber: "Contact Number", gender: "Gender", age: "Age",
        casteCategory: "Caste", village: "Village", scheme: "Scheme",
        aadhaarCardNo: "Aadhaar No.", purposeDescription: "Purpose",
        disbursalDate: "Disbursal Date", dueDate: "Due Date",
        roi: "ROI", penalRoi: "Penal ROI", ioaRoi: "IOA ROI",
        totalPrincipalAmount: "Principal (₹)", outstandingAmount: "Outstanding (₹)",
    }
    const headers = exportCols.map(c => headerLabels[c])
    // Row 0 = headers, rows 1+ = data
    const sheetData: any[][] = [headers]
    rows.forEach(r => {
        sheetData.push(exportCols.map(col => {
            let v = r[col]
            if ((col === "disbursalDate" || col === "dueDate") && v) {
                try { v = format(new Date(v), "dd-MMM-yyyy") } catch { /* keep raw */ }
            }
            return v ?? ""
        }))
    })
    const ws = XLSXStyle.utils.aoa_to_sheet(sheetData)
    // Bold + blue-tinted header row
    headers.forEach((_, ci) => {
        const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: ci })
        if (ws[cellRef]) {
            ws[cellRef].s = {
                font: { bold: true, color: { rgb: "1F3864" } },
                fill: { patternType: "solid", fgColor: { rgb: "D9E1F2" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: { bottom: { style: "medium", color: { rgb: "4472C4" } } },
            }
        }
    })
    ws["!cols"] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }))
    ws["!rows"] = [{ hpt: 20 }] // taller header row
    const wb = XLSXStyle.utils.book_new()
    XLSXStyle.utils.book_append_sheet(wb, ws, "Loans")
    XLSXStyle.writeFile(wb, `${filename}.xlsx`)
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        () => filtersFromParams(searchParams)
    )
    const [view, setView] = React.useState<"table" | "cards">(
        () => (searchParams.get("view") as "table" | "cards") ?? "table"
    )
    const [filtersExpanded, setFiltersExpanded] = React.useState(
        () => filtersFromParams(searchParams).length > 3
    )
    const [jumpPage, setJumpPage] = React.useState("")
    // Due date range filter (managed separately, also URL-persisted)
    const [dueDateFrom, setDueDateFrom] = React.useState(() => searchParams.get("ddf") ?? "")
    const [dueDateTo, setDueDateTo] = React.useState(() => searchParams.get("ddt") ?? "")

    // Pre-filter data by due date range before passing to table
    const filteredData = React.useMemo(() => {
        let d = data as any[]
        if (dueDateFrom) {
            const from = new Date(dueDateFrom)
            d = d.filter(r => r.dueDate && new Date(r.dueDate) >= from)
        }
        if (dueDateTo) {
            const to = new Date(dueDateTo)
            to.setHours(23, 59, 59)
            d = d.filter(r => r.dueDate && new Date(r.dueDate) <= to)
        }
        return d as TData[]
    }, [data, dueDateFrom, dueDateTo])

    // Sync filter state (including date range) to URL
    React.useEffect(() => {
        const params = new URLSearchParams()
        columnFilters.forEach(f => {
            if (f.value) params.set(`f_${f.id}`, String(f.value))
        })
        if (dueDateFrom) params.set("ddf", dueDateFrom)
        if (dueDateTo) params.set("ddt", dueDateTo)
        if (view !== "table") params.set("view", view)
        const qs = params.toString()
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columnFilters, view, dueDateFrom, dueDateTo])

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: { sorting, columnFilters },
        initialState: { pagination: { pageSize: view === "cards" ? 12 : 20 } },
    })

    const hasActiveFilters = columnFilters.length > 0 || !!dueDateFrom || !!dueDateTo

    const visibleFilters = filtersExpanded ? FILTER_COLS : FILTER_COLS.slice(0, 3)

    const handleExport = () => {
        if (hasActiveFilters) {
            // Export only the currently filtered rows (all pages)
            const rows = table.getFilteredRowModel().rows.map(r => r.original)
            exportToExcel(rows as any[], "loans_filtered")
        } else {
            // No filters — export everything
            exportToExcel(data as any[], "loans_all")
        }
    }

    const formatCell = (loan: any, colId: string) => {
        const v = loan[colId]
        if (v === undefined || v === null || v === "") return <span className="text-muted-foreground/50 italic text-xs">—</span>
        if (colId === "disbursalDate" || colId === "dueDate") {
            try { return format(new Date(v), "dd-MMM-yyyy") } catch { return v }
        }
        if (colId === "totalPrincipalAmount" || colId === "outstandingAmount") {
            const n = parseFloat(v)
            if (isNaN(n)) return v
            return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
        }
        return String(v)
    }

    const pagination = (() => {
        const pageCount = table.getPageCount() || 1
        const currentPage = table.getState().pagination.pageIndex
        const totalRecords = table.getFilteredRowModel().rows.length

        const windowSize = 5
        let startPage = Math.max(0, currentPage - Math.floor(windowSize / 2))
        const endPage = Math.min(pageCount - 1, startPage + windowSize - 1)
        startPage = Math.max(0, endPage - windowSize + 1)
        const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

        const handleJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                const pg = parseInt(jumpPage, 10)
                if (!isNaN(pg) && pg >= 1 && pg <= pageCount) table.setPageIndex(pg - 1)
                setJumpPage("")
            }
        }

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 border-t mt-2">
                <span className="text-xs text-muted-foreground">
                    {totalRecords} records · Page {currentPage + 1} of {pageCount}
                </span>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>«</Button>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</Button>
                    {startPage > 0 && <span className="text-muted-foreground text-sm px-1">…</span>}
                    {pageNumbers.map(p => (
                        <Button key={p} variant={p === currentPage ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => table.setPageIndex(p)}>{p + 1}</Button>
                    ))}
                    {endPage < pageCount - 1 && <span className="text-muted-foreground text-sm px-1">…</span>}
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</Button>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()}>»</Button>
                    <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-xs text-muted-foreground">Go to</span>
                        <Input className="h-8 w-14 text-center text-sm" placeholder="#" value={jumpPage} onChange={e => setJumpPage(e.target.value)} onKeyDown={handleJump} type="number" min={1} max={pageCount} />
                    </div>
                </div>
            </div>
        )
    })()

    return (
        <div className="space-y-4">
            {/* ── Filters & Controls ── */}
            <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Filters</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs" onClick={handleExport} title="Export data to Excel">
                            <Download className="h-3.5 w-3.5" />
                            {hasActiveFilters
                                ? `Export Filtered (${table.getFilteredRowModel().rows.length})`
                                : "Export All"}
                        </Button>
                        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
                        <Button variant="ghost" size="sm" onClick={() => setFiltersExpanded(p => !p)} className="text-xs">
                            {filtersExpanded ? "Show Less" : "More Filters ▾"}
                        </Button>
                        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
                        <span className="text-xs text-muted-foreground font-medium">View:</span>
                        <Button variant={view === "table" ? "default" : "outline"} size="sm" className="h-8 px-3 gap-1.5" onClick={() => setView("table")} title="Table View">
                            <LayoutList className="h-4 w-4" /> <span className="hidden sm:inline">Table</span>
                        </Button>
                        <Button variant={view === "cards" ? "default" : "outline"} size="sm" className="h-8 px-3 gap-1.5" onClick={() => setView("cards")} title="Card View">
                            <LayoutGrid className="h-4 w-4" /> <span className="hidden sm:inline">Cards</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleFilters.map(fc => {
                        const col = table.getColumn(fc.id)
                        if (!col) return null
                        return (
                            <div key={fc.id} className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-muted-foreground">{fc.label}</label>
                                <Input placeholder={`Filter by ${fc.label}...`} value={(col.getFilterValue() as string) ?? ""} onChange={e => col.setFilterValue(e.target.value)} className="h-8 text-sm bg-background" />
                            </div>
                        )
                    })}
                </div>

                {/* Due Date Range — only visible in expanded mode */}
                {filtersExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/40">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Due Date — From</label>
                            <Input type="date" value={dueDateFrom} onChange={e => setDueDateFrom(e.target.value)} className="h-8 text-sm bg-background" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Due Date — To</label>
                            <Input type="date" value={dueDateTo} onChange={e => setDueDateTo(e.target.value)} className="h-8 text-sm bg-background" />
                        </div>
                    </div>
                )}

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-600"
                        onClick={() => { setColumnFilters([]); setDueDateFrom(""); setDueDateTo("") }}>
                        ✕ Clear all filters
                    </Button>
                )}
            </div>

            {/* ── Record count summary ── */}
            {(() => {
                const total = data.length
                const filtered = table.getFilteredRowModel().rows.length
                return (
                    <div className="flex items-center gap-2 px-1">
                        {hasActiveFilters ? (
                            <>
                                <span className="text-sm font-semibold text-primary">{filtered.toLocaleString()}</span>
                                <span className="text-sm text-muted-foreground">of {total.toLocaleString()} records match</span>
                                <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Filtered</span>
                            </>
                        ) : (
                            <span className="text-sm text-muted-foreground">{total.toLocaleString()} records total</span>
                        )}
                    </div>
                )
            })()}

            {/* ── Table View ── */}
            {view === "table" && (
                <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
                    <Table className="text-sm border-collapse">
                        <TableHeader>
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id} className="bg-muted/50 border-b-2 border-border">
                                    {hg.headers.map(header => (
                                        <TableHead key={header.id} className={`whitespace-nowrap font-bold text-xs uppercase tracking-wide border-r border-border/50 last:border-r-0 px-3 py-3 ${COL_WIDTHS[header.id] ?? ""}`}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row, idx) => (
                                    <TableRow key={row.id} className={`border-b border-border/40 transition-colors hover:bg-primary/5 ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell key={cell.id} className={`whitespace-nowrap py-2.5 px-3 border-r border-border/30 last:border-r-0 ${COL_WIDTHS[cell.column.id] ?? ""}`}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">No records match your filters.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* ── Card View ── */}
            {view === "cards" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map(row => {
                            const loan = row.original as any
                            return (
                                <Card key={row.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow border-border/60">
                                    <CardHeader className="pb-3 border-b bg-muted/20 space-y-1">
                                        <CardTitle className="text-base flex items-start justify-between gap-2">
                                            <span className="text-primary font-bold leading-tight">{loan.memberName || "Unknown Member"}</span>
                                            <span className="text-xs shrink-0 font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">GL: {loan.glNo || "—"}</span>
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground font-mono">{loan.loanNumber}</p>
                                    </CardHeader>
                                    <CardContent className="pt-3 pb-2 text-sm space-y-1.5 flex-1">
                                        {[
                                            ["Village", "village"], ["Scheme", "scheme"], ["Contact", "contactNumber"],
                                            ["Admission No", "admissionNumber"], ["Society Loan No", "societyLoanNo"],
                                            ["Disbursal Date", "disbursalDate"], ["Due Date", "dueDate"],
                                            ["Outstanding", "totalPrincipalAmount"], ["ROI", "roi"],
                                            ["Penal ROI", "penalRoi"], ["Aadhaar", "aadhaarCardNo"], ["Purpose", "purposeDescription"],
                                        ].map(([label, key]) => (
                                            <div key={key} className="flex justify-between items-baseline gap-2 border-b border-border/30 pb-1 last:border-0">
                                                <span className="text-muted-foreground font-medium shrink-0 text-xs w-28">{label}</span>
                                                <span className="text-right text-xs font-mono text-foreground break-all">{formatCell(loan, key)}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                    <CardFooter className="p-3 bg-muted/20 border-t flex justify-end gap-2">
                                        {(() => {
                                            const actionsCell = row.getVisibleCells().find(c => c.column.id === "actions")
                                            if (!actionsCell?.column.columnDef.cell) return null
                                            return flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())
                                        })()}
                                    </CardFooter>
                                </Card>
                            )
                        })
                    ) : (
                        <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground border rounded-xl border-dashed">No records match your filters.</div>
                    )}
                </div>
            )}

            {pagination}
        </div>
    )
}
