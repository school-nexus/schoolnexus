"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChevronRight, ChevronDown, Users, GraduationCap, CheckCircle2, ArrowRight, AlertTriangle, Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { studentActions, classActions, streamActions } from "@/lib/electron"
import { toast } from "sonner"
import Link from "next/link"

const steps = [
    { id: 1, name: "Select Source Class", status: "current" },
    { id: 2, name: "Choose Students", status: "upcoming" },
    { id: 3, name: "Assign Target Class", status: "upcoming" },
    { id: 4, name: "Confirm Promotion", status: "upcoming" },
]

interface PromotableStudent {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
    status: string
    streamId: number
}

interface RawClass {
    id: number
    name: string
}

interface RawStream {
    id: number
    name: string
    classId: number
}

export default function StudentPromotionPage() {
    const [students, setStudents] = useState<PromotableStudent[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStudents, setSelectedStudents] = useState<number[]>([])
    const [currentStep, setCurrentStep] = useState(1)
    const [sourceStream, setSourceStream] = useState("")
    const [targetStream, setTargetStream] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [classData, streamData] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>
            ])
            setClasses(classData)
            setStreams(streamData)
        } catch (error: unknown) {
            console.error("Failed to fetch classes/streams:", error)
            toast.error("Failed to load classes and streams")
        } finally {
            setLoading(false)
        }
    }

    const loadStudents = async () => {
        if (!sourceStream) {
            toast.error("Please select a source class")
            return
        }
        setLoading(true)
        try {
            const allStudents = await studentActions.getAll() as PromotableStudent[]
            const filtered = allStudents.filter((s) => s.streamId === parseInt(sourceStream))
            setStudents(filtered)
            setCurrentStep(2)
        } catch (error: unknown) {
            console.error("Failed to load students:", error)
            toast.error("Failed to load students")
        } finally {
            setLoading(false)
        }
    }

    const getClassName = (streamId: string) => {
        const stream = streams.find(s => s.id === parseInt(streamId))
        if (!stream) return ""
        const cls = classes.find(c => c.id === stream.classId)
        return `${cls?.name || ''} ${stream.name}`
    }

    const toggleStudent = (id: number) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        )
    }

    const selectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([])
        } else {
            setSelectedStudents(students.map(s => s.id))
        }
    }

    const handlePromotion = async () => {
        if (!targetStream) {
            toast.error("Please select a target class")
            return
        }

        toast.success(`${selectedStudents.length} students promoted successfully!`)
        setSelectedStudents([])
        setCurrentStep(1)
        setSourceStream("")
        setTargetStream("")
        setStudents([])
    }

    if (loading && streams.length === 0) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-8 pb-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/students" className="hover:text-emerald-600 transition-colors">Students</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-emerald-600 font-bold">Promotion</span>
                </nav>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Promotion</h1>
                        <p className="text-slate-500 text-base max-w-2xl font-medium leading-relaxed">
                            Easily promote students to the next academic level or graduate them from the institution.
                        </p>
                    </div>
                </div>

                {/* Steps Progress */}
                <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden transition-all">
                    <CardContent className="p-8">
                        <nav aria-label="Progress">
                            <ol className="flex items-center">
                                {steps.map((step, stepIdx) => (
                                    <li key={step.name} className={cn("relative", stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20 flex-1" : "")}>
                                        <div className="flex items-center">
                                            <div className={cn(
                                                "relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all shadow-lg",
                                                currentStep > step.id ? "bg-emerald-500 shadow-emerald-200" :
                                                    currentStep === step.id ? "bg-emerald-600 shadow-emerald-200 scale-110" : "bg-slate-100 ring-1 ring-slate-200 shadow-none"
                                            )}>
                                                {currentStep > step.id ? (
                                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                                ) : (
                                                    <span className={cn(
                                                        "text-base font-black",
                                                        currentStep === step.id ? "text-white" : "text-slate-400"
                                                    )}>{step.id}</span>
                                                )}
                                            </div>
                                            {stepIdx !== steps.length - 1 && (
                                                <div className={cn(
                                                    "ml-4 h-1 flex-1 transition-colors rounded-full",
                                                    currentStep > step.id ? "bg-emerald-500" : "bg-slate-100"
                                                )} />
                                            )}
                                        </div>
                                        <div className="mt-3">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-[0.2em]",
                                                currentStep === step.id ? "text-emerald-600" : "text-slate-400"
                                            )}>{step.name}</span>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </CardContent>
                </Card>

                {/* Step 1: Select Source Class */}
                {currentStep === 1 && (
                    <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Select Source Class</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-emerald-500" /> Current Class/Stream
                                </label>
                                <Select value={sourceStream} onValueChange={setSourceStream}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-14 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="Select class to promote from" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        {streams.map(s => {
                                            const cls = classes.find(c => c.id === s.classId)
                                            return (
                                                <SelectItem key={s.id} value={s.id.toString()} className="rounded-lg py-3">
                                                    {cls?.name} {s.name}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={loadStudents} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 rounded-2xl font-bold transition-all hover:scale-[1.01] active:scale-[0.99]">
                                Load Students <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Choose Students */}
                {currentStep === 2 && (
                    <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden">
                        <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-slate-100 bg-white/50">
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Select Students to Promote</CardTitle>
                                <p className="text-xs text-slate-500 font-medium mt-1">Choose students from {getClassName(sourceStream)}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={selectAll} className="h-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4">
                                {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table className="border-collapse">
                                <TableHeader className="bg-slate-900">
                                    <TableRow className="hover:bg-transparent border-slate-800">
                                        <TableHead className="w-16 text-center border-r border-slate-800">
                                            <Checkbox
                                                checked={selectedStudents.length === students.length && students.length > 0}
                                                onCheckedChange={selectAll}
                                                className="border-slate-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white mx-auto"
                                            />
                                        </TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 border-r border-slate-800 px-6">Student Information</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 border-r border-slate-800 px-6">Admission No.</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student, idx) => (
                                        <TableRow key={student.id} className={cn(
                                            "hover:bg-emerald-50/30 transition-colors border-slate-100",
                                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                        )}>
                                            <TableCell className="w-16 text-center border-r border-slate-100">
                                                <Checkbox
                                                    checked={selectedStudents.includes(student.id)}
                                                    onCheckedChange={() => toggleStudent(student.id)}
                                                    className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white mx-auto"
                                                />
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900 border-r border-slate-100 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs ring-1 ring-slate-200">
                                                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                                    </div>
                                                    {student.firstName} {student.lastName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-medium border-r border-slate-100 px-6">{student.admissionNumber}</TableCell>
                                            <TableCell className="px-6">
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[10px] px-2.5 py-0.5">{student.status || 'Active'}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                            <Button variant="outline" onClick={() => setCurrentStep(1)} className="h-12 px-8 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-white transition-all">Back</Button>
                            <Button
                                onClick={() => setCurrentStep(3)}
                                disabled={selectedStudents.length === 0}
                                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 rounded-xl font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                            >
                                Continue with {selectedStudents.length} Students <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Step 3: Assign Target Class */}
                {currentStep === 3 && (
                    <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Select Target Class</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-emerald-700 font-bold">
                                        {selectedStudents.length} Students Selected
                                    </p>
                                    <p className="text-xs text-emerald-600 font-medium">From {getClassName(sourceStream)}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4 text-emerald-500" /> Promote to Class/Stream
                                </label>
                                <Select value={targetStream} onValueChange={setTargetStream}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-14 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="Select target class" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="graduate" className="text-teal-600 font-bold bg-teal-50 focus:bg-teal-100 rounded-lg py-3 mx-1 mt-1">
                                            <GraduationCap className="w-5 h-5 mr-3 inline-block" />
                                            Graduate / Archive Students
                                        </SelectItem>
                                        <div className="h-px bg-slate-100 my-2" />
                                        {streams.filter(s => s.id !== parseInt(sourceStream)).map(s => {
                                            const cls = classes.find(c => c.id === s.classId)
                                            return (
                                                <SelectItem key={s.id} value={s.id.toString()} className="rounded-lg py-3">
                                                    {cls?.name} {s.name}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                            <Button variant="outline" onClick={() => setCurrentStep(2)} className="h-12 px-8 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-white transition-all">Back</Button>
                            <Button
                                onClick={() => setCurrentStep(4)}
                                disabled={!targetStream}
                                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 rounded-xl font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                            >
                                Review Promotion <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Step 4: Confirm */}
                {currentStep === 4 && (
                    <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Confirm Migration</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className={cn(
                                "p-8 rounded-[32px] border-2 flex items-start gap-6 transition-all",
                                targetStream === 'graduate'
                                    ? "bg-teal-50/50 border-teal-100 shadow-xl shadow-teal-100/50"
                                    : "bg-emerald-50/50 border-emerald-100 shadow-xl shadow-emerald-100/50"
                            )}>
                                {targetStream === 'graduate' ? (
                                    <div className="p-4 bg-teal-100 rounded-2xl">
                                        <GraduationCap className="h-8 w-8 text-teal-600" />
                                    </div>
                                ) : (
                                    <div className="p-4 bg-emerald-100 rounded-2xl">
                                        <AlertTriangle className="h-8 w-8 text-emerald-600" />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <h3 className={cn("text-lg font-black tracking-tight", targetStream === 'graduate' ? "text-teal-900" : "text-emerald-900")}>
                                        Finalizing {targetStream === 'graduate' ? "Graduation" : "Promotion"}
                                    </h3>
                                    <p className={cn("text-sm font-medium leading-relaxed opacity-80", targetStream === 'graduate' ? "text-teal-800" : "text-emerald-800")}>
                                        You are about to move <strong>{selectedStudents.length}</strong> students from <strong>{getClassName(sourceStream)}</strong>
                                        {targetStream === 'graduate' ? " into the Alumni/Archived archives." : <> into <strong>{getClassName(targetStream)}</strong>.</>}
                                        <br />
                                        <span className="font-bold opacity-100 underline decoration-2 underline-offset-4 mt-2 inline-block">
                                            This administrative action is permanent and will update all academic records.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                            <Button variant="outline" onClick={() => setCurrentStep(3)} className="h-14 px-8 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-white transition-all">Back</Button>
                            <Button
                                onClick={async () => {
                                    try {
                                        if (targetStream === 'graduate') {
                                            await studentActions.promote({
                                                studentIds: selectedStudents,
                                                status: 'Graduated'
                                            })
                                            toast.success(`${selectedStudents.length} students graduated successfully!`)
                                        } else {
                                            await studentActions.promote({
                                                studentIds: selectedStudents,
                                                targetStreamId: parseInt(targetStream)
                                            })
                                            toast.success(`${selectedStudents.length} students promoted successfully!`)
                                        }

                                        setSelectedStudents([])
                                        setCurrentStep(1)
                                        setSourceStream("")
                                        setTargetStream("")
                                        setStudents([])
                                    } catch (error: unknown) {
                                        console.error("Failed to promote students:", error)
                                        toast.error("Failed to promote students")
                                    }
                                }}
                                className={cn(
                                    "flex-1 h-14 rounded-2xl font-black text-white shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]",
                                    targetStream === 'graduate'
                                        ? "bg-teal-600 hover:bg-teal-700 shadow-teal-200"
                                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                                )}
                            >
                                <CheckCircle2 className="mr-3 h-5 w-5" />
                                Confirm {targetStream === 'graduate' ? "Graduation" : "Promotion"}
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}

