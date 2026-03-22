import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock, Info, Layers, Plus, Trash2 } from 'lucide-react';
interface AcademicYearStepProps {
    data: any
    onUpdate: (data: any) => void
    onNext: () => void
    onBack: () => void
}

export function AcademicYearStep({ data, onUpdate, onNext, onBack }: AcademicYearStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!data.name?.trim()) newErrors.name = "Year name is required"
        if (!data.startDate) newErrors.startDate = "Start date is required"
        if (!data.endDate) newErrors.endDate = "End date is required"

        // Validate terms
        data.terms.forEach((term: any, idx: number) => {
            if (!term.name?.trim()) newErrors[`term_${idx}_name`] = "Term name required"
            if (!term.startDate) newErrors[`term_${idx}_start`] = "Start date required"
            if (!term.endDate) newErrors[`term_${idx}_end`] = "End date required"
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validate()) {
            onNext()
        }
    }

    const updateTerm = (idx: number, field: string, value: any) => {
        const newTerms = [...data.terms]
        newTerms[idx] = { ...newTerms[idx], [field]: value }
        onUpdate({ terms: newTerms })
    }

    const addTerm = () => {
        onUpdate({
            terms: [...data.terms, { name: `Term ${data.terms.length + 1}`, startDate: "", endDate: "", isActive: false }]
        })
    }

    const removeTerm = (idx: number) => {
        if (data.terms.length <= 1) return
        const newTerms = data.terms.filter((_: any, i: number) => i !== idx)
        onUpdate({ terms: newTerms })
    }

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                {/* Header Section */}
                <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-100">
                    <div className="h-20 w-32 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-4">
                        <div className="text-center">
                            <Calendar className="h-7 w-7 text-emerald-500 mx-auto mb-1" />
                            <div className="h-1 w-12 bg-emerald-200 rounded-full mx-auto" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Academic Calendar</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Define your school's operating calendar. This organizes all student records and grading.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Year Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5 md:col-span-1">
                            <Label className="text-xs font-bold text-slate-700 ml-1">Academic Year</Label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="e.g. 2026"
                                    className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-bold ${errors.name ? 'border-red-500 bg-red-50/30' : ''}`}
                                    value={data.name}
                                    onChange={(e) => onUpdate({ name: e.target.value })}
                                />
                            </div>
                            {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 ml-1">Year Starts</Label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium pr-4 ${errors.startDate ? 'border-red-500 bg-red-50/30' : ''}`}
                                    value={data.startDate}
                                    onChange={(e) => onUpdate({ startDate: e.target.value })}
                                />
                            </div>
                            {errors.startDate && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.startDate}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 ml-1">Year Ends</Label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium pr-4 ${errors.endDate ? 'border-red-500 bg-red-50/30' : ''}`}
                                    value={data.endDate}
                                    onChange={(e) => onUpdate({ endDate: e.target.value })}
                                />
                            </div>
                            {errors.endDate && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.endDate}</p>}
                        </div>
                    </div>

                    {/* Terms Configuration */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-emerald-500" />
                                <h4 className="text-sm font-bold text-slate-900">Academic Terms</h4>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addTerm}
                                className="h-8 px-3 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Term
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {data.terms.map((term: any, idx: number) => (
                                <div key={idx} className="group relative bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-colors hover:bg-white hover:border-emerald-100">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        <div className="md:col-span-4 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-slate-500 ml-1">Term Name</Label>
                                            <Input
                                                placeholder="e.g. Term 1"
                                                className={`h-10 bg-white border-slate-200 rounded-xl text-sm font-medium ${errors[`term_${idx}_name`] ? 'border-red-500' : ''}`}
                                                value={term.name}
                                                onChange={(e) => updateTerm(idx, "name", e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-slate-500 ml-1">Starts</Label>
                                            <Input
                                                type="date"
                                                className={`h-10 bg-white border-slate-200 rounded-xl text-xs font-medium ${errors[`term_${idx}_start`] ? 'border-red-500' : ''}`}
                                                value={term.startDate}
                                                onChange={(e) => updateTerm(idx, "startDate", e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-slate-500 ml-1">Ends</Label>
                                            <Input
                                                type="date"
                                                className={`h-10 bg-white border-slate-200 rounded-xl text-xs font-medium ${errors[`term_${idx}_end`] ? 'border-red-500' : ''}`}
                                                value={term.endDate}
                                                onChange={(e) => updateTerm(idx, "endDate", e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex items-center justify-between gap-2 pb-1">
                                            <div
                                                onClick={() => {
                                                    const newTerms = data.terms.map((t: any, i: number) => ({ ...t, isActive: i === idx }))
                                                    onUpdate({ terms: newTerms })
                                                }}
                                                className={`flex-1 h-10 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${term.isActive ? 'bg-emerald-500 border-emerald-500 text-white font-bold' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                            >
                                                {term.isActive ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>}
                                            </div>
                                            {data.terms.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeTerm(idx)}
                                                    className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {(errors[`term_${idx}_name`] || errors[`term_${idx}_start`] || errors[`term_${idx}_end`]) && (
                                        <p className="text-[9px] font-bold text-red-500 mt-2 ml-1 italic">Please complete all fields for this term.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-cyan-50/50 rounded-2xl p-5 border border-cyan-100 flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-200">
                        <Info className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-cyan-900 mb-0.5">Session Planning Guide</h4>
                        <p className="text-[11px] text-cyan-800 leading-relaxed font-medium">
                            Set the overall year dates first, then divide into terms. The active term will be the default for all new student records and fee entries.
                        </p>
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
