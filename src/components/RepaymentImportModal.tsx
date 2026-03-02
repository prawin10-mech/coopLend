"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

interface RepaymentImportModalProps {
    open: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function RepaymentImportModal({ open, onClose, onSuccess }: RepaymentImportModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
    const [result, setResult] = useState<any>(null)
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    function handleFile(file: File | null) {
        if (!file) return
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (!['xls', 'xlsx'].includes(ext ?? '')) {
            setResult({ error: 'Only .xls or .xlsx files are supported.' })
            setStatus("error")
            return
        }
        setSelectedFile(file)
        setStatus("idle")
        setResult(null)
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files[0])
    }

    async function handleUpload() {
        if (!selectedFile) return
        const fd = new FormData()
        fd.append('file', selectedFile)
        setStatus("uploading")
        try {
            const res = await fetch('/api/repayments/upload', { method: 'POST', body: fd })
            const json = await res.json()
            if (!res.ok) {
                setResult({ error: json.error || 'Upload failed' })
                setStatus("error")
            } else {
                setResult(json)
                setStatus("success")
                onSuccess?.()
            }
        } catch (err: any) {
            setResult({ error: err.message })
            setStatus("error")
        }
    }

    function handleClose() {
        setSelectedFile(null)
        setStatus("idle")
        setResult(null)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Import Repayments Data
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Upload your <strong>repayments.xls</strong> file. All 6 yearly sheets will be processed and matched to loans by GL&nbsp;No&nbsp;+&nbsp;Loan&nbsp;No.
                    </DialogDescription>
                </DialogHeader>

                {/* Drop zone */}
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors cursor-pointer
                        ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".xls,.xlsx"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    {selectedFile ? (
                        <div className="text-center">
                            <p className="font-semibold text-sm text-primary">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB — click to change</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="font-medium text-sm">Drop file here or click to browse</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Supports .xls and .xlsx</p>
                        </div>
                    )}
                </div>

                {/* Result */}
                {status === "success" && result && (
                    <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-green-700">{result.message}</p>
                            {result.skipped > 0 && <p className="text-xs text-green-600 mt-0.5">{result.skipped} rows skipped (headers/totals)</p>}
                        </div>
                    </div>
                )}
                {status === "error" && result?.error && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-red-700">{result.error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" onClick={handleClose} disabled={status === "uploading"}>Cancel</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || status === "uploading"}
                        className="min-w-[120px]"
                    >
                        {status === "uploading"
                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing…</>
                            : status === "success"
                                ? <><CheckCircle2 className="h-4 w-4 mr-2" />Done!</>
                                : <><Upload className="h-4 w-4 mr-2" />Import</>
                        }
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
