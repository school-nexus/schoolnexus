"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, ArrowRight } from "lucide-react"

export default function SchoolLoginPage() {
    const router = useRouter()
    const [slug, setSlug] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (slug.trim()) {
            const sanitizedSlug = slug.trim().toLowerCase()
            router.push(`/${sanitizedSlug}/login`)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Find Your School</h1>
                    <p className="text-slate-500 font-medium mt-2 text-sm">
                        Enter your school's unique domain or identifier to access your specific portal.
                    </p>
                </div>

                <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="school-slug" className="text-slate-700 font-bold ml-1">School Slug / Domain</Label>
                                <Input
                                    id="school-slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="e.g. demo-high-school"
                                    className="h-14 bg-white border-slate-200 rounded-xl text-lg px-4 transition-all focus:border-emerald-500 focus:ring-emerald-500/20"
                                    autoFocus
                                    required
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                            >
                                Continue <ArrowRight className="w-5 h-5" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center mt-8 text-sm text-slate-500 font-medium">
                    Don't know your school's identifier? <br />
                    Contact your school administrator.
                </p>
                
                <div className="mt-8 text-center">
                    <Button 
                        variant="ghost" 
                        onClick={() => router.push('/')}
                        className="text-slate-500 hover:text-slate-900 font-bold tracking-tight"
                    >
                        Back to Home
                    </Button>
                </div>
            </div>
        </div>
    )
}
