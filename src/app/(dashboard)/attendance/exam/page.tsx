"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    Calendar as CalendarIcon,
    CheckCircle2,
    XCircle,
    Users,
    Save,
    Loader2,
    FileText,
    ClipboardCheck
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { attendanceActions, streamActions, classActions, examActions, termActions, subjectActions, academicYearActions } from "@/lib/electron"
import { toast } from "sonner"

interface ExamAttendanceStudent {
    id: number
    name: string
    studentId: string
    image: string
    status: string
}

interface ExamAttendanceDataStudent {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
    photoUrl?: string
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

interface RawExam {
    id: number
    examTypeId: number
    termId: number
    startDate: string
    subjects?: { id: number }[]
}

interface RawExamType {
    id: number
    name: string
}

interface RawTerm {
    id: number
    name: string
    isActive: boolean
}

interface RawSubject {
    id: number
    name: string
}

interface RawAcademicYear {
    id: number
    name: string
    isActive: boolean
}

interface RawAttendance {
    id: number
    studentId: number
    status: string
    date: string
}

export default function ExamAttendancePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [streams, setStreams] = useState<RawStream[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [exams, setExams] = useState<RawExam[]>([])
    const [examTypes, setExamTypes] = useState<RawExamType[]>([])
    const [terms, setTerms] = useState<RawTerm[]>([])
    const [subjects, setSubjects] = useState<RawSubject[]>([])
    const [activeTerm, setActiveTerm] = useState<RawTerm | null>(null)
    const [selectedStreamId, setSelectedStreamId] = useState<string>("")
    const [selectedExamId, setSelectedExamId] = useState<string>("")
    const [selectedTermId, setSelectedTermId] = useState<string>("")
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")
    const [attendance, setAttendance] = useState<ExamAttendanceStudent[]>([])
    const [currentDate] = useState(new Date())
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (selectedExamId) {
            const exam = exams.find(e => e.id === parseInt(selectedExamId))
            if (exam) {
                const matchesTerm = !selectedTermId || exam.termId === parseInt(selectedTermId)
                const matchesSubject = !selectedSubjectId || (exam.subjects && exam.subjects.some((s: { id: number }) => s.id === parseInt(selectedSubjectId)))
                if (!matchesTerm || !matchesSubject) {
                    setSelectedExamId("")
                }
            }
        }
    }, [selectedTermId, selectedSubjectId, exams])

    useEffect(() => {
        if (selectedStreamId && selectedExamId) {
            fetchStudentsForAttendance()
        }
    }, [selectedStreamId, selectedExamId])

    const fetchInitialData = async () => {
        try {
            const [classesData, streamsData, examsData, examTypesData, activeTermData, allSubjects, academicYears] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                examActions.getAll() as Promise<RawExam[]>,
                examActions.getTypes() as Promise<RawExamType[]>,
                termActions.getActive() as Promise<RawTerm>,
                subjectActions.getAll() as Promise<RawSubject[]>,
                academicYearActions.getAll() as Promise<RawAcademicYear[]>
            ])
            setClasses(classesData)
            setStreams(streamsData)
            setExams(examsData)
            setExamTypes(examTypesData)
            setActiveTerm(activeTermData)
            setSubjects(allSubjects)

            const activeYear = academicYears.find(y => y.isActive)
            if (activeYear) {
                const termData = await termActions.getByYear(activeYear.id)
                setTerms(termData)
                if (activeTermData) {
                    setSelectedTermId(activeTermData.id.toString())
                } else if (termData.length > 0) {
                    const activeInYear = termData.find(t => t.isActive) || termData[0]
                    setSelectedTermId(activeInYear.id.toString())
                }
            }

            setLoading(false)
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load data")
            setLoading(false)
        }
    }

    const fetchStudentsForAttendance = async () => {
        setLoading(true)
        try {
            const isClassSelection = selectedStreamId.startsWith('c:')
            const selectionId = parseInt(selectedStreamId.split(':')[1] || selectedStreamId)

            let students = []
            if (isClassSelection) {
                const classStreams = streams.filter(s => s.classId === selectionId)
                const studentsPromises = classStreams.map(s => attendanceActions.getStudentsForAttendance(s.id))
                const studentsResults = await Promise.all(studentsPromises)
                students = studentsResults.flat()
            } else {
                students = await attendanceActions.getStudentsForAttendance(selectionId)
            }

            // For exam attendance, we'll use the exam date or current date
            const selectedExam = exams.find(e => e.id === parseInt(selectedExamId))
            const examDate = selectedExam?.startDate || currentDate.toISOString().split("T")[0]

            // Fetch existing attendance for this exam date
            const existingAttendance = await attendanceActions.getByDate({
                date: examDate,
                streamId: isClassSelection ? 0 : selectionId,
                termId: activeTerm?.id || 1
            })

            const mappedStudents: ExamAttendanceStudent[] = (students as ExamAttendanceDataStudent[]).map((s) => {
                const existing = (existingAttendance as RawAttendance[]).find((a) => a.studentId === s.id)
                return {
                    id: s.id,
                    name: `${s.firstName} ${s.lastName}`,
                    studentId: s.admissionNumber,
                    image: s.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.firstName}`,
                    status: existing?.status || "Present"
                }
            })

            setAttendance(mappedStudents)
        } catch (error: unknown) {
            console.error("Failed to fetch students:", error)
            toast.error("Failed to load students")
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = (id: number, newStatus: string) => {
        setAttendance(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
    }

    const handleSaveAttendance = async () => {
        if (!selectedStreamId || !selectedExamId || attendance.length === 0) {
            toast.error("Please select an exam and class first")
            return
        }

        setSaving(true)
        try {
            const selectedExam = exams.find(e => e.id === parseInt(selectedExamId))
            const examDate = selectedExam?.startDate || currentDate.toISOString().split("T")[0]

            const records = attendance.map(s => ({
                studentId: s.id,
                date: examDate,
                status: s.status,
                termId: activeTerm?.id || 1,
                recordedBy: 1
            }))

            await attendanceActions.save(records)
            toast.success(`Exam attendance saved for ${attendance.length} students`)
        } catch (error: unknown) {
            console.error("Failed to save attendance:", error)
            toast.error("Failed to save attendance")
        } finally {
            setSaving(false)
        }
    }

    const getStreamOptions = () => {
        return streams.map(stream => {
            const cls = classes.find(c => c.id === stream.classId)
            return {
                id: stream.id.toString(),
                label: `${cls?.name || 'Unknown'} - ${stream.name}`
            }
        })
    }

    const getExamName = (examId: string) => {
        const exam = exams.find(e => e.id === parseInt(examId))
        if (!exam) return ""
        const examType = examTypes.find(t => t.id === exam.examTypeId)
        return examType?.name || "Exam"
    }

    const presentCount = attendance.filter(s => s.status === "Present").length
    const absentCount = attendance.filter(s => s.status === "Absent").length

    const filteredAttendance = attendance.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading && streams.length === 0) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title="Exam Attendance"
                        description="Record student attendance for examinations."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Attendance", href: "/attendance" },
                            { label: "Exam" },
                        ]}
                    />
                </div>

                {/* Selection Bar */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Term</label>
                            <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent>
                                    {terms.map(term => (
                                        <SelectItem key={term.id} value={term.id.toString()}>{term.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all">
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject.id} value={subject.id.toString()}>{subject.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Name</label>
                            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all">
                                    <SelectValue placeholder="Select Exam" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.filter(exam => {
                                        const matchesTerm = !selectedTermId || exam.termId === parseInt(selectedTermId)
                                        const matchesSubject = !selectedSubjectId || (exam.subjects && exam.subjects.some((s: { id: number }) => s.id === parseInt(selectedSubjectId)))
                                        return matchesTerm && matchesSubject
                                    }).map(exam => {
                                        const examType = examTypes.find(t => t.id === exam.examTypeId)
                                        return (
                                            <SelectItem key={exam.id} value={exam.id.toString()}>
                                                {examType?.name || 'Exam'} - {exam.startDate}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Class</label>
                            <Select value={selectedStreamId} onValueChange={setSelectedStreamId}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent side="bottom" avoidCollisions={false} className="min-w-fit max-h-[var(--radix-select-content-available-height)] p-0">
                                    <div className="flex flex-row overflow-x-auto">
                                        {Array.from({ length: Math.ceil(classes.length / 5) }).map((_, colIndex) => (
                                            <div key={colIndex} className="flex flex-col border-r border-slate-100 last:border-0 w-fit">
                                                {classes.slice(colIndex * 5, (colIndex + 1) * 5).map(cls => {
                                                    const classStreams = streams.filter(s => s.classId === cls.id)
                                                    return (
                                                        <div key={cls.id} className="flex items-center border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                                                            <div className="w-[132px] shrink-0 border-r border-slate-100/50">
                                                                <SelectItem
                                                                    value={`c:${cls.id}`}
                                                                    className="font-bold text-emerald-700 text-sm uppercase tracking-tight cursor-pointer py-2.5 pl-3 pr-3 focus:bg-emerald-50 w-auto"
                                                                >
                                                                    {cls.name}
                                                                </SelectItem>
                                                            </div>
                                                            <div className="flex gap-2 p-2 items-center overflow-x-auto no-scrollbar">
                                                                {classStreams.map(s => (
                                                                    <SelectItem
                                                                        key={s.id}
                                                                        value={s.id.toString()}
                                                                        className="text-sm text-slate-600 cursor-pointer rounded px-3 py-1.5 focus:bg-slate-100 w-[100px] justify-center"
                                                                    >
                                                                        {s.name}
                                                                    </SelectItem>
                                                                ))}
                                                                {classStreams.length === 0 && (
                                                                    <span className="text-sm text-slate-400 italic px-4">No streams</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Summary</label>
                            <div className="flex gap-4 pt-1">
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1.5 rounded-xl font-bold">
                                    Present: {presentCount}
                                </Badge>
                                <Badge className="bg-red-50 text-red-700 border-red-100 px-3 py-1.5 rounded-xl font-bold">
                                    Absent: {absentCount}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Table */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-100">
                                <ClipboardCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Student List</h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    {selectedExamId ? getExamName(selectedExamId) : "Select an exam"} • {attendance.length} Students
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search students..."
                                    className="pl-10 h-10 w-64 rounded-xl border-slate-200 bg-slate-50/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 text-slate-600"
                                onClick={() => setAttendance(prev => prev.map(s => ({ ...s, status: "Present" })))}
                            >
                                Mark All Present
                            </Button>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : filteredAttendance.length > 0 ? (
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="w-[300px] font-bold text-white h-12 border-r border-emerald-500/30">Student</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Student ID</TableHead>
                                        <TableHead className="text-center font-bold text-white">Attendance Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAttendance.map((student, idx) => (
                                        <TableRow key={student.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="py-4 border-r border-emerald-100/50">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                        <AvatarImage src={student.image} />
                                                        <AvatarFallback className="bg-teal-50 text-teal-600 font-bold">
                                                            {student.name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-slate-900">{student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-bold text-slate-500 border-r border-emerald-100/50">
                                                {student.studentId}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        onClick={() => updateStatus(student.id, "Present")}
                                                        variant={student.status === "Present" ? "default" : "outline"}
                                                        className={cn(
                                                            "h-9 px-4 rounded-xl font-bold transition-all",
                                                            student.status === "Present"
                                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                                                                : "border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200"
                                                        )}
                                                    >
                                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Present
                                                    </Button>
                                                    <Button
                                                        onClick={() => updateStatus(student.id, "Absent")}
                                                        variant={student.status === "Absent" ? "default" : "outline"}
                                                        className={cn(
                                                            "h-9 px-4 rounded-xl font-bold transition-all",
                                                            student.status === "Absent"
                                                                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                                                                : "border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200"
                                                        )}
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" /> Absent
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <FileText className="h-12 w-12 mb-4 text-slate-300" />
                                <p className="font-medium">
                                    {!selectedExamId || !selectedStreamId
                                        ? "Select an exam and class to view students"
                                        : "No students found"}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Actions */}
                {attendance.length > 0 && (
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50">
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                            <CalendarIcon className="h-4 w-4" />
                            {selectedExamId ? getExamName(selectedExamId) : "No exam selected"}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 text-slate-600">
                                Discard Changes
                            </Button>
                            <Button
                                onClick={handleSaveAttendance}
                                disabled={saving}
                                className="bg-teal-600 text-white hover:bg-teal-700 h-11 px-8 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                            >
                                {saving ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><Save className="mr-2 h-4 w-4" /> Save Attendance</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

