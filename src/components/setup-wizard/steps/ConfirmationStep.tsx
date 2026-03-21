"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    CheckCircle,
    Rocket,
    ArrowLeft,
    School,
    Calendar,
    User,
    Database,
    Mail,
    Phone,
    Globe,
    Layers,
    MapPin
} from "lucide-react"

interface ConfirmationStepProps {
    data: any
    onBack: () => void
    onComplete: () => void
    isSubmitting?: boolean
    isPlatform?: boolean
}

import { Loader2 } from "lucide-react"

export function ConfirmationStep({ data, onBack, onComplete, isSubmitting, isPlatform = false }: ConfirmationStepProps) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="h-20 w-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
                        <CheckCircle className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Ready to Launch!</h3>
                    <p className="text-slate-500 max-w-sm mt-1">
                        Please review your configuration one last time before finalizing the setup.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* School Profile Summary - ONLY FOR SCHOOL MODE */}
                    {!isPlatform && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <School className="h-4 w-4 text-emerald-500" />
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">School Profile</h4>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-4">
                                    {data.schoolInfo.logo ? (
                                        <img src={`protocol-file://${data.schoolInfo.logo}`} className="h-12 w-12 rounded-xl object-cover" alt="Logo" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-xl bg-slate-200 flex items-center justify-center">
                                            <School className="h-6 w-6 text-slate-400" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{data.schoolInfo.name}</p>
                                        <p className="text-[11px] text-slate-500 italic">"{data.schoolInfo.motto || 'No motto set'}"</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50">
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold uppercase">Currency</Label>
                                        <p className="text-xs font-bold text-slate-700">{data.schoolInfo.currency}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-slate-400 font-bold uppercase">Phone</Label>
                                        <p className="text-xs font-bold text-slate-700">{data.schoolInfo.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Academic Calendar Summary - ONLY FOR SCHOOL MODE */}
                    {!isPlatform && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-emerald-500" />
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Academic Year</h4>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Academic Year {data.academicYear.name}</p>
                                    <p className="text-[11px] text-slate-500">{data.academicYear.startDate} to {data.academicYear.endDate}</p>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-slate-200/50">
                                    <Label className="text-[10px] text-slate-400 font-bold uppercase">Terms ({data.academicYear.terms.length})</Label>
                                    <div className="space-y-1">
                                        {data.academicYear.terms.map((term: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-slate-600">{term.name}</span>
                                                {term.isActive && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold">ACTIVE</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Account Summary */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-emerald-500" />
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{isPlatform ? 'Super Administrator' : 'School Administrator'}</h4>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                    {data.adminInfo.fullName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{data.adminInfo.fullName}</p>
                                    <p className="text-[11px] text-slate-500">@{data.adminInfo.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{data.adminInfo.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Database Summary (System Status) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Database className="h-4 w-4 text-emerald-500" />
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{isPlatform ? 'System Environment' : 'Database Storage'}</h4>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-900 capitalize">{isPlatform ? 'Cloudflare Edge' : data.database.mode + ' Database'}</span>
                                <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">D1 + R2</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                {isPlatform 
                                    ? "Platform-wide resources will be initialized for multi-tenant school scaling."
                                    : "All data stored within your secure school database partition."
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <p className="text-xs font-bold text-emerald-800 text-center">
                        By clicking "Finish Setup", the system will seed your database and create your administrator account.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 pb-12">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="h-14 px-10 font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl disabled:opacity-50"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Previous
                </Button>

                <Button
                    onClick={onComplete}
                    disabled={isSubmitting}
                    className="h-14 px-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-80 disabled:hover:scale-100"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Launching...
                        </>
                    ) : (
                        <>
                            Finish Setup & Launch
                            <Rocket className="h-5 w-5 ml-2 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
