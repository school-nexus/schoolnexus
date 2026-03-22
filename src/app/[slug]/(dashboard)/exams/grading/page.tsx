"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Settings2,
    Save,
    Trash2,
    PlusCircle,
    GraduationCap,
    Loader2,
    Info
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { gradingActions, settingsActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface GradingScale {
    id: number
    grade: string
    minScore: number
    maxScore: number
    points: number | null
    remark: string | null
}

interface GradingSetting {
    id: number
    key: string
    value: string
}

export default function GradingSystemPage() {
    const { confirm } = useConfirm()
    const [gradingScales, setGradingScales] = useState<GradingScale[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Global Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [systemName, setSystemName] = useState("UNEB PLE Grading")
    const [passMark, setPassMark] = useState("P8")
    const [calculationMethod, setCalculationMethod] = useState("average")
    const [gradeFormat, setGradeFormat] = useState("percentage")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [scales, settings] = await Promise.all([
                gradingActions.getAll() as Promise<GradingScale[]>,
                settingsActions.get() as Promise<GradingSetting[]>
            ])

            if (scales.length > 0) {
                setGradingScales(scales)
            } else {
                // Default grading scales if none exist
                setGradingScales([
                    { id: 0, grade: "D1", minScore: 90, maxScore: 100, points: 1.0, remark: "Distinction One" },
                    { id: 0, grade: "D2", minScore: 80, maxScore: 89, points: 2.0, remark: "Distinction Two" },
                    { id: 0, grade: "C3", minScore: 70, maxScore: 79, points: 3.0, remark: "Credit Three" },
                    { id: 0, grade: "C4", minScore: 60, maxScore: 69, points: 4.0, remark: "Credit Four" },
                    { id: 0, grade: "C5", minScore: 55, maxScore: 59, points: 5.0, remark: "Credit Five" },
                    { id: 0, grade: "C6", minScore: 50, maxScore: 54, points: 6.0, remark: "Credit Six" },
                    { id: 0, grade: "P7", minScore: 45, maxScore: 49, points: 7.0, remark: "Pass Seven" },
                    { id: 0, grade: "P8", minScore: 40, maxScore: 44, points: 8.0, remark: "Pass Eight" },
                    { id: 0, grade: "F9", minScore: 0, maxScore: 39, points: 9.0, remark: "Fail Nine" },
                ])
            }

            // Load Settings
            if (settings && Array.isArray(settings)) {
                settings.forEach((s) => {
                    if (s.key === 'grading_system_name') setSystemName(s.value)
                    if (s.key === 'pass_mark') setPassMark(s.value)
                    if (s.key === 'calculation_method') setCalculationMethod(s.value)
                    if (s.key === 'grade_format') setGradeFormat(s.value)
                })
            }
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const handleAddGrade = () => {
        setGradingScales([
            ...gradingScales,
            { id: 0, grade: "", minScore: 0, maxScore: 0, points: 0, remark: "" }
        ])
    }

    const handleDeleteGrade = async (id: number, index: number) => {
        if (id !== 0) {
            try {
                await gradingActions.delete(id)
                toast.success("Grade level deleted")
            } catch (error: unknown) {
                toast.error("Failed to delete grade level")
                return
            }
        }
        const newScales = [...gradingScales]
        newScales.splice(index, 1)
        setGradingScales(newScales)
    }

    const handleUpdateScale = (index: number, field: keyof GradingScale, value: string | number | null) => {
        const newScales = [...gradingScales]
        newScales[index] = { ...newScales[index], [field]: value } as GradingScale
        setGradingScales(newScales)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Process sequentially to avoid race conditions or DB locks
            for (const scale of gradingScales) {
                if (scale.id === 0) {
                    await gradingActions.create({
                        grade: scale.grade,
                        minScore: scale.minScore,
                        maxScore: scale.maxScore,
                        points: scale.points || 0,
                        remark: scale.remark || ""
                    })
                } else {
                    await gradingActions.update({
                        id: scale.id,
                        grade: scale.grade,
                        minScore: scale.minScore,
                        maxScore: scale.maxScore,
                        points: scale.points || 0,
                        remark: scale.remark || ""
                    })
                }
            }
            toast.success("Grading scales saved successfully!")
            await fetchData() // Refresh data to get new IDs
        } catch (error: unknown) {
            console.error("Failed to save:", error)
            toast.error("Failed to save grading scales")
        } finally {
            setSaving(false)
        }
    }



    const handleSaveSettings = async () => {
        try {
            await Promise.all([
                settingsActions.update({ key: 'grading_system_name', value: systemName }),
                settingsActions.update({ key: 'pass_mark', value: passMark }),
                settingsActions.update({ key: 'calculation_method', value: calculationMethod }),
                settingsActions.update({ key: 'grade_format', value: gradeFormat }),
            ])
            toast.success("Settings saved successfully")
            setIsSettingsOpen(false)
        } catch (error: unknown) {
            console.error("Failed to save settings:", error)
            toast.error("Failed to save settings")
        }
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Grading System"
                    description="Configure grading scales, points, and remarks for different academic levels."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Examinations", href: "/exams" },
                        { label: "Grading System" },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="outline"
                                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-11 px-6 rounded-xl shadow-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                onClick={() => setIsSettingsOpen(true)}
                            >
                                <Settings2 className="mr-2 h-4 w-4 text-emerald-600" /> Global Settings
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-11 px-6 rounded-xl shadow-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                onClick={handleAddGrade}
                            >
                                <PlusCircle className="mr-2 h-4 w-4 text-emerald-600" /> Add Grade Level
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    }
                />

                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Grading System Settings</DialogTitle>
                            <DialogDescription>Configure global settings for the grading system.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>System Name</Label>
                                <Input
                                    value={systemName}
                                    onChange={(e) => setSystemName(e.target.value)}
                                    placeholder="e.g. UNEB PLE Grading"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Pass Mark Grade</Label>
                                    <Input
                                        value={passMark}
                                        onChange={(e) => setPassMark(e.target.value)}
                                        placeholder="e.g. P8"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Grade Format</Label>
                                    <Select value={gradeFormat} onValueChange={setGradeFormat}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="gpa">GPA (4.0 Scale)</SelectItem>
                                            <SelectItem value="letter">Letter Grade (A-F)</SelectItem>
                                            <SelectItem value="uneb_divisions">UNEB Divisions (I, II, III, IV, U)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Calculation Method</Label>
                                <Select value={calculationMethod} onValueChange={setCalculationMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="average">Average Score</SelectItem>
                                        <SelectItem value="sum">Sum of Points</SelectItem>
                                        <SelectItem value="weighted_average">Weighted Average</SelectItem>
                                        <SelectItem value="uneb_ple_aggregates">UNEB PLE Aggregates (Best 4)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-slate-500">
                                    Determines how the final grade is computed for students.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleSaveSettings}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                            >
                                Save Settings
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: System Selection & Scale (8 columns) */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                            <CardHeader className="border-b border-slate-100 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-bold text-slate-900">{systemName}</CardTitle>
                                        <CardDescription>Configure the grading scale below (Highest to Lowest)</CardDescription>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                        {gradingScales.length} Levels
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table className="border-collapse">
                                    <TableHeader className="bg-emerald-600">
                                        <TableRow className="hover:bg-transparent border-emerald-500/30">
                                            <TableHead className="font-bold text-white h-14 w-24 border-r border-emerald-500/30">Grade</TableHead>
                                            <TableHead className="font-bold text-white border-r border-emerald-500/30">Min Score (%)</TableHead>
                                            <TableHead className="font-bold text-white border-r border-emerald-500/30">Max Score (%)</TableHead>
                                            <TableHead className="font-bold text-white border-r border-emerald-500/30">Grade Points</TableHead>
                                            <TableHead className="font-bold text-white border-r border-emerald-500/30">Remark</TableHead>
                                            <TableHead className="text-right font-bold text-white pr-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {gradingScales.map((scale, idx) => (
                                            <TableRow key={idx} className={cn(
                                                "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                                idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                            )}>
                                                <TableCell className="py-4 border-r border-emerald-100/50">
                                                    <Input
                                                        value={scale.grade}
                                                        onChange={(e) => handleUpdateScale(idx, 'grade', e.target.value)}
                                                        className="h-9 w-16 text-center font-bold bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                                    />
                                                </TableCell>
                                                <TableCell className="border-r border-emerald-100/50">
                                                    <Input
                                                        value={scale.minScore}
                                                        type="number"
                                                        onChange={(e) => handleUpdateScale(idx, 'minScore', parseInt(e.target.value))}
                                                        className="h-9 w-20 bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                                    />
                                                </TableCell>
                                                <TableCell className="border-r border-emerald-100/50">
                                                    <Input
                                                        value={scale.maxScore}
                                                        type="number"
                                                        onChange={(e) => handleUpdateScale(idx, 'maxScore', parseInt(e.target.value))}
                                                        className="h-9 w-20 bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                                    />
                                                </TableCell>
                                                <TableCell className="border-r border-emerald-100/50">
                                                    <Input
                                                        value={scale.points || ''}
                                                        type="number"
                                                        step="0.1"
                                                        onChange={(e) => handleUpdateScale(idx, 'points', parseFloat(e.target.value))}
                                                        className="h-9 w-20 bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                                    />
                                                </TableCell>
                                                <TableCell className="border-r border-emerald-100/50">
                                                    <Input
                                                        value={scale.remark || ''}
                                                        onChange={(e) => handleUpdateScale(idx, 'remark', e.target.value)}
                                                        className="h-9 min-w-[120px] bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        onClick={() => handleDeleteGrade(scale.id, idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                                    <Button
                                        variant="ghost"
                                        className="w-full h-10 text-teal-600 font-bold hover:bg-teal-50 rounded-xl border-2 border-dashed border-teal-100"
                                        onClick={handleAddGrade}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Grade Level
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Info & Preview (4 columns) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-900">System Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                                    <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Active System</p>
                                        <p className="text-sm font-bold text-slate-900">{systemName}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Total Grade Levels</span>
                                        <span className="font-bold text-slate-900">{gradingScales.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Highest Grade</span>
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                            {gradingScales.length > 0 ? `${gradingScales[0].grade} (${gradingScales[0].minScore}-${gradingScales[0].maxScore})` : "N/A"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Passing Grade</span>
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">{passMark}</Badge>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 space-y-2">

                                    <Button
                                        variant="outline"
                                        className="w-full h-11 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200 hover:border-red-200 transition-all"
                                        onClick={async () => {
                                            if (await confirm({
                                                title: "Reset to Defaults",
                                                description: "Are you sure you want to reset to defaults? This cannot be undone.",
                                                confirmText: "Reset Defaults",
                                                variant: "destructive"
                                            })) {
                                                setGradingScales([])
                                                fetchData()
                                                toast.success("Reset to defaults")
                                            }
                                        }}
                                    >
                                        Reset to Defaults
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-3">
                            <div className="flex items-center gap-2 text-teal-700">
                                <Info className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Note</span>
                            </div>
                            <p className="text-[11px] text-teal-800/80 leading-relaxed">
                                {calculationMethod === 'uneb_ple_aggregates'
                                    ? "UNEB PLE Aggregates mode calculates the best 4 subjects. Lower aggregates indicate better performance (e.g., Aggregate 4 is the best)."
                                    : calculationMethod === 'weighted_average'
                                        ? "Weighted Average mode considers subject weightage when calculating the final score."
                                        : "Grade points are used to calculate the Grade Point Average (GPA) for each student. Ensure they are consistent with your institution's policy."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

