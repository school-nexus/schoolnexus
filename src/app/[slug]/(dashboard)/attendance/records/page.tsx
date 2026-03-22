"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    Filter,
    Download,
    Calendar,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    MoreHorizontal,
    FileSpreadsheet,
    Loader2
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { attendanceActions, classActions, streamActions, studentActions, termActions, examActions } from "@/lib/electron"
import { toast } from "sonner"

interface AttendanceRecord {
    id: number
    studentId: number
    date: string
    status: string
    studentName?: string
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

interface RawStudent {
    id: number
    firstName: string
    lastName: string
    streamId: number
}

interface RawTerm {
    id: number
    name: string
    isActive: boolean
}

interface RawExam {
    id: number
    name: string
    startDate: string
}

export default function AttendanceRecordsPage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [students, setStudents] = useState<RawStudent[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStream, setSelectedStream] = useState("")
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTerm, setActiveTerm] = useState<RawTerm | null>(null)
    const [attendanceType, setAttendanceType] = useState<'daily' | 'exam'>('daily')
    const [exams, setExams] = useState<RawExam[]>([])
    const [selectedExam, setSelectedExam] = useState("")

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [classData, streamData, studentData, term] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                studentActions.getAll() as Promise<RawStudent[]>,
                termActions.getActive() as Promise<RawTerm>
            ])
            setClasses(classData)
            setStreams(streamData)
            setStudents(studentData)
            setActiveTerm(term)
            const examsData = await examActions.getAll() as RawExam[]
            setExams(examsData)
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const loadRecords = async () => {
        if (!selectedStream) {
            toast.error("Please select a class/stream")
            return
        }
        setLoading(true)
        try {
            let dateToFetch = selectedDate
            if (attendanceType === 'exam' && selectedExam) {
                const exam = exams.find(e => e.id.toString() === selectedExam)
                if (exam) {
                    dateToFetch = exam.startDate.split('T')[0]
                }
            }

            const isClassSelection = selectedStream.startsWith('c:')
            const selectionId = parseInt(selectedStream.split(':')[1])

            const data = await attendanceActions.getByDate({
                date: dateToFetch,
                streamId: isClassSelection ? 0 : selectionId,
                termId: activeTerm?.id || 1
            }) as AttendanceRecord[]
            // Enrich with student names and filter
            const enriched = data.map((r) => {
                const student = students.find(s => s.id === r.studentId)
                return {
                    ...r,
                    studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown'
                }
            }).filter((r) => {
                const student = students.find(s => s.id === r.studentId)
                if (!student) return false

                if (isClassSelection) {
                    const stream = streams.find(s => s.id === student.streamId)
                    return stream && stream.classId === selectionId
                } else {
                    return student.streamId === selectionId
                }
            })
            setRecords(enriched)
        } catch (error: unknown) {
            console.error("Failed to load records:", error)
            toast.error("Failed to load attendance records")
        } finally {
            setLoading(false)
        }
    }

    const presentCount = records.filter(r => r.status === 'Present').length
    const absentCount = records.filter(r => r.status === 'Absent').length
    const lateCount = records.filter(r => r.status === 'Late').length

    const filteredRecords = records.filter(r =>
        r.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getClassName = (streamId: string) => {
        const isClass = streamId.startsWith('c:')
        const selectionId = parseInt(streamId.split(':')[1])
        if (isClass) {
            const cls = classes.find(c => c.id === selectionId)
            return cls?.name || ""
        }
        const stream = streams.find(s => s.id === selectionId)
        if (!stream) return ""
        const cls = classes.find(c => c.id === stream.classId)
        return `${cls?.name || ''} ${stream.name}`
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
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title="Attendance Records"
                        description="View historical attendance records by date and class."
                        breadcrumbs={[
                            { label: "Attendance", href: "/attendance" },
                            { label: "Records" },
                        ]}
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Type</label>
                            <Select value={attendanceType} onValueChange={(v: 'daily' | 'exam') => setAttendanceType(v)}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent side="bottom" avoidCollisions={false}>
                                    <SelectItem value="daily">Daily Attendance</SelectItem>
                                    <SelectItem value="exam">Exam Attendance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {attendanceType === 'daily' ? (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Class/Stream</label>
                                <Select value={selectedStream} onValueChange={setSelectedStream}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
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
                                                                            value={`s:${s.id}`}
                                                                            className="text-sm text-slate-600 cursor-pointer rounded px-3 py-1.5 focus:bg-slate-100 w-[100px] justify-center"
                                                                        >
                                                                            {s.name}
                                                                        </SelectItem>
                                                                    ))}
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
                        ) : (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Exam</label>
                                <Select value={selectedExam} onValueChange={setSelectedExam}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select Exam" />
                                    </SelectTrigger>
                                    <SelectContent side="bottom" avoidCollisions={false}>
                                        {exams.map(e => (
                                            <SelectItem key={e.id} value={e.id.toString()}>
                                                {e.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="md:col-span-2 flex items-end">
                            <Button onClick={loadRecords} className="w-full h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold">
                                <Filter className="h-4 w-4 mr-2" /> Load Records
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Records Table */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by student name..."
                                className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {selectedStream && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-2">
                                {getClassName(selectedStream)} - {selectedDate}
                            </Badge>
                        )}
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="font-bold text-white h-12 w-16 text-center border-r border-emerald-500/30">#</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Student Name</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Date</TableHead>
                                        <TableHead className="font-bold text-white">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRecords.length > 0 ? filteredRecords.map((record, idx) => (
                                        <TableRow key={record.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="text-center font-mono text-slate-500 border-r border-emerald-100/50">{idx + 1}</TableCell>
                                            <TableCell className="font-bold text-slate-900 border-r border-emerald-100/50">{record.studentName}</TableCell>
                                            <TableCell className="text-slate-600 border-r border-emerald-100/50">{record.date}</TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                    record.status === 'Present' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                        record.status === 'Absent' ? "bg-red-50 text-red-700 border-red-100" :
                                                            "bg-amber-50 text-amber-700 border-amber-100"
                                                )}>
                                                    {record.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-slate-400 border-emerald-100/50">
                                                {records.length === 0
                                                    ? "Select a class and date, then click 'Load Records'"
                                                    : "No records match your search"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}

