import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, ArrowRight, HelpCircle, Lock, Mail, ShieldCheck, User, WifiOff } from 'lucide-react';
interface AdminAccountStepProps {
    data: any
    onUpdate: (data: any) => void
    onNext: () => void
    onBack: () => void
    title?: string
}

export function AdminAccountStep({ data, onUpdate, onNext, onBack, title }: AdminAccountStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!data.fullName?.trim()) newErrors.fullName = "Full name is required"
        if (!data.username?.trim()) newErrors.username = "Username is required"
        if (!data.email?.trim()) {
            newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            newErrors.email = "Invalid email format"
        }

        if (!data.password) {
            newErrors.password = "Password is required"
        } else if (data.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters"
        }

        if (data.password !== data.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validate()) {
            onNext()
        }
    }

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            {title === 'Super Admin' ? 'Super Administrator Full Name' : 'Primary Administrator Name'} <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="e.g. John Doe"
                                className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium ${errors.fullName ? 'border-red-500 bg-red-50/30' : ''}`}
                                value={data.fullName}
                                onChange={(e) => onUpdate({ fullName: e.target.value })}
                            />
                        </div>
                        {errors.fullName && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            System Username <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="admin_nexus"
                                className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium ${errors.username ? 'border-red-500 bg-red-50/30' : ''}`}
                                value={data.username}
                                onChange={(e) => onUpdate({ username: e.target.value })}
                            />
                        </div>
                        {errors.username && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.username}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            Contact Email Address <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="email"
                                placeholder="admin@nexus.io"
                                className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium ${errors.email ? 'border-red-500 bg-red-50/30' : ''}`}
                                value={data.email}
                                onChange={(e) => onUpdate({ email: e.target.value })}
                            />
                        </div>
                        {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            Secure Password <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="password"
                                placeholder="••••••••••••"
                                className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium ${errors.password ? 'border-red-500 bg-red-50/30' : ''}`}
                                value={data.password}
                                onChange={(e) => onUpdate({ password: e.target.value })}
                            />
                        </div>
                        {errors.password && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.password}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            Repeat Password <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="password"
                                placeholder="••••••••••••"
                                className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium ${errors.confirmPassword ? 'border-red-500 bg-red-50/30' : ''}`}
                                value={data.confirmPassword}
                                onChange={(e) => onUpdate({ confirmPassword: e.target.value })}
                            />
                        </div>
                        {errors.confirmPassword && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.confirmPassword}</p>}
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <WifiOff className="h-4 w-4 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Local-Only Security Layer</span>
                    </div>

                    <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50/50 px-4 py-2 rounded-xl border border-emerald-100/50">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-[10px] font-bold uppercase tracking-tight">Write this down!</p>
                    </div>
                </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-4 pb-12">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="h-14 px-10 font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Previous
                </Button>

                <Button
                    onClick={handleNext}
                    className="h-14 px-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                    Continue
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    )
}
