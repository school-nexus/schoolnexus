"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SetupWizard, SetupWizardData } from "@/components/setup-wizard"
import { setupActions, userActions, academicYearActions, termActions, schoolProfileActions } from "@/lib/electron"
import { Loader2 } from "lucide-react"

export default function AdminSetupPage() {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)
    const [needsSetup, setNeedsSetup] = useState(false)
    const [debugInfo, setDebugInfo] = useState<any>(null)

    useEffect(() => {
        const checkSetupStatus = async () => {
            console.log("[AdminSetup] Dedicated Platform Mode Active")
            
            try {
                // 1. Sync System Verification
                console.log("[AdminSetup] Checking system status...")
                const hasSetup = await setupActions.hasCompletedSetup()
                console.log("[AdminSetup] Status:", hasSetup)

                if (!hasSetup) {
                    setNeedsSetup(true)
                    setIsChecking(false)
                } else {
                    console.log("[AdminSetup] Already configured, redirecting to platform dashboard")
                    router.push("/super-admin")
                }
            } catch (error: any) {
                console.error("[AdminSetup] Status verification failed:", error)
                // Even on error, this is the ADMIN setup route
                setNeedsSetup(true)
                setIsChecking(false)
                
                if (error.debug) {
                    setDebugInfo(error.debug)
                }
            }
        }

        const timer = setTimeout(() => {
            checkSetupStatus()
        }, 100)

        return () => clearTimeout(timer)
    }, [router])

    const handleSetupComplete = async (data: SetupWizardData, isInitialized?: boolean) => {
        try {
            console.log("[AdminSetup] Persisting platform configuration...")

            // 0. Initialize fresh database (creates fresh file) only if NOT already done
            if (!isInitialized) {
                console.log("[AdminSetup] Running explicit database initialization...")
                const dbResult = await setupActions.initializeDatabase() as any
                console.log("[AdminSetup] Database initialization result:", dbResult)
                if (!dbResult?.success) {
                    throw new Error("Database initialization failed: " + (dbResult?.message || "Unknown error"))
                }
            }

            // 1. Create Super Admin User (Specialized for Platform)
            console.log("[AdminSetup] Creating super admin user...")
            await userActions.create({
                fullName: data.adminInfo.fullName,
                username: data.adminInfo.username,
                email: data.adminInfo.email,
                password: data.adminInfo.password,
                role: 'super_admin',
                isActive: true
            })
            console.log("[AdminSetup] Super admin created")

            // 2. Mark platform setup as completed
            console.log("[AdminSetup] Marking platform setup as completed...")
            await setupActions.markSetupCompleted()
            
            // 3. Verify
            const isSetupCompleted = await setupActions.hasCompletedSetup()
            if (!isSetupCompleted) {
                throw new Error("Failed to verify setup completion status")
            }

            console.log("[AdminSetup] Initialization successful. Redirecting to dashboard...")
            await new Promise(resolve => setTimeout(resolve, 1000))
            router.push("/super-admin")
        } catch (error) {
            console.error("[AdminSetup] Configuration failed:", error)
            alert("Setup failed: " + (error instanceof Error ? error.message : "Unknown error"))
            throw error
        }
    }

    if (isChecking) {
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
                        <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-[0.2em]">Platform Initialization</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!needsSetup) return null

    return (
        <div className="relative h-full w-full">
            <SetupWizard onComplete={handleSetupComplete} isPlatform={true} />
            
            {/* Infrastructure Debug Panel */}
            {debugInfo && (
                <div className="fixed bottom-4 left-4 z-50 p-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl max-w-sm">
                    <p className="text-[10px] font-bold text-red-400 uppercase mb-2">Platform Infrastructure Status</p>
                    <p className="text-[11px] text-white/70 mb-2">Available Bindings: { (debugInfo.envKeys || []).join(', ') || 'None' }</p>
                    <p className="text-[10px] text-white/40 leading-relaxed italic">
                        If 'DB' is missing, please ensure the D1 Database is linked to the project in Cloudflare Dashboard.
                    </p>
                </div>
            )}
        </div>
    )
}
