"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { setupActions } from "@/lib/electron"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Lock, User, AlertCircle, School } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
    const router = useRouter()
    const { login, isLoading } = useAuth()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isVerifyingSystem, setIsVerifyingSystem] = useState(true)

    useEffect(() => {
        const checkSetup = async () => {
            try {
                console.log("[Login] Verifying system status...")
                const hasSetup = await setupActions.hasCompletedSetup()
                console.log("[Login] Setup status:", hasSetup)

                if (!hasSetup) {
                    console.log("[Login] Redirecting to setup wizard...")
                    router.push("/setup")
                    // Do NOT set isVerifyingSystem to false, we want to keep the loader visible until navigation
                    return
                }

                // Only if setup is complete do we show the login form
                setIsVerifyingSystem(false)
            } catch (err) {
                console.error("[Login] System verification error:", err)
                // If it fails, it's likely because the database is not yet ready.
                // Redirect to setup so the user can see what's wrong or initialize it.
                router.push("/setup")
            }
        }

        // Safety timeout for Electron-to-Next.js bridge
        const setupTimer = setTimeout(() => {
            if (isVerifyingSystem) {
                console.warn("[Login] Setup verification timed out");
                setIsVerifyingSystem(false) // Show login as fallback
            }
        }, 3000)

        checkSetup()
        return () => clearTimeout(setupTimer)
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (!username || !password) {
            setError("Please enter both username and password")
            return
        }
        try {
            await login(username, password)
        } catch (err: any) {
            if (err.message === "Invalid credentials") {
                setError("Invalid username or password")
            } else {
                setError("An unexpected error occurred. Please try again.")
            }
        }
    }

    if (isVerifyingSystem) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#014737] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="h-24 w-24 flex items-center justify-center overflow-hidden">
                        <img src="/logo.png" className="h-full w-full object-contain animate-pulse" alt="Logo" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
                        <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-[0.2em]">Initialising System</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950 relative overflow-hidden">
            {/* Background Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            <div className="w-full max-w-[360px] px-4 relative z-10">
                {/* Header with System Logo */}
                <div className="flex flex-col items-center space-y-5 mb-5">
                    <div className="h-32 w-32 flex items-center justify-center overflow-hidden">
                        <img
                            src="/logo.png"
                            alt="School Nexus Logo"
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                            School Nexus
                        </h1>
                    </div>
                </div>

                {/* Card */}
                <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-[2rem]">
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            <div className="flex flex-col">
                                <Label htmlFor="username" className="text-sm text-slate-600 font-bold ml-1 mb-2">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="username"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className={cn(
                                            "pl-12 h-12 bg-slate-50/50 rounded-xl border-slate-200 focus:bg-white transition-all text-sm font-medium",
                                            error && "border-red-200 focus:ring-red-100"
                                        )}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between ml-1 mb-2">
                                    <Label htmlFor="password" className="text-sm text-slate-600 font-bold">Password</Label>
                                    <a href="#" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 uppercase tracking-wider">
                                        Forgot?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={cn(
                                            "pl-12 h-12 bg-slate-50/50 rounded-xl border-slate-200 focus:bg-white transition-all text-sm font-medium",
                                            error && "border-red-200 focus:ring-red-100"
                                        )}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] rounded-xl text-sm uppercase tracking-widest"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-[10px] font-bold text-emerald-200/40 mt-8 uppercase tracking-[0.3em]">
                    &copy; 2024 School Nexus
                </p>
            </div>
        </div>
    )
}


