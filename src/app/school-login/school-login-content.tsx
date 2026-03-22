"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { School, ArrowRight, Loader2 } from "lucide-react"

export default function SchoolLoginPageContent() {
    const [slug, setSlug] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug) return
        
        setLoading(true)
        setError("")
        
        try {
            // Check if school exists via RPC
            const response = await fetch('/api/rpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: 'get-school-by-slug',
                    args: [slug]
                })
            });
            
            const school = await response.json();
            
            if (school) {
                router.push(`/${slug}/login`)
            } else {
                setError("School not found. Please check the slug.")
            }
        } catch (err) {
            setError("Connection error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-emerald-950 text-white p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <School className="w-8 h-8 text-emerald-400" />
                    </div>
                    <CardTitle className="text-2xl font-black">School Portal</CardTitle>
                    <CardDescription className="text-emerald-200/60 font-medium">Enter your school's unique identifier to continue.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">School Slug</label>
                            <Input 
                                placeholder="e.g. green-valley-high" 
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="h-12 border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                            />
                            {error && <p className="text-red-500 text-xs font-bold ml-1">{error}</p>}
                        </div>
                        <Button 
                            disabled={loading || !slug}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Login <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                        </Button>
                    </form>
                    <div className="mt-8 text-center">
                        <button onClick={() => router.push('/login')} className="text-slate-400 text-sm font-bold hover:text-emerald-600 transition-colors">
                            Admin Platform Access
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
