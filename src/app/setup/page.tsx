"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SetupWizard, SetupWizardData } from "@/components/setup-wizard"
import { setupActions, userActions, academicYearActions, termActions, schoolProfileActions } from "@/lib/electron"
import { Loader2 } from "lucide-react"

export default function SetupPage() {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)
    const [needsSetup, setNeedsSetup] = useState(false)
    const [isPlatform, setIsPlatform] = useState(false)

    const [debugInfo, setDebugInfo] = useState<any>(null)
    const [schoolSlug, setSchoolSlug] = useState<string>("")

    useEffect(() => {
        const checkSetupStatus = async () => {
            // 1. URL-Based Mode Detection
            const pathParts = window.location.pathname.split('/');
            // /setup -> parts=["", "setup"]
            // /demo/setup -> parts=["", "demo", "setup"]
            const isPlatformMode = pathParts.length === 2 && pathParts[1] === 'setup';
            const detectedSlug = isPlatformMode ? '' : pathParts[1];
            
            setIsPlatform(isPlatformMode)
            setSchoolSlug(detectedSlug)

            console.log(`[Setup] Mode: ${isPlatformMode ? 'PLATFORM' : 'SCHOOL'}, Slug: ${detectedSlug}`);

            try {
                // 2. Async System Verification
                console.log("[Setup] Checking setup status...")
                const hasSetup = await setupActions.hasCompletedSetup()
                console.log("[Setup] Status:", hasSetup)

                if (!hasSetup) {
                    setNeedsSetup(true)
                    setIsChecking(false)
                } else {
                    console.log("[Setup] Already configured, redirecting...")
                    router.push(isPlatformMode ? "/super-admin" : `/${detectedSlug}`)
                }
            } catch (error: any) {
                console.error("[Setup] Status verification failed:", error)
                setNeedsSetup(true)
                setIsChecking(false)
                if (error.debug) setDebugInfo(error.debug)
            }
        }

        const timer = setTimeout(() => {
            checkSetupStatus()
        }, 100)

        return () => clearTimeout(timer)
    }, [router])

    const handleSetupComplete = async (data: SetupWizardData, isInitialized?: boolean) => {
        try {
            console.log(`[Setup] Persisting ${isPlatform ? 'PLATFORM' : 'SCHOOL'} configuration...`)

            // 0. Initialize fresh database only if NOT already done
            if (!isInitialized) {
                console.log("[Setup] Running explicit database initialization...")
                const dbResult = await setupActions.initializeDatabase() as any
                if (!dbResult?.success) {
                    throw new Error("Database initialization failed: " + (dbResult?.message || "Unknown error"))
                }
            }

            if (isPlatform) {
                // PLATFORM INITIALIZATION (Super Admin)
                console.log("[Setup] Creating super admin...")
                await userActions.create({
                    fullName: data.adminInfo.fullName,
                    username: data.adminInfo.username,
                    email: data.adminInfo.email,
                    password: data.adminInfo.password,
                    role: 'super_admin',
                    isActive: true
                })
            } else {
                // SCHOOL INITIALIZATION
                console.log("[Setup] Creating academic year...")
                const year = await academicYearActions.update({
                    name: data.academicYear.name,
                    startDate: data.academicYear.startDate,
                    endDate: data.academicYear.endDate,
                    isActive: true,
                    status: 'Active'
                })

                if (year?.id) {
                    console.log("[Setup] Creating terms...")
                    for (const term of data.academicYear.terms) {
                        await termActions.update({
                            academicYearId: year.id,
                            name: term.name,
                            startDate: term.startDate,
                            endDate: term.endDate,
                            isActive: term.isActive
                        })
                    }
                }

                console.log("[Setup] Saving school profile...")
                await schoolProfileActions.update({
                    name: data.schoolInfo.name,
                    phone: data.schoolInfo.phone,
                    email: data.schoolInfo.email,
                    address: data.schoolInfo.address,
                    logo: data.schoolInfo.logo,
                    motto: data.schoolInfo.motto,
                    currency: data.schoolInfo.currency,
                    website: data.schoolInfo.website,
                    registrationNumber: data.schoolInfo.registrationNumber
                })

                console.log("[Setup] Creating school admin user...")
                await userActions.create({
                    fullName: data.adminInfo.fullName,
                    username: data.adminInfo.username,
                    email: data.adminInfo.email,
                    password: data.adminInfo.password,
                    role: 'admin',
                    isActive: true
                })
            }

            // Common Completion Steps
            console.log("[Setup] Marking setup as completed...")
            await setupActions.markSetupCompleted()
            
            const isSetupCompleted = await setupActions.hasCompletedSetup()
            if (!isSetupCompleted) {
                throw new Error("Failed to verify setup completion status")
            }

            console.log("[Setup] Initialization successful. Redirecting...")
            await new Promise(resolve => setTimeout(resolve, 1000))
            router.push(isPlatform ? "/super-admin" : `/${schoolSlug}`)
        } catch (error) {
            console.error("[Setup] Configuration failed:", error)
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
                        <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-[0.2em]">Verifying Status</p>
                    </div>

                    {/* Temporary Debug Info for Production */}
                    {needsSetup && (window as any)._SN_DEBUG && (
                        <div className="mt-8 p-4 bg-black/40 backdrop-blur border border-white/10 rounded-2xl max-w-sm text-center">
                            <p className="text-[10px] font-bold text-red-400 uppercase mb-2">Debug Info (Infrastructure Error)</p>
                            <p className="text-xs text-white/60 mb-2">Available Bindings: {((window as any)._SN_DEBUG.envKeys || []).join(', ') || 'None'}</p>
                            <p className="text-[10px] text-white/40 leading-relaxed">
                                If 'DB' is missing above, please link your D1 database to the Pages project in the Cloudflare Dashboard.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (!needsSetup) return null

    return <SetupWizard onComplete={handleSetupComplete} isPlatform={isPlatform} />
}

