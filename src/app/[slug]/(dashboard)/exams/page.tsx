"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Award, Calendar, ClipboardList, Download, Edit, FileText, Filter, Loader2, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { examActions, termActions, academicYearActions, subjectActions, classActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"

interface RawExamType {
    id: number
    name: string
    shortCode: string
    weightage: number | null
}

interface RawTerm {
    id: number
    name: string
    academicYearId: number
}

interface RawSubject {
    id: number
    name: string
    code: string
}

interface RawClass {
    id: number
    name: string
}

interface RawExam {
    id: number
    name: string | null
    examTypeId: number
    examTypeName?: string
    termId: number
    classId: number | null
    className?: string
    duration: number | null
    startDate: string
    endDate: string
    subjects: RawSubject[]
}

interface Exam {
    id: string
    name: string
    type: string
    startDate: string
    endDate: string
    status: string
    classes: string
    examTypeId: number
    termId: number
    classId: number | null
    duration: number | null
    subjects: RawSubject[]
}

export default function ExamListPage() {
    const { confirm } = useConfirm()
    const [exams, setExams] = useState<Exam[]>([])
    const [examTypes, setExamTypes] = useState<RawExamType[]>([])
    const [terms, setTerms] = useState<RawTerm[]>([])
    const [allSubjects, setAllSubjects] = useState<RawSubject[]>([])
    const [allClasses, setAllClasses] = useState<RawClass[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingExamId, setEditingExamId] = useState<string | null>(null)
    const [newExam, setNewExam] = useState({
        name: "",
        examTypeId: "",
        termId: "",
        classId: "",
        date: "",
        startTime: "",
        endTime: "",
        subjectId: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [examsData, typesData, yearsData, subjectsData, classesData] = await Promise.all([
                examActions.getAll() as Promise<RawExam[]>,
                examActions.getTypes() as Promise<RawExamType[]>,
                academicYearActions.getAll() as Promise<{ id: number }[]>,
                subjectActions.getAll() as Promise<RawSubject[]>,
                classActions.getAll() as Promise<RawClass[]>
            ])

            // Get terms for all active/recent years
            const allTerms: RawTerm[] = []
            for (const year of yearsData) {
                const yearTerms = await termActions.getByYear(year.id) as RawTerm[]
                allTerms.push(...yearTerms)
            }
            setTerms(allTerms)
            setAllSubjects(subjectsData)
            setAllClasses(classesData)

            // Map database exams to UI format
            const mappedExams: Exam[] = examsData.map((e) => {
                const now = new Date()
                const startDate = new Date(e.startDate)
                const endDate = new Date(e.endDate)

                let status = "Upcoming"
                if (endDate < now) {
                    status = "Completed"
                } else if (startDate <= now && endDate >= now) {
                    status = "In Progress"
                }

                return {
                    id: e.id.toString(),
                    name: e.name || e.examTypeName || "Exam",
                    type: e.examTypeName || "EXAM",
                    startDate: e.startDate,
                    endDate: e.endDate,
                    status,
                    classes: e.className || "All Classes",
                    examTypeId: e.examTypeId,
                    termId: e.termId,
                    classId: e.classId,
                    duration: e.duration,
                    subjects: e.subjects || []
                }
            })

            setExams(mappedExams)
            setExamTypes(typesData)
        } catch (error: unknown) {
            console.error("Failed to fetch exams:", error)
            toast.error("Failed to load exams")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveExam = async () => {
        if (!newExam.name || !newExam.examTypeId || !newExam.termId || !newExam.classId || !newExam.date || !newExam.startTime || !newExam.endTime || !newExam.subjectId) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSaving(true)
        try {
            const examData = {
                name: newExam.name,
                examTypeId: parseInt(newExam.examTypeId),
                termId: parseInt(newExam.termId),
                classId: parseInt(newExam.classId),
                duration: null,
                startDate: `${newExam.date}T${newExam.startTime}`,
                endDate: `${newExam.date}T${newExam.endTime}`,
                subjectIds: [parseInt(newExam.subjectId)]
            }

            if (editingExamId) {
                await examActions.update({ ...examData, id: parseInt(editingExamId) })
                toast.success("Exam updated successfully")
            } else {
                await examActions.create(examData)
                toast.success("Exam created successfully")
            }

            setIsCreateDialogOpen(false)
            setEditingExamId(null)
            setNewExam({ name: "", examTypeId: "", termId: "", classId: "", date: "", startTime: "", endTime: "", subjectId: "" })
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to save exam:", error)
            toast.error("Failed to save exam")
        } finally {
            setIsSaving(false)
        }
    }

    const handleEditClick = (exam: Exam) => {
        setEditingExamId(exam.id)
        const startDateTime = exam.startDate ? exam.startDate.split('T') : ['', '']
        const endDateTime = exam.endDate ? exam.endDate.split('T') : ['', '']
        setNewExam({
            name: exam.name,
            examTypeId: exam.examTypeId.toString(),
            termId: exam.termId.toString(),
            classId: exam.classId?.toString() || "",
            date: startDateTime[0] || "",
            startTime: startDateTime[1]?.substring(0, 5) || "",
            endTime: endDateTime[1]?.substring(0, 5) || "",
            subjectId: exam.subjects[0]?.id.toString() || ""
        })
        setIsCreateDialogOpen(true)
    }

    const handleDeleteExam = async (id: string) => {
        if (!await confirm({
            title: "Delete Exam",
            description: "Are you sure you want to delete this exam? This will also delete all associated marks.",
            confirmText: "Delete Exam",
            variant: "destructive"
        })) return

        try {
            await examActions.delete(parseInt(id))
            toast.success("Exam deleted successfully")
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to delete exam:", error)
            toast.error("Failed to delete exam")
        }
    }

    const filteredExams = exams.filter(exam =>
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.type.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const upcomingCount = exams.filter(e => e.status === "Upcoming").length
    const completedCount = exams.filter(e => e.status === "Completed").length

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Examinations"
                    description="Manage exam schedules, types, and results."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Exams", href: "/exams" },
                        { label: "List" },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search exams..."
                                    className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold">
                                <Filter className="mr-2 h-4 w-4" /> Filters
                            </Button>
                            <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-11 rounded-xl shadow-sm font-semibold">
                                <Download className="mr-2 h-4 w-4" /> Export
                            </Button>

                            <Button
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02]"
                                onClick={() => {
                                    setEditingExamId(null);
                                    setNewExam({ name: "", examTypeId: "", termId: "", classId: "", date: "", startTime: "", endTime: "", subjectId: "" });
                                    setIsCreateDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Create Exam
                            </Button>
                        </div>
                    }
                />

                {/* Dialog for Creating/Editing Exams */}
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) {
                        setEditingExamId(null);
                        setNewExam({ name: "", examTypeId: "", termId: "", classId: "", date: "", startTime: "", endTime: "", subjectId: "" });
                    }
                }}>
                    <DialogContent className="sm:max-w-[420px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
                        {/* Clean Header */}
                        <div className="px-5 pt-5 pb-4">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-semibold text-slate-800">
                                    {editingExamId ? "Edit Exam" : "New Exam"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 text-sm">
                                    Fill in the exam details below
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {/* Form */}
                        <div className="px-5 pb-5 space-y-3">
                            <Input
                                autoFocus
                                placeholder="Exam Name (e.g. Term 1 Opening)"
                                className="h-10 rounded-lg border-slate-200 text-sm"
                                value={newExam.name}
                                onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <Select value={newExam.examTypeId} onValueChange={(v) => setNewExam({ ...newExam, examTypeId: v })}>
                                    <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                        <SelectValue placeholder="Exam Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {examTypes.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={newExam.termId} onValueChange={(v) => setNewExam({ ...newExam, termId: v })}>
                                    <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                        <SelectValue placeholder="Term" />
                                    </SelectTrigger>
                                    <SelectContent side="bottom" position="popper" align="start" className="max-h-[200px] overflow-y-auto">
                                        {terms.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Select value={newExam.classId} onValueChange={(v) => setNewExam({ ...newExam, classId: v })}>
                                    <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                        <SelectValue placeholder="Class" />
                                    </SelectTrigger>
                                    <SelectContent side="bottom" position="popper" align="start" className="max-h-[200px] overflow-y-auto">
                                        {allClasses.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={newExam.subjectId} onValueChange={(v) => setNewExam({ ...newExam, subjectId: v })}>
                                    <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                        <SelectValue placeholder="Subject" />
                                    </SelectTrigger>
                                    <SelectContent side="bottom" position="popper" align="start" className="max-h-[200px] overflow-y-auto">
                                        {allSubjects.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Input
                                type="date"
                                className="h-10 rounded-lg border-slate-200 text-sm [color-scheme:light]"
                                value={newExam.date}
                                onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Input
                                        type="time"
                                        className="h-10 rounded-lg border-slate-200 text-sm pl-3 [color-scheme:light]"
                                        value={newExam.startTime}
                                        onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none uppercase">Start</span>
                                </div>
                                <div className="relative">
                                    <Input
                                        type="time"
                                        className="h-10 rounded-lg border-slate-200 text-sm pl-3 [color-scheme:light]"
                                        value={newExam.endTime}
                                        onChange={(e) => setNewExam({ ...newExam, endTime: e.target.value })}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none uppercase">End</span>
                                </div>
                            </div>

                            <Button
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg w-full h-10 text-sm font-medium mt-2 shadow-lg shadow-emerald-500/10"
                                onClick={handleSaveExam}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {editingExamId ? "Save Changes" : "Create Exam"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="w-[300px] font-bold text-white h-14 border-r border-emerald-500/30">Exam Name</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Type</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Duration</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Subjects</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Status</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredExams.length > 0 ? filteredExams.map((exam, idx) => (
                                        <TableRow key={exam.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center ring-1 ring-rose-100 group-hover:scale-110 transition-transform">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    {exam.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 px-2.5 py-0.5 rounded-lg font-medium">
                                                    {exam.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-600 border-r border-emerald-100/50">
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{new Date(exam.startDate).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-slate-400">to {new Date(exam.endDate).toLocaleDateString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-600 max-w-[200px] border-r border-emerald-100/50">
                                                <div className="flex flex-wrap gap-1">
                                                    {exam.subjects.map(s => (
                                                        <Badge key={s.id} variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200">
                                                            {s.code}
                                                        </Badge>
                                                    ))}
                                                    {exam.subjects.length === 0 && <span className="text-slate-400 text-xs italic">No subjects</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge className={cn(
                                                    "px-2.5 py-0.5 rounded-lg border font-semibold",
                                                    exam.status === 'Upcoming'
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                        : exam.status === 'In Progress'
                                                            ? "bg-amber-50 text-amber-700 border-amber-100"
                                                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                )}>
                                                    {exam.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-emerald-600 rounded-lg"
                                                        onClick={() => handleEditClick(exam)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 rounded-lg"
                                                        onClick={() => handleDeleteExam(exam.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-400 border-emerald-100/50">
                                                No exams found. Create your first exam to get started.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
