"use client"

import { Database, PlusCircle, FolderOpen, ShieldCheck, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DatabaseSetupStepProps {
    data: any
    onUpdate: (data: any) => void
    onNext: () => void
    onBack: () => void
    isInitializing?: boolean
    isInitialized?: boolean
    onInitialize?: () => void
}

export function DatabaseSetupStep({
    data,
    onUpdate,
    onNext,
    onBack,
    isInitializing,
    isInitialized,
    onInitialize
}: DatabaseSetupStepProps) {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                    onClick={() => onUpdate({ mode: "new" })}
                    className={cn(
                        "group relative p-6 rounded-3xl border-2 transition-all cursor-pointer",
                        data.mode === "new"
                            ? "bg-emerald-50 border-emerald-500 shadow-md ring-4 ring-emerald-500/10"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                >
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                        data.mode === "new" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    )}>
                        <PlusCircle className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">Create New</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Start fresh with a new encrypted local database.</p>
                </div>

                <div
                    onClick={() => onUpdate({ mode: "import" })}
                    className={cn(
                        "group relative p-6 rounded-3xl border-2 transition-all cursor-pointer",
                        data.mode === "import"
                            ? "bg-emerald-50 border-emerald-500 shadow-md ring-4 ring-emerald-500/10"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                >
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                        data.mode === "import" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    )}>
                        <FolderOpen className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">Import Existing</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Restore data from a previous School Nexus backup.</p>
                </div>
            </div>

            <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 flex gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-emerald-900 mb-1">Privacy & Security</h4>
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                        Your data stays on this device. School Nexus uses local SQLite encryption.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">Database Initialization</h4>
                        <p className="text-[11px] text-slate-500">Prepare your local storage for the first run.</p>
                    </div>
                    <Button
                        onClick={onInitialize}
                        disabled={isInitializing || isInitialized}
                        className={cn(
                            "h-10 px-6 font-bold rounded-xl transition-all",
                            isInitialized
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-default"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                        )}
                    >
                        {isInitializing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Initializing...
                            </>
                        ) : isInitialized ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Initialized
                            </>
                        ) : (
                            "Initialize Database"
                        )}
                    </Button>
                </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-4 pb-12">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="h-12 px-8 font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <Button
                    onClick={onNext}
                    className="h-12 px-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    )
}
