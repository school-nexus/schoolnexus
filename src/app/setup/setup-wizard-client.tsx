"use client"

import { SetupWizard, SetupWizardData } from "@/components/setup-wizard"
import { setupActions, userActions, academicYearActions, termActions, schoolProfileActions } from "@/lib/electron"
import { useRouter } from "next/navigation"

interface SetupWizardClientProps {
    isPlatform: boolean;
    schoolSlug: string;
}

export function SetupWizardClient({ isPlatform, schoolSlug }: SetupWizardClientProps) {
    const router = useRouter()

    const handleSetupComplete = async (data: SetupWizardData, isInitialized?: boolean) => {
        try {
            console.log(`[Setup] Persisting ${isPlatform ? 'PLATFORM' : 'SCHOOL'} configuration...`)

            // 0. Initialize fresh database ONLY for Platform Setup if not done
            if (isPlatform && !isInitialized) {
                console.log("[Setup] Running platform database initialization...")
                const dbResult = await setupActions.initializeDatabase() as any
                if (!dbResult?.success) {
                    throw new Error("Platform initialization failed: " + (dbResult?.message || "Unknown error"))
                }
            }

            if (isPlatform) {
                // PLATFORM INITIALIZATION (Super Admin)
                console.log("[Setup] Creating super admin account...")
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
                console.log("[Setup] Configuring academic year for school...")
                const year = await academicYearActions.update({
                    name: data.academicYear.name,
                    startDate: data.academicYear.startDate,
                    endDate: data.academicYear.endDate,
                    isActive: true,
                    status: 'Active'
                })

                if (year?.id) {
                    console.log("[Setup] Configuring terms...")
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

                console.log("[Setup] Saving school profile details...")
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

                console.log("[Setup] Creating school administrator...")
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
            console.log("[Setup] Marking setup process as finalized...")
            await setupActions.markSetupCompleted()
            
            // Short delay to ensure persistence propagation
            await new Promise(resolve => setTimeout(resolve, 1500))

            console.log("[Setup] Success! Redirecting to dashboard...")
            router.push(isPlatform ? "/super-admin" : `/${schoolSlug}`)
            router.refresh()
        } catch (error) {
            console.error("[Setup] Configuration failed:", error)
            alert("Setup failed: " + (error instanceof Error ? error.message : "Unknown error"))
            throw error
        }
    }

    return <SetupWizard onComplete={handleSetupComplete} isPlatform={isPlatform} />
}
