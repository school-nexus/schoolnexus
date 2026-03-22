"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { School, ArrowRight, Loader2, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

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
                setError("Institution not found. Please verify the identifier.")
            }
        } catch (err) {
            setError("Connectivity error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/50 via-white to-white -z-20" />
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-100/20 rounded-full blur-[120px] -z-10" />

            <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Back to Home */}
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-bold transition-colors group mb-4">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Landing Page
                </Link>

                <div className="glass rounded-[2.5rem] border-white/40 shadow-2xl shadow-emerald-500/5 overflow-hidden">
                    <div className="bg-slate-950 p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 relative z-10">
                            <School className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-3">School Portal</h1>
                        <p className="text-slate-400 font-medium text-lg">Enter your institution credentials</p>
                    </div>

                    <div className="p-12 bg-white/50 backdrop-blur-xl space-y-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Institutional Identifier</label>
                                <div className="relative group">
                                    <Input 
                                        placeholder="e.g. green-valley-high" 
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                        className="h-16 border-slate-200 bg-white/50 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500 font-bold px-6 text-lg transition-all shadow-sm group-hover:shadow-md"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        <Sparkles className="w-5 h-5 text-emerald-100 group-hover:text-emerald-300 transition-colors" />
                                    </div>
                                </div>
                                {error && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-shake">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-600" /> {error}
                                    </div>
                                )}
                            </div>

                            <Button 
                                disabled={loading || !slug}
                                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Access Dashboard <ArrowRight className="w-6 h-6" /></>}
                            </Button>
                        </form>

                        <div className="flex flex-col items-center gap-6 pt-4">
                            <div className="w-full h-px bg-slate-100 relative">
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">or</span>
                            </div>
                            <Link href="/login" className="text-slate-400 text-sm font-bold hover:text-slate-900 transition-colors uppercase tracking-widest flex items-center gap-2">
                                Platform Administrator Login <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Institutional Single-Sign-On Powered by SchoolNexus</p>
                </div>
            </div>
        </div>
    )
}
