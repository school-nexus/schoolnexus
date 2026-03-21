"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    BookOpen,
    Clock,
    Info,
    X,
    MoreHorizontal,
    Filter,
    Plus,
    Loader2
} from "lucide-react"
import { examActions, termActions, academicYearActions, subjectActions, classActions } from "@/lib/electron"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval,
    isWithinInterval,
    parseISO,
    getDay
} from "date-fns"

interface Exam {
    id: string
    name: string
    type: string
    startDate: string
    endDate: string
    status: string
    examTypeId: number
    termId: number
    termName: string
    className: string
    subjects: { id: number, name: string, code: string }[]
}

interface ExamType {
    id: number
    name: string
}

interface Term {
    id: number
    name: string
    academicYearId?: number
}

interface Subject {
    id: number
    name: string
}

interface Class {
    id: number
    name: string
}

export default function ExamSchedulePage() {
    const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Add Exam State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [examTypes, setExamTypes] = useState<ExamType[]>([])
    const [terms, setTerms] = useState<Term[]>([])
    const [allSubjects, setAllSubjects] = useState<Subject[]>([])
    const [allClasses, setAllClasses] = useState<Class[]>([])
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
        setCurrentMonth(new Date())
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [examsData, yearsData, typesData, subjectsData, classesData] = await Promise.all([
                examActions.getAll(),
                academicYearActions.getAll(),
                examActions.getTypes(),
                subjectActions.getAll(),
                classActions.getAll()
            ])

            // Get terms for all active/recent years
            const allTerms: Term[] = []
            for (const year of yearsData) {
                const yearTerms = await termActions.getByYear(year.id) as Term[]
                allTerms.push(...yearTerms)
            }
            setTerms(allTerms)
            setExamTypes(typesData as ExamType[])
            setAllSubjects(subjectsData as Subject[])
            setAllClasses(classesData as Class[])

            const mappedExams = examsData.map((e: any) => {
                const now = new Date()
                const startDate = parseISO(e.startDate)
                const endDate = parseISO(e.endDate || e.startDate)

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
                    endDate: e.endDate || e.startDate,
                    status,
                    examTypeId: e.examTypeId,
                    termId: e.termId,
                    termName: e.termName || "Unknown Term",
                    className: e.className || "All Classes",
                    subjects: e.subjects || []
                }
            }) as Exam[]

            console.log("Fetched exams for schedule:", mappedExams.length, mappedExams);
            setExams(mappedExams)
        } catch (error) {
            console.error("Failed to fetch schedule:", error)
            toast.error("Failed to load exam schedule")
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

            await examActions.create(examData)
            toast.success("Exam created successfully")

            setIsCreateDialogOpen(false)
            setNewExam({ name: "", examTypeId: "", termId: "", classId: "", date: "", startTime: "", endTime: "", subjectId: "" })
            fetchData()
        } catch (error) {
            console.error("Failed to save exam:", error)
            toast.error("Failed to save exam")
        } finally {
            setIsSaving(false)
        }
    }

    const nextMonth = () => {
        if (currentMonth) setCurrentMonth(addMonths(currentMonth, 1))
    }
    const prevMonth = () => {
        if (currentMonth) setCurrentMonth(subMonths(currentMonth, 1))
    }

    const renderHeader = () => {
        if (!currentMonth) return null
        return (
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg hover:bg-slate-100">
                            <ChevronLeft className="h-4 w-4 text-slate-600" />
                        </Button>
                        <div className="px-2 text-center min-w-[140px]">
                            <h2 className="text-sm font-bold text-slate-900">{format(currentMonth, "MMMM yyyy")}</h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg hover:bg-slate-100">
                            <ChevronRight className="h-4 w-4 text-slate-600" />
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => setCurrentMonth(new Date())} className="h-10 rounded-xl text-xs font-bold px-4 border-slate-200 hover:bg-slate-50 hover:text-emerald-600 transition-all">
                        Today
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search exams..."
                            className="pl-10 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-64 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-emerald-600">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    const renderDays = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return (
            <div className="grid grid-cols-7 mb-2 px-1">
                {days.map((day, index) => (
                    <div key={index} className="text-left pl-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
        )
    }

    const renderCalendar = () => {
        if (!currentMonth) return null
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

        return (
            <div className="flex-1 grid grid-cols-7 grid-rows-[repeat(auto-fit,minmax(0,1fr))] gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {calendarDays.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, monthStart)
                    const isToday = isSameDay(day, new Date())
                    const formattedDate = format(day, "d")

                    // Find exams for this day
                    const dayExams = exams.filter(exam => {
                        if (!exam.startDate || !exam.endDate) return false;
                        try {
                            const start = parseISO(exam.startDate)
                            const end = parseISO(exam.endDate)

                            // Check if day matches start or end date (ignoring time)
                            if (isSameDay(day, start)) return true;
                            if (isSameDay(day, end)) return true;

                            // Check if day is within the interval
                            if (start <= end) {
                                return isWithinInterval(day, { start, end })
                            }
                            return false;
                        } catch (e) {
                            console.error("Error checking exam date:", exam, e);
                            return false;
                        }
                    })

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "relative flex flex-col group transition-colors min-h-0",
                                !isCurrentMonth ? "bg-slate-50/50" : "bg-white hover:bg-slate-50/50",
                                isToday && dayExams.length === 0 && "bg-emerald-50/30"
                            )}
                            onClick={() => {
                                // Optional: Select day or show day view
                            }}
                        >
                            {dayExams.length === 0 && (
                                <div className="flex justify-between items-start p-2">
                                    <span className={cn(
                                        "text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full transition-all",
                                        isToday
                                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                                            : isCurrentMonth ? "text-slate-700 group-hover:bg-slate-200/50" : "text-slate-300"
                                    )}>
                                        {formattedDate}
                                    </span>
                                </div>
                            )}

                            {dayExams.length > 0 && (
                                <div className="absolute inset-0 flex flex-col">
                                    {dayExams.map((exam, idx) => (
                                        <div
                                            key={`${exam.id}-${idx}`}
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation()
                                                setSelectedExam(exam)
                                            }}
                                            className={cn(
                                                "flex-1 flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:brightness-110 hover:scale-[1.02] shadow-sm",
                                                // Alternating gradient colors - New Palette
                                                idx % 2 === 0
                                                    ? "bg-gradient-to-br from-violet-600 to-teal-700"
                                                    : "bg-gradient-to-br from-pink-600 to-rose-700",
                                                // Status overrides
                                                exam.status === "Completed" && "bg-gradient-to-br from-slate-600 to-gray-700",
                                                exam.status === "In Progress" && "bg-gradient-to-br from-amber-500 to-orange-600"
                                            )}
                                        >
                                            <span className="text-xs font-black text-white text-center leading-tight line-clamp-2 drop-shadow-sm">
                                                {exam.name}
                                            </span>
                                            <span className="text-[10px] text-white/90 font-bold mt-0.5">
                                                {exam.className}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    if (!currentMonth) {
        return (
            <div className="flex h-screen bg-slate-50/50 overflow-hidden items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
                        <CalendarIcon className="h-6 w-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading Schedule...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-slate-50/50 overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col p-6 h-full overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Examination Schedule</h1>
                        <p className="text-sm text-slate-500 font-medium">Manage and track academic examinations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                            setIsCreateDialogOpen(open);
                            if (!open) {
                                setNewExam({ name: "", examTypeId: "", termId: "", classId: "", date: "", startTime: "", endTime: "", subjectId: "" });
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all">
                                    <Plus className="mr-2 h-4 w-4" /> Add Exam
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[420px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
                                <div className="px-5 pt-5 pb-4">
                                    <DialogHeader>
                                        <DialogTitle className="text-lg font-semibold text-slate-800">New Exam</DialogTitle>
                                        <DialogDescription className="text-slate-500 text-sm">
                                            Fill in the exam details below
                                        </DialogDescription>
                                    </DialogHeader>
                                </div>
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
                                            <SelectContent>
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
                                            <SelectContent>
                                                {allClasses.map(c => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={newExam.subjectId} onValueChange={(v) => setNewExam({ ...newExam, subjectId: v })}>
                                            <SelectTrigger className="h-10 rounded-lg border-slate-200 text-sm">
                                                <SelectValue placeholder="Subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allSubjects.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input
                                        type="date"
                                        className="h-10 rounded-lg border-slate-200 text-sm"
                                        value={newExam.date}
                                        onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="relative">
                                            <Input
                                                type="time"
                                                className="h-10 rounded-lg border-slate-200 text-sm pl-3"
                                                value={newExam.startTime}
                                                onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">START</span>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="time"
                                                className="h-10 rounded-lg border-slate-200 text-sm pl-3"
                                                value={newExam.endTime}
                                                onChange={(e) => setNewExam({ ...newExam, endTime: e.target.value })}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">END</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 rounded-lg w-full h-10 text-sm font-medium mt-2"
                                        onClick={handleSaveExam}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Create Exam
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm m-1">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
                                <CalendarIcon className="h-6 w-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest animate-pulse">Synchronizing Schedule...</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-slate-200 shadow-sm p-4">
                        {renderHeader()}
                        {renderDays()}
                        {renderCalendar()}
                    </div>
                )}
            </div>


            {/* Side Panel */}
            <AnimatePresence>
                {
                    selectedExam && (
                        <>
                            <div
                                onClick={() => setSelectedExam(null)}
                                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
                            />
                            <div
                                className="fixed right-0 top-0 bottom-0 w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
                            >
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <Info className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Exam Details</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedExam.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedExam(null)} className="rounded-full hover:bg-emerald-50 hover:text-emerald-600">
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                    {/* Header Info */}
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedExam.name}</h2>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge className={cn(
                                                "rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                                                selectedExam.status === "In Progress"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : selectedExam.status === "Completed"
                                                        ? "bg-slate-100 text-slate-600 border-slate-200"
                                                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            )}>
                                                {selectedExam.status}
                                            </Badge>
                                            <Badge variant="outline" className="rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-slate-200 text-slate-500">
                                                {selectedExam.termName}
                                            </Badge>
                                            <Badge variant="outline" className="rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-slate-200 text-slate-500">
                                                {selectedExam.className}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> Duration
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Starts</p>
                                                <p className="text-sm font-bold text-slate-900">{format(parseISO(selectedExam.startDate), "MMM d, yyyy HH:mm")}</p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ends</p>
                                                <p className="text-sm font-bold text-slate-900">{format(parseISO(selectedExam.endDate), "MMM d, yyyy HH:mm")}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subjects */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <BookOpen className="h-3 w-3" /> Subjects Included
                                        </h4>
                                        <div className="grid gap-3">
                                            {selectedExam.subjects.map((subject, idx) => (
                                                <div
                                                    key={subject.id}
                                                    className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                                                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600">{idx + 1}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{subject.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">{subject.code}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-[9px] font-bold border-slate-100 text-slate-400">Core</Badge>
                                                </div>
                                            ))}
                                            {selectedExam.subjects.length === 0 && (
                                                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-xs text-slate-400 font-medium italic">No subjects assigned to this exam</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                                    <Button className="w-full bg-slate-900 hover:bg-emerald-600 text-white rounded-xl h-12 font-bold shadow-lg shadow-slate-900/10 transition-all">
                                        Generate Marksheets
                                    </Button>
                                </div>
                            </div>
                        </>
                    )
                }
            </AnimatePresence >
        </div >
    )
}

