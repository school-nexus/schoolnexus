"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, BookOpen, CheckCircle2, ChevronDown, Download, FileSpreadsheet, Filter, History, Loader2, MoreHorizontal, Save, Search, Upload, Users } from 'lucide-react';
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
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { studentActions, examActions, classActions, streamActions, subjectActions, marksActions, schoolProfileActions } from "@/lib/electron"
import { calculateGrade } from "@/lib/reportCardUtils"
import { toast } from "sonner"

interface RawClass {
    id: number
    name: string
}

interface RawStream {
    id: number
    name: string
    classId: number
}

interface RawSubject {
    id: number
    name: string
    code: string
}

interface RawExam {
    id: number
    name: string
    subjects: { id: number }[]
}

interface RawMark {
    id: number
    studentId: number
    examId: number
    subjectId: number
    score: number
}

interface Student {
    id: number
    admissionNumber: string
    firstName: string
    lastName: string
    streamId: number | null
}

export default function MarkEntryPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [subjects, setRawSubjects] = useState<RawSubject[]>([]) // Renamed to avoid confusion with subject selection
    const [exams, setExams] = useState<RawExam[]>([])
    const [marks, setMarks] = useState<Record<number, number>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [selectedStream, setSelectedStream] = useState("")
    const [selectedSubject, setSelectedSubject] = useState("")
    const [selectedExam, setSelectedExam] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [classData, streamData, subjectData, examData] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                subjectActions.getAll() as Promise<RawSubject[]>,
                examActions.getAll() as Promise<RawExam[]>
            ])
            setClasses(classData)
            setStreams(streamData)
            setRawSubjects(subjectData)
            setExams(examData)
        } catch (error: unknown) {
            console.error("Failed to fetch initial data:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const loadStudents = async () => {
        if (!selectedStream) {
            toast.error("Please select a class/stream")
            return
        }
        setLoading(true)
        try {
            const isClassSelection = selectedStream.startsWith('c:')
            const selectionId = parseInt(selectedStream.split(':')[1] || selectedStream)

            const allStudents = await studentActions.getAll() as Student[]
            const filtered = allStudents.filter((s: Student) => {
                if (isClassSelection) {
                    const stream = streams.find(st => st.id === s.streamId)
                    return stream && stream.classId === selectionId
                } else {
                    return s.streamId === selectionId
                }
            })
            setStudents(filtered)

            // Load existing marks if exam and subject selected
            if (selectedExam && selectedSubject) {
                const existingMarks = await marksActions.getByExamSubject({
                    examId: parseInt(selectedExam),
                    subjectId: parseInt(selectedSubject)
                }) as RawMark[]
                const marksMap: Record<number, number> = {}
                existingMarks.forEach((m) => {
                    marksMap[m.studentId] = m.score
                })
                setMarks(marksMap)
            } else {
                setMarks({})
            }
        } catch (error: unknown) {
            console.error("Failed to load students:", error)
            toast.error("Failed to load students")
        } finally {
            setLoading(false)
        }
    }

    const handleMarkChange = (studentId: number, value: string) => {
        const score = Math.min(Math.max(parseInt(value) || 0, 0), 100)
        setMarks(prev => ({ ...prev, [studentId]: score }))
    }

    const saveMarks = async () => {
        if (!selectedExam || !selectedSubject) {
            toast.error("Please select exam and subject")
            return
        }
        setSaving(true)
        try {
            const marksData = students.map(s => ({
                studentId: s.id,
                subjectId: parseInt(selectedSubject),
                examId: parseInt(selectedExam),
                score: marks[s.id] || 0
            }))
            await marksActions.save(marksData)
            toast.success("Marks saved successfully!")
        } catch (error: unknown) {
            console.error("Failed to save marks:", error)
            toast.error("Failed to save marks")
        } finally {
            setSaving(false)
        }
    }

    const enteredCount = Object.values(marks).filter(m => m > 0).length
    const avgScore = students.length > 0
        ? Math.round(Object.values(marks).reduce((a, b) => a + b, 0) / Math.max(enteredCount, 1))
        : 0
    const highestScore = Math.max(...Object.values(marks), 0)

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const XLSX = await import("xlsx")
        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: "binary" })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws) as any[]

                if (data.length === 0) {
                    toast.error("The Excel file is empty")
                    return
                }

                // Map data to students
                const newMarks = { ...marks }
                let importedCount = 0
                let notFoundCount = 0
                const notFoundAdmissions: string[] = []

                data.forEach((row) => {
                    const admissionNumber = row["Admission Number"] || row["admissionNumber"] || row["ID"] || row["Admission No"]
                    const score = row["Mark"] || row["Score"] || row["mark"] || row["score"]

                    if (admissionNumber && score !== undefined) {
                        const student = students.find(s => s.admissionNumber === admissionNumber.toString())
                        if (student) {
                            const parsedScore = Math.min(Math.max(parseInt(score) || 0, 0), 100)
                            newMarks[student.id] = parsedScore
                            importedCount++
                        } else {
                            notFoundCount++
                            notFoundAdmissions.push(admissionNumber.toString())
                        }
                    }
                })

                setMarks(newMarks)

                if (notFoundCount > 0) {
                    toast.warning(`Imported ${importedCount} marks. ${notFoundCount} students not found in current list.`, {
                        description: `Missing: ${notFoundAdmissions.slice(0, 3).join(", ")}${notFoundAdmissions.length > 3 ? "..." : ""}`
                    })
                } else {
                    toast.success(`Successfully imported ${importedCount} marks!`)
                }
            } catch (error: unknown) {
                console.error("Failed to parse Excel:", error)
                toast.error("Failed to parse Excel file. Please ensure it follows the correct format.")
            }
        }
        reader.readAsBinaryString(file)
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleDownloadTemplate = async () => {
        if (students.length === 0) {
            toast.error("Please load students first to generate a template.")
            return
        }

        try {
            const XLSX = await import("xlsx")
            const templateData = students.map(s => ({
                "Admission Number": s.admissionNumber,
                "Student Name": `${s.firstName} ${s.lastName}`,
                "Mark": marks[s.id] || ""
            }))

            const ws = XLSX.utils.json_to_sheet(templateData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Marks Template")

            // Auto-size columns
            const colWidths = [
                { wch: 20 }, // Admission Number
                { wch: 30 }, // Student Name
                { wch: 10 }, // Mark
            ]
            ws["!cols"] = colWidths

            const fileName = `Marks_Template_${selectedStream ? streams.find(s => s.id === parseInt(selectedStream))?.name : "Class"}.xlsx`
            XLSX.writeFile(wb, fileName)
            toast.success("Template downloaded successfully!")
        } catch (error: unknown) {
            console.error("Failed to download template:", error)
            toast.error("Failed to generate template.")
        }
    }

    const handleDownloadReport = async () => {
        if (students.length === 0) {
            toast.error("No data to download. Please load students first.")
            return
        }

        try {
            const XLSX = await import("xlsx")
            const reportData = students.map((s, idx) => ({
                "No.": idx + 1,
                "Admission Number": s.admissionNumber,
                "Student Name": `${s.firstName} ${s.lastName}`,
                "Score": marks[s.id] || 0,
                "Status": marks[s.id] ? "Entered" : "Pending"
            }))

            const ws = XLSX.utils.json_to_sheet(reportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Marks Report")

            // Add Summary Info
            XLSX.utils.sheet_add_aoa(ws, [
                [""],
                ["Performance Summary"],
                ["Average Score", avgScore],
                ["Highest Score", highestScore],
                ["Total Students", students.length],
                ["Marks Entered", enteredCount]
            ], { origin: -1 })

            // Auto-size columns
            ws["!cols"] = [
                { wch: 5 },  // No.
                { wch: 20 }, // Admission Number
                { wch: 30 }, // Student Name
                { wch: 10 }, // Score
                { wch: 12 }, // Status
            ]

            const streamName = selectedStream ? streams.find(s => s.id === parseInt(selectedStream))?.name : ""
            const subjectName = selectedSubject ? subjects.find(s => s.id === parseInt(selectedSubject))?.name : ""
            const examName = selectedExam ? exams.find(e => e.id === parseInt(selectedExam))?.name : ""

            const fileName = `Marks_Report_${streamName}_${subjectName}_${examName}.xlsx`.replace(/\s+/g, '_')
            XLSX.writeFile(wb, fileName)
            toast.success("Report downloaded successfully!")
        } catch (error: unknown) {
            console.error("Failed to download report:", error)
            toast.error("Failed to generate report.")
        }
    }

    const handleExportPdf = async () => {
        if (students.length === 0) {
            toast.error("No data to export. Please load students first.")
            return
        }

        try {
            const { default: jsPDF } = await import("jspdf")
            const { default: autoTable } = await import("jspdf-autotable")

            const profile = await schoolProfileActions.get() as { name: string, address: string, phone: string, email: string }
            const doc = new jsPDF('p', 'mm', 'a4')
            const pageWidth = doc.internal.pageSize.getWidth()

            // Add Header
            doc.setFontSize(22)
            doc.setTextColor(16, 185, 129) // Emerald-500
            doc.text(profile?.name || "School Nexus", pageWidth / 2, 15, { align: "center" })

            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139) // Slate-500
            doc.text(`${profile?.address || "P.O. Box 123, Kampala, Uganda"} | Tel: ${profile?.phone || "+256 772 123456"} | Email: ${profile?.email || "info@schoolnexus.com"}`, pageWidth / 2, 22, { align: "center" })

            // Report Details
            const streamName = selectedStream ? streams.find(s => s.id === parseInt(selectedStream))?.name : ""
            const className = selectedStream ? classes.find(c => c.id === streams.find(s => s.id === parseInt(selectedStream))?.classId)?.name : ""
            const subjectName = selectedSubject ? subjects.find(s => s.id === parseInt(selectedSubject))?.name : ""
            const examName = selectedExam ? exams.find(e => e.id === parseInt(selectedExam))?.name : ""
            const date = new Date().toLocaleDateString()

            doc.setDrawColor(226, 232, 240) // Slate-200
            doc.line(20, 25, pageWidth - 20, 25)

            doc.setFontSize(12)
            doc.setTextColor(30, 41, 59) // Slate-800
            doc.text(`OFFICIAL MARKS REPORT`, pageWidth / 2, 32, { align: "center" })

            doc.setFontSize(10)
            doc.text(`Class: ${className} ${streamName}`, 20, 40)
            doc.text(`Subject: ${subjectName}`, 80, 40)
            doc.text(`Exam: ${examName}`, 20, 46)
            doc.text(`Date: ${date}`, pageWidth - 50, 46)

            // Prepare table data
            const tableColumn = ["#", "Admission No", "Student Name", "Score", "Status"]
            const tableRows = students.map((student, idx) => [
                idx + 1,
                student.admissionNumber,
                `${student.firstName} ${student.lastName}`,
                marks[student.id] || 0,
                marks[student.id] ? "Entered" : "Pending"
            ])

            // Generate Table
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 52,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 80, halign: 'left' },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 25 },
                },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            })

            // Add Summary Info
            const lastTable = (doc as any).lastAutoTable as { finalY: number }
            const finalY = lastTable ? lastTable.finalY : 100

            doc.setFontSize(11)
            doc.setTextColor(30, 41, 59)
            doc.text("Performance Summary", 20, finalY + 15)

            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139)
            doc.text(`Average Score: ${avgScore}`, 20, finalY + 22)
            doc.text(`Highest Score: ${highestScore}`, 20, finalY + 28)
            doc.text(`Total Students: ${students.length}`, 80, finalY + 22)
            doc.text(`Marks Entered: ${enteredCount}`, 80, finalY + 28)

            // Add Footer
            doc.setFontSize(9)
            doc.setTextColor(148, 163, 184)
            doc.text(`Generated by ${profile?.name || "School Nexus"} Management System`, pageWidth / 2, 285, { align: "center" })

            const fileName = `Marks_Report_${streamName}_${subjectName}_${examName}.pdf`.replace(/\s+/g, '_')
            doc.save(fileName)
            toast.success("PDF report downloaded successfully!")
        } catch (error: unknown) {
            console.error("PDF Export failed:", error)
            toast.error("Failed to export PDF report")
        }
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
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-6">
                <PageHeader
                    title="Mark Entry"
                    description="Enter and manage student marks for various examinations."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Examinations", href: "/exams" },
                        { label: "Mark Entry" },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={handleImportExcel}
                            />
                            <Button
                                variant="outline"
                                className="h-11 px-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                onClick={handleDownloadTemplate}
                                disabled={students.length === 0}
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" /> Template
                            </Button>
                            <Button
                                variant="outline"
                                className="h-11 px-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={students.length === 0}
                            >
                                <Upload className="h-4 w-4 mr-2 text-teal-600" /> Import Excel
                            </Button>
                            <Button
                                onClick={saveMarks}
                                disabled={saving || students.length === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                            >
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save All Marks
                            </Button>
                        </div>
                    }
                />

                {/* Selection Bar */}
                <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Subject</label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Exam</label>
                            <Select value={selectedExam} onValueChange={setSelectedExam}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue placeholder="Select Exam" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Filter exams based on selected subject */}
                                    {exams.filter(e => {
                                        // If no subject is selected, show all exams
                                        if (!selectedSubject) return true

                                        // If exam has no specific subjects (global exam), show it
                                        if (!e.subjects || e.subjects.length === 0) return true

                                        // If exam has subjects, check if selected subject is one of them
                                        return e.subjects.some((s) => s.id === parseInt(selectedSubject))
                                    }).map(e => (
                                        <SelectItem key={e.id} value={e.id.toString()}>{e.name || `Exam #${e.id}`}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={loadStudents} className="w-full h-11 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-bold shadow-lg shadow-slate-200/50 border-none transition-all duration-300">
                                <Filter className="h-4 w-4 mr-2" /> Load Students
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Main Entry Table (8 columns) */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                            <CardHeader className="border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900">Student List</CardTitle>
                                    <CardDescription>Enter marks for students</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">{enteredCount}/{students.length} Entered</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table className="border-collapse">
                                    <TableHeader className="bg-emerald-600">
                                        <TableRow className="hover:bg-transparent border-emerald-500/30">
                                            <TableHead className="font-bold text-white h-12 w-16 text-center border-r border-emerald-500/30">#</TableHead>
                                            <TableHead className="font-bold text-white border-r border-emerald-500/30">Student Name</TableHead>
                                            <TableHead className="font-bold text-white w-32 text-center border-r border-emerald-500/30">Score</TableHead>
                                            <TableHead className="font-bold text-white">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.length > 0 ? students.map((student, idx) => (
                                            <TableRow key={student.id} className={cn(
                                                "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                                idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                            )}>
                                                <TableCell className="text-center font-mono text-slate-500 border-r border-emerald-100/50">{idx + 1}</TableCell>
                                                <TableCell className="border-r border-emerald-100/50">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{student.firstName} {student.lastName}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{student.admissionNumber}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border-r border-emerald-100/50">
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <Input
                                                            value={marks[student.id] || ""}
                                                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                            placeholder="0"
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className="h-10 text-center font-bold rounded-lg border-slate-200 focus:ring-2 focus:ring-emerald-500/20 bg-white w-20"
                                                        />
                                                        {marks[student.id] !== undefined && marks[student.id] !== null && (
                                                            <div className={cn(
                                                                "h-10 w-10 flex items-center justify-center rounded-lg font-black border text-sm",
                                                                calculateGrade(marks[student.id]).startsWith('D') ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                    calculateGrade(marks[student.id]).startsWith('C') ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                        calculateGrade(marks[student.id]).startsWith('P') ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                            "bg-red-50 text-red-700 border-red-100"
                                                            )}>
                                                                {calculateGrade(marks[student.id])}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                        marks[student.id] ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                    )}>
                                                        {marks[student.id] ? 'Entered' : 'Pending'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-slate-400 border-emerald-100/50">
                                                    Select a class/stream and click "Load Students" to begin
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Stats & Info (4 columns) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-900">Performance Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Average</p>
                                        <p className="text-2xl font-black text-slate-900">{avgScore}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-center">
                                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1">Highest</p>
                                        <p className="text-2xl font-black text-slate-900">{highestScore}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Students Loaded</span>
                                        <span className="font-bold text-slate-900">{students.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Marks Entered</span>
                                        <span className="font-bold text-emerald-600">{enteredCount}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                disabled={students.length === 0}
                                                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white hover:text-white shadow-lg shadow-emerald-500/30 border-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <Download className="mr-2 h-4 w-4" /> Download Report <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                            <DropdownMenuItem onClick={handleDownloadReport} className="cursor-pointer">
                                                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Excel Report
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
                                                <Download className="mr-2 h-4 w-4 text-red-600" /> PDF Report
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
                            <div className="flex items-center gap-2 text-amber-700">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Validation</span>
                            </div>
                            <p className="text-[11px] text-amber-800/80 leading-relaxed">
                                Marks exceeding 100 will be flagged. Ensure all entries are double-checked before final submission.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
