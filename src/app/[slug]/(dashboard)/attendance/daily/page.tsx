"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, FileSpreadsheet, FileText, Filter, Loader2, Save, Search, Users, XCircle } from 'lucide-react';
import { exportToCSV, cn } from "@/lib/utils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { attendanceActions, streamActions, classActions, termActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"

interface AttendanceStudent {
    id: number
    name: string
    studentId: string
    image: string
    status: string
}

interface AttendanceDataStudent {
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

interface RawTerm {
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

export default function DailyAttendancePage() {
    const { confirm } = useConfirm()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [streams, setStreams] = useState<RawStream[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [activeTerm, setActiveTerm] = useState<RawTerm | null>(null)
    const [selectedStreamId, setSelectedStreamId] = useState<string>("")
    const [attendance, setAttendance] = useState<AttendanceStudent[]>([])
    const [currentDate, setCurrentDate] = useState(new Date())

    useEffect(() => {
        fetchClassesAndStreams()
    }, [])

    useEffect(() => {
        if (selectedStreamId) {
            fetchStudentsForAttendance()
        }
    }, [selectedStreamId, currentDate])

    const fetchClassesAndStreams = async () => {
        try {
            const [classesData, streamsData, term] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                termActions.getActive() as Promise<RawTerm>
            ])
            setClasses(classesData)
            setStreams(streamsData)
            setActiveTerm(term)
            setLoading(false)
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load classes and streams")
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

            // Fetch existing attendance for this date
            const existingAttendance = await attendanceActions.getByDate({
                date: currentDate.toISOString().split("T")[0],
                streamId: isClassSelection ? 0 : selectionId,
                termId: activeTerm?.id || 1
            })

            // Map students with attendance status
            const mappedStudents: AttendanceStudent[] = (students as AttendanceDataStudent[]).map((s) => {
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
        if (!selectedStreamId || attendance.length === 0) {
            toast.error("Please select a class and mark attendance")
            return
        }

        setSaving(true)
        try {
            const records = attendance.map(s => ({
                studentId: s.id,
                date: currentDate.toISOString().split("T")[0],
                status: s.status,
                termId: activeTerm?.id || 1,
                recordedBy: 1 // This should be current user ID
            }))

            await attendanceActions.save(records)
            toast.success(`Attendance saved for ${attendance.length} students`)
        } catch (error: unknown) {
            console.error("Failed to save attendance:", error)
            toast.error("Failed to save attendance")
        } finally {
            setSaving(false)
        }
    }

    const handleExportExcel = () => {
        if (attendance.length === 0) {
            toast.error("No data to export")
            return
        }
        const exportData = attendance.map(s => ({
            "Student Name": s.name,
            "Admission No": s.studentId,
            "Status": s.status,
            "Date": formatDate(currentDate)
        }))
        exportToCSV(exportData, `Daily_Attendance_${selectedStreamId}_${currentDate.toISOString().split('T')[0]}`)
        toast.success("Attendance exported to CSV")
    }

    const handleExportPdf = async () => {
        if (attendance.length === 0) {
            toast.error("No data to export")
            return
        }

        try {
            const profile = await schoolProfileActions.get()
            const doc = new jsPDF('p', 'mm', 'a4')
            const pageWidth = doc.internal.pageSize.getWidth()

            // Header
            doc.setFontSize(20)
            doc.setTextColor(5, 150, 105) // emerald-600
            doc.text(profile?.name || "School Nexus", pageWidth / 2, 20, { align: "center" })

            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139) // slate-500
            doc.text(`Daily Attendance Report - ${formatDate(currentDate)}`, pageWidth / 2, 28, { align: "center" })

            const tableColumn = ["#", "Student Name", "Admission No", "Status"]
            const tableRows = attendance.map((s, idx) => [
                idx + 1,
                s.name,
                s.studentId,
                s.status
            ])

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [5, 150, 105] }, // emerald-600
                styles: { fontSize: 9 }
            })

            doc.save(`Attendance_${formatDate(currentDate)}.pdf`)
            toast.success("Attendance exported to PDF")
        } catch (error: unknown) {
            console.error("PDF export failed:", error)
            toast.error("Failed to export to PDF")
        }
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    }

    const changeDate = (days: number) => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + days)
        setCurrentDate(newDate)
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

    const presentCount = attendance.filter(s => s.status === "Present").length
    const absentCount = attendance.filter(s => s.status === "Absent").length
    const lateCount = attendance.filter(s => s.status === "Late").length

    if (loading && !selectedStreamId) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Daily Attendance"
                    description="Mark and manage student attendance for the day."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Attendance", href: "/attendance" },
                        { label: "Daily" },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm h-11">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => changeDate(-1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="px-4 font-bold text-slate-700 flex items-center gap-2 text-sm whitespace-nowrap">
                                    <CalendarIcon className="h-4 w-4 text-emerald-500" />
                                    {formatDate(currentDate)}
                                </div>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => changeDate(1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {attendance.length > 0 && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handleExportExcel}
                                        className="bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm shadow-slate-200/50 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95"
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export CSV
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleExportPdf}
                                        className="bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm shadow-slate-200/50 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95"
                                    >
                                        <FileText className="h-4 w-4 text-emerald-600" /> Export PDF
                                    </Button>
                                    <Button
                                        onClick={handleSaveAttendance}
                                        disabled={saving}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        {saving ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                        ) : (
                                            <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    }
                />

                {/* Selection Bar */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 w-full space-y-2">
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
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Summary</label>
                            <div className="flex gap-4">
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1.5 rounded-xl font-bold">
                                    Present: {presentCount}
                                </Badge>
                                <Badge className="bg-red-50 text-red-700 border-red-100 px-3 py-1.5 rounded-xl font-bold">
                                    Absent: {absentCount}
                                </Badge>
                                <Badge className="bg-amber-50 text-amber-700 border-amber-100 px-3 py-1.5 rounded-xl font-bold">
                                    Late: {lateCount}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Table */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Student List</h3>
                                <p className="text-xs text-slate-500 font-medium">{attendance.length} Students</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
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
                        ) : attendance.length > 0 ? (
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="w-[300px] font-bold text-white h-12 border-r border-emerald-500/30">Student</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Student ID</TableHead>
                                        <TableHead className="text-center font-bold text-white border-r border-emerald-500/30">Attendance Status</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendance.map((student, idx) => (
                                        <TableRow key={student.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="py-4 border-r border-emerald-100/50">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                        <AvatarImage src={student.image} />
                                                        <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold">
                                                            {student.name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-slate-900">{student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-bold text-slate-500 border-r border-emerald-100/50">
                                                {student.studentId}
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
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
                                                        onClick={() => updateStatus(student.id, "Late")}
                                                        variant={student.status === "Late" ? "default" : "outline"}
                                                        className={cn(
                                                            "h-9 px-4 rounded-xl font-bold transition-all",
                                                            student.status === "Late"
                                                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                                                                : "border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200"
                                                        )}
                                                    >
                                                        <Clock className="mr-2 h-4 w-4" /> Late
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
                                            <TableCell className="text-right pr-6">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600">
                                                    <AlertCircle className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <Users className="h-12 w-12 mb-4 text-slate-300" />
                                <p className="font-medium">Select a class to view students</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer removed and moved to header */}
            </div>
        </div>
    )
}

