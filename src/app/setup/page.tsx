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

    useEffect(() => {
        const checkSetupStatus = async () => {
            try {
                // Detect if we are on the platform root
                const hostname = window.location.hostname;
                const platformMode = 
                    hostname === 'localhost' || 
                    hostname === 'app.schoolnexus.com' || 
                    hostname.includes('pages.dev'); // Detect Cloudflare Pages
                setIsPlatform(platformMode);

                console.log("[Setup] Checking system status...")
                const hasSetup = await setupActions.hasCompletedSetup()
                console.log("[Setup] Status:", hasSetup)

                if (!hasSetup) {
                    setNeedsSetup(true)
                    setIsChecking(false)
                } else {
                    console.log("[Setup] Already configured, redirecting to login")
                    router.push("/")
                    // Keep isChecking true to prevent flashing while redirecting
                }
            } catch (error) {
                console.error("[Setup] Status verification failed:", error)
                setNeedsSetup(true)
                setIsChecking(false)
            }
        }

        const timer = setTimeout(() => {
            checkSetupStatus()
        }, 100)

        return () => clearTimeout(timer)
    }, [router])

    const handleSetupComplete = async (data: SetupWizardData, isInitialized?: boolean) => {
        try {
            console.log("[Setup] Persisting configuration...")

            // 0. Initialize fresh database (creates fresh file) only if NOT already done
            if (!isInitialized) {
                console.log("[Setup] Running explicit database initialization...")
                const dbResult = await setupActions.initializeDatabase() as any
                console.log("[Setup] Database initialization result:", dbResult)
                if (!dbResult?.success) {
                    throw new Error("Database initialization failed: " + (dbResult?.message || "Unknown error"))
                }
            } else {
                console.log("[Setup] Database already initialized manually, skipping wipe.")
            }

            // 1. Create Academic Year
            console.log("[Setup] Creating academic year...")
            const year = await academicYearActions.update({
                name: data.academicYear.name,
                startDate: data.academicYear.startDate,
                endDate: data.academicYear.endDate,
                isActive: true, // First one is always active
                status: 'Active'
            })
            console.log("[Setup] Academic year created:", year)

            // 2. Create Terms linked to Year
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
                console.log("[Setup] Terms created successfully")
            }

            // 3. Save School Profile
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
            console.log("[Setup] School profile saved")

            // 4. Create Admin User
            console.log("[Setup] Creating admin user...")
            await userActions.create({
                fullName: data.adminInfo.fullName,
                username: data.adminInfo.username,
                email: data.adminInfo.email,
                password: data.adminInfo.password,
                role: isPlatform ? 'super_admin' : 'admin',
                isActive: true
            })
            console.log("[Setup] Admin user created")


            // 5. Mark setup as completed
            console.log("[Setup] Marking setup as completed...")
            const setupResult = await setupActions.markSetupCompleted()
            console.log("[Setup] Setup completion result:", setupResult)
            
            // Verify that setup was actually marked as completed
            console.log("[Setup] Verifying setup completion status...")
            const isSetupCompleted = await setupActions.hasCompletedSetup()
            console.log("[Setup] Setup completion verification:", isSetupCompleted)
            
            if (!isSetupCompleted) {
                throw new Error("Failed to verify setup completion status")
            }

            console.log("[Setup] Initialization successful.")
            
            // Add a small delay to ensure everything is properly saved
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            console.log("[Setup] Redirecting to login page...")
            
            // Try multiple approaches to ensure navigation
            try {
                // First try Next.js router
                router.push("/")
                console.log("[Setup] Next.js router push completed")
            } catch (routerError) {
                console.error("[Setup] Next.js router failed:", routerError)
                // Fallback: try direct navigation
                try {
                    window.location.href = "/"
                } catch (locationError) {
                    console.error("[Setup] Direct navigation failed:", locationError)
                    // Last resort: show success message
                    alert("Setup completed successfully! Please close and reopen the application to continue.")
                }
            }
        } catch (error) {
            console.error("[Setup] Configuration failed:", error)
            // Show error to user
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
                </div>
            </div>
        )
    }

    if (!needsSetup) return null

    return <SetupWizard onComplete={handleSetupComplete} isPlatform={isPlatform} />
}

