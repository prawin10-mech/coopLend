"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function GlSearch() {
    const [glNo, setGlNo] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!glNo.trim()) return

        setLoading(true)
        setError("")

        try {
            const res = await fetch(`/api/loans/gl/${encodeURIComponent(glNo.trim())}`)
            if (res.ok) {
                router.push(`/loans/gl/${encodeURIComponent(glNo.trim())}`)
            } else {
                setError("No record found")
                setLoading(false)
            }
        } catch {
            setError("An error occurred")
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search GL Number..."
                        className="pl-9 bg-card border-border shadow-sm h-10 transition-colors focus-visible:ring-primary/40"
                        value={glNo}
                        onChange={(e) => {
                            setGlNo(e.target.value)
                            setError("")
                        }}
                    />
                </div>
                <Button type="submit" className="h-10 px-4" disabled={!glNo.trim() || loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
            </form>
            {error && <p className="text-xs text-destructive font-medium px-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
        </div>
    )
}
