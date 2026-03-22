"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { GraduationCap, Loader2, Lock, User } from 'lucide-react';
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { schoolProfileActions, fileActions } from "@/lib/electron"

interface LoginClientProps {
    schoolSlug?: string;
    isPlatform?: boolean;
}

export function LoginClient({ schoolSlug, isPlatform }: LoginClientProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [logoSrc, setLogoSrc] = useState<string | null>(null)
    const [schoolName, setSchoolName] = useState("School Nexus")
    const router = useRouter()
    const { login } = useAuth()

    useEffect(() => {
        // Fetch school profile for logo and name
        schoolProfileActions.get().then((profile: any) => {
            if (profile) {
                if (profile.logo) {
                    setLogoSrc(fileActions.getUrl(profile.logo))
                }
                if (profile.name) {
                    setSchoolName(profile.name)
                }
            }
        }).catch(() => { })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const redirectPath = isPlatform ? "/super-admin" : `/${schoolSlug}/dashboard`;
            await login(username, password, redirectPath)
        } catch (error) {
            // Error is handled in AuthContext
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            <div className="w-full max-w-[360px] px-4 relative z-10">
                <div className="flex flex-col items-center space-y-5 mb-5">
                    <div className="h-32 w-32 flex items-center justify-center overflow-hidden">
                        {logoSrc ? (
                            <img src={logoSrc} alt={`${schoolName} Logo`} className="h-full w-full object-contain" />
                        ) : (
                            <img src="/logo.png" alt="System Logo" className="h-full w-full object-contain" />
                        )}
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                            {schoolName}
                        </h1>
                        {isPlatform && <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Platform Admin</p>}
                    </div>
                </div>

                <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                    <CardHeader className="p-0"></CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
                            <div className="flex flex-col">
                                <Label htmlFor="username" className="text-sm text-slate-600 font-medium ml-1 mb-4">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="username"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-10 h-10 bg-slate-50/50 rounded-lg border-slate-200 focus:bg-white transition-all text-sm"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between ml-1 mb-4">
                                    <Label htmlFor="password" className="text-sm text-slate-600 font-medium">Password</Label>
                                    <a href="#" className="text-[10px] font-medium text-emerald-600 hover:text-emerald-500">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-10 bg-slate-50/50 rounded-lg border-slate-200 focus:bg-white transition-all text-sm"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] rounded-lg text-sm"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-emerald-200/60 mt-8">
                    &copy; {new Date().getFullYear()} {schoolName}
                </p>
            </div>
        </div>
    )
}
