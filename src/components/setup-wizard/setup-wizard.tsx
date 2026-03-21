"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    School,
    Calendar,
    User,
    Database,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Lightbulb,
    ChevronRight,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    SchoolInfoStep,
    AcademicYearStep,
    AdminAccountStep,
    DatabaseSetupStep,
    ConfirmationStep
} from "./steps"
import { setupActions } from "@/lib/electron"

export type SetupWizardData = {
    schoolInfo: {
        name: string
        phone: string
        email: string
        address: string
        logo?: string
        motto?: string
        currency?: string
        website?: string
        registrationNumber?: string
    }
    academicYear: {
        name: string
        startDate: string
        endDate: string
        terms: {
            name: string
            startDate: string
            endDate: string
            isActive: boolean
        }[]
    }
    adminInfo: {
        fullName: string
        username: string
        email: string
        password: string
        confirmPassword: string
    }
    database: {
        mode: "new" | "import"
        filePath?: string
    }
}

interface SetupWizardProps {
    onComplete: (data: SetupWizardData, isInitialized?: boolean) => Promise<void>
    isPlatform?: boolean
}

const schoolSteps = [
    { title: "School Information", icon: School, description: "Branding and contact details" },
    { title: "Academic Year", icon: Calendar, description: "Year and term configuration" },
    { title: "System User", icon: User, description: "Administrator account" },
    { title: "Database Setup", icon: Database, description: "Storage configuration" },
    { title: "Confirmation", icon: CheckCircle, description: "Review and launch" },
];

const platformSteps = [
    { title: "School Information", icon: School, description: "Branding and contact details" },
    { title: "Academic Year", icon: Calendar, description: "Year and term configuration" },
    { title: "System User", icon: User, description: "Administrator account" },
    { title: "Confirmation", icon: CheckCircle, description: "Review and launch" },
];

export function SetupWizard({ onComplete, isPlatform = false }: SetupWizardProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [formData, setFormData] = useState<SetupWizardData>({
        schoolInfo: {
            name: "",
            phone: "",
            email: "",
            address: "",
            motto: "",
            currency: "UGX",
            website: "",
            registrationNumber: "",
        },
        academicYear: {
            name: "",
            startDate: "",
            endDate: "",
            terms: [
                { name: "Term 1", startDate: "", endDate: "", isActive: true },
                { name: "Term 2", startDate: "", endDate: "", isActive: false },
                { name: "Term 3", startDate: "", endDate: "", isActive: false }
            ]
        },
        adminInfo: { fullName: "", username: "", email: "", password: "", confirmPassword: "" },
        database: { mode: "new" },
    })

    // Dynamically assign steps based on mode
    const steps = isPlatform ? platformSteps : schoolSteps;
    const currentStepData = steps[currentStep];

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isInitializing, setIsInitializing] = useState(false)
    const [isDbInitialized, setIsDbInitialized] = useState(false)

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

    const handleInitializeDatabase = async () => {
        setIsInitializing(true)
        try {
            const result = await setupActions.initializeDatabase() as any
            if (result.success) {
                setIsDbInitialized(true)
            }
        } catch (error) {
            console.error("Database initialization failed:", error)
        } finally {
            setIsInitializing(false)
        }
    }

    const handleStepComplete = (stepData: Partial<SetupWizardData>) => {
        setFormData((prev) => ({ ...prev, ...stepData }))
        if (currentStep < steps.length - 1) {
            nextStep()
        }
    }

    const handleFinish = async () => {
        setIsSubmitting(true)
        try {
            console.log("[SetupWizard] Starting setup completion...")
            await onComplete(formData, isDbInitialized)
            console.log("[SetupWizard] Setup completion finished successfully")
        } catch (error) {
            console.error("[SetupWizard] Setup failed:", error)
            throw error
        } finally {
            setIsSubmitting(false)
        }
    }

    // Map step indices to correct component based on mode
    const getStepComponent = () => {
        switch (currentStepData.title) {
            case "School Information":
                return <SchoolInfoStep
                    data={formData.schoolInfo}
                    onUpdate={(val: any) => setFormData(prev => ({ ...prev, schoolInfo: { ...prev.schoolInfo, ...val } }))}
                    onNext={nextStep}
                />;
            case "Academic Year":
                return <AcademicYearStep
                    data={formData.academicYear}
                    onUpdate={(u) => setFormData(prev => ({ ...prev, academicYear: { ...prev.academicYear, ...u } }))}
                    onNext={nextStep}
                    onBack={prevStep}
                />;
            case "System User":
                return <AdminAccountStep
                    data={formData.adminInfo}
                    onUpdate={(val: any) => setFormData(prev => ({ ...prev, adminInfo: { ...prev.adminInfo, ...val } }))}
                    onNext={nextStep}
                    onBack={prevStep}
                />;
            case "Database Setup":
                return <DatabaseSetupStep
                    data={formData.database}
                    onUpdate={(val: any) => setFormData(prev => ({ ...prev, database: { ...prev.database, ...val } }))}
                    onNext={nextStep}
                    onBack={prevStep}
                    isInitializing={isInitializing}
                    isInitialized={isDbInitialized}
                    onInitialize={handleInitializeDatabase}
                />;
            case "Confirmation":
                return <ConfirmationStep
                    data={formData}
                    onBack={prevStep}
                    onComplete={handleFinish}
                    isSubmitting={isSubmitting}
                />;
            default:
                return null;
        }
    }

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
            {/* Sidebar Progress (Step 1 Style) */}
            <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col p-8 pt-12">
                <div className="flex items-center gap-3 mb-12">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <School className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg leading-tight">School Nexus</h2>
                        <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider">System Setup</p>
                    </div>
                </div>

                <div className="space-y-6 flex-1">
                    {steps.map((step, idx) => (
                        <div key={idx} className="relative flex items-start gap-4 group">
                            {/* Connector Line */}
                            {idx < steps.length - 1 && (
                                <div className={cn(
                                    "absolute left-5 top-10 bottom-[-24px] w-0.5 bg-slate-100 transition-colors",
                                    idx < currentStep && "bg-emerald-500"
                                )} />
                            )}

                            <div className={cn(
                                "z-10 h-10 w-10 rounded-full flex items-center justify-center transition-all border-2",
                                idx === currentStep ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" :
                                    idx < currentStep ? "bg-white border-emerald-500 text-emerald-500" :
                                        "bg-white border-slate-200 text-slate-400 group-hover:border-slate-300"
                            )}>
                                {idx < currentStep ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : (
                                    <span className="text-sm font-bold">{idx + 1}</span>
                                )}
                            </div>

                            <div className="flex flex-col pt-1">
                                <span className={cn(
                                    "text-sm font-bold transition-colors",
                                    idx === currentStep ? "text-slate-900" : "text-slate-500"
                                )}>
                                    {step.title}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                    {step.description}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pro Tip Card */}
                <div className="mt-auto bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                        <Lightbulb className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Pro Tip</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                        Your school details will appear on official student reports, IDs, and system invoices.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-slate-50/50">
                {/* Header Sub-Progress (Optional based on images, but unified here) */}
                <div className="h-20 bg-white border-b border-slate-200 flex items-center px-12 justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-slate-900 leading-none mb-1">
                            {steps[currentStep].title}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">
                            Step {currentStep + 1} of {steps.length} • {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Offline Mode Active</span>
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto p-12 flex justify-center">
                    <div className="w-full max-w-[800px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                {getStepComponent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
