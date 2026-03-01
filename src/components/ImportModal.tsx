'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ImportResult {
    inserted: number;
    skipped: number;
    errors: string[];
    message: string;
}

interface ImportModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    function resetState() {
        setFile(null);
        setResult(null);
        setError('');
        setLoading(false);
    }

    function handleClose() {
        resetState();
        onClose();
    }

    function validateFile(f: File) {
        const ext = f.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
            setError('Only .xlsx, .xls, and .csv files are supported');
            return false;
        }
        setError('');
        return true;
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f && validateFile(f)) setFile(f);
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && validateFile(f)) setFile(f);
    }, []);

    async function handleUpload() {
        if (!file) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/loans/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Upload failed');
            } else {
                setResult(data);
                if (data.inserted > 0) onSuccess();
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                            <FileSpreadsheet className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Import Loan Records</h2>
                            <p className="text-xs text-muted-foreground">Upload an .xlsx, .xls, or .csv file</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Drop zone */}
                    {!result && (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
                                cursor-pointer transition-all py-10 px-6 text-center
                                ${dragging
                                    ? 'border-primary bg-primary/10 scale-[1.01]'
                                    : file
                                        ? 'border-primary/50 bg-primary/5'
                                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {file ? (
                                <>
                                    <FileSpreadsheet className="w-10 h-10 text-primary" />
                                    <div>
                                        <p className="font-medium text-foreground text-sm">{file.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {(file.size / 1024).toFixed(1)} KB · Click to change
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-10 h-10 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium text-foreground text-sm">
                                            Drag &amp; drop your file here
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            or <span className="text-primary">click to browse</span>
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground/70">
                                        Supports .xlsx, .xls, .csv
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-3">
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${result.inserted > 0 ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-amber-500/10 border-amber-500/30 text-amber-600'}`}>
                                <CheckCircle2 className="w-5 h-5 shrink-0" />
                                <span className="font-medium text-sm">{result.message}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                                    <p className="text-2xl font-bold text-green-600">{result.inserted}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Records Imported</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                                    <p className="text-2xl font-bold text-amber-500">{result.skipped}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Rows Skipped</p>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="rounded-lg border border-border bg-muted/30 p-3 max-h-28 overflow-y-auto">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Skipped row details:</p>
                                    {result.errors.slice(0, 10).map((e, i) => (
                                        <p key={i} className="text-xs text-muted-foreground/80">{e}</p>
                                    ))}
                                    {result.errors.length > 10 && (
                                        <p className="text-xs text-muted-foreground/60 mt-1">…and {result.errors.length - 10} more</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        {result ? (
                            <button
                                onClick={handleClose}
                                className="flex-1 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:bg-primary/90 transition"
                            >
                                Done
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 rounded-lg border border-border bg-background text-foreground font-medium py-2.5 text-sm hover:bg-muted transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {loading ? 'Importing…' : 'Import Records'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
