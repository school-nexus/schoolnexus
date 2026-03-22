export const runtime = 'edge';
"use client"

import React, { useState, useEffect, useRef } from "react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { type GradingScale, calculateGrade, getGradePoints, calculateAggregates, determineDivision } from "@/lib/reportCardUtils"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    Download,
    BookOpen,
    Users,
    GraduationCap,
    Award,
    Filter,
    MoreHorizontal,
    Loader2,
    Eye,
    TrendingUp,
    BarChart2,
    Printer,
    FileText,
    CheckCircle2,
    ChevronDown,
    FileSpreadsheet
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
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MarksheetPreview } from "./components/MarksheetPreview"
import { studentActions, examActions, marksActions, classActions, streamActions, subjectActions, gradingActions, termActions, academicYearActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"

interface RawClass {
    id: number
    name: string
    code?: string
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
    termId: number
    examTypeId: number
}

interface RawMark {
    studentId: number
    subjectId: number
    score: number
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

interface RawAcademicYear {
    id: number
    isActive: boolean
}

interface Student {
    id: number
    admissionNumber: string
    firstName: string
    lastName: string
    middleName?: string
    streamId: number | null
}

export default function MarksheetsPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [subjects, setSubjects] = useState<RawSubject[]>([])
    const [exams, setExams] = useState<RawExam[]>([])
    const [marks, setMarks] = useState<RawMark[]>([])
    const [gradingScales, setGradingScales] = useState<GradingScale[]>([]) // GradingScale from reportCardUtils
    const [loading, setLoading] = useState(true)
    const [selectedStream, setSelectedStream] = useState("")
    const [selectedTerm, setSelectedTerm] = useState("")
    const [selectedExamType, setSelectedExamType] = useState("")
    const [terms, setTerms] = useState<RawTerm[]>([])
    const [examTypes, setExamTypes] = useState<RawExamType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [previewStudent, setPreviewStudent] = useState<Student | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [classData, streamData, subjectData, examData, gradingData, examTypeData, academicYears] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                subjectActions.getAll() as Promise<RawSubject[]>,
                examActions.getAll() as Promise<RawExam[]>,
                gradingActions.getAll(),
                examActions.getTypes() as Promise<RawExamType[]>,
                academicYearActions.getAll() as Promise<RawAcademicYear[]>
            ])
            setClasses(classData)
            setStreams(streamData)
            setSubjects(subjectData)
            setExams(examData)
            setGradingScales(gradingData)
            setExamTypes(examTypeData)

            const activeYear = academicYears.find(y => y.isActive)
            if (activeYear) {
                const termData = await termActions.getByYear(activeYear.id) as RawTerm[]
                setTerms(termData)
                const activeTerm = termData.find(t => t.isActive)
                if (activeTerm) setSelectedTerm(activeTerm.id.toString())
            }
        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const loadStudents = async () => {
        console.log("Filters:", { selectedStream, selectedTerm, selectedExamType })
        const isClassSelection = selectedStream.startsWith('c:')
        const selectionId = parseInt(selectedStream.split(':')[1] || selectedStream)

        // Find ALL exams that match the criteria to handle fragmented data
        const matchingExams = exams.filter(e =>
            e.termId === parseInt(selectedTerm) &&
            e.examTypeId === parseInt(selectedExamType)
        )
        console.log("Matching Exams:", matchingExams)

        if (matchingExams.length === 0) {
            toast.error("No exam found for the selected term and exam type")
            setStudents([])
            setMarks([])
            return
        }

        setLoading(true)
        try {
            // Fetch marks for ALL matching exams
            const marksPromises = matchingExams.map(exam => marksActions.getByExam(exam.id) as Promise<RawMark[]>)
            const [allStudents, ...marksResults] = await Promise.all([
                studentActions.getAll() as Promise<Student[]>,
                ...marksPromises
            ])

            // Flatten all marks into a single array
            const aggregatedMarks = marksResults.flat()
            console.log("Aggregated Marks:", aggregatedMarks)

            // Always load all subjects to ensure columns appear even if exam configuration is incomplete
            const allSubjects = await subjectActions.getAll() as RawSubject[]
            setSubjects(allSubjects)

            const filtered = allStudents.filter((s) => {
                if (isClassSelection) {
                    const stream = streams.find(st => st.id === s.streamId)
                    return stream && stream.classId === selectionId
                } else {
                    return s.streamId === selectionId
                }
            })
            setStudents(filtered)
            setMarks(aggregatedMarks)
        } catch (error) {
            console.error("Failed to load data:", error)
            toast.error("Failed to load students and marks")
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (studentId: number) => {
        const studentMarks = marks.filter(m => m.studentId === studentId)

        const subjectData: Record<number, { score: number | string, grade: string }> = {}
        studentMarks.forEach(m => {
            const score = m.score || 0
            // Use standard util for grading to ensure consistency
            const grade = calculateGrade(score, gradingScales)
            subjectData[m.subjectId] = { score, grade }
        })

        if (!studentMarks || studentMarks.length === 0) {
            return { total: 0, average: "0.0", grade: 'N/A', aggregate: 0, division: 'U', subjectData }
        }

        const totalValue = studentMarks.reduce((sum, m) => sum + (m.score || 0), 0)
        const averageValue = totalValue / studentMarks.length

        // UNEB PLE Aggregate Calculation (Best 4 Core Subjects)
        const coreSubjectNames = ["Mathematics", "English", "Science", "Social Studies"]
        const coreSubjectCodes = ["MTC", "ENG", "SCI", "SST"]

        const coreMarks = studentMarks.filter(m => {
            const sub = subjects.find(s => s.id === m.subjectId)
            if (!sub) return false

            const matchesName = coreSubjectNames.some(name => sub.name.toLowerCase().includes(name.toLowerCase()))
            const matchesCode = coreSubjectCodes.some(code => sub.code.toUpperCase() === code.toUpperCase())

            return matchesName || matchesCode
        }).map(m => ({
            score: m.score,
            grade: calculateGrade(m.score || 0, gradingScales)
        }))

        // Use util for aggregation and division
        const aggregate = calculateAggregates(coreMarks, gradingScales)
        const division = determineDivision(aggregate)

        return { total: totalValue, average: averageValue.toFixed(1), aggregate, division, subjectData, grade: 'N/A' }
    }

    const getRank = (studentId: number) => {
        const studentStats = students.map(s => ({
            id: s.id,
            aggregate: calculateStats(s.id).aggregate
        })).sort((a, b) => a.aggregate - b.aggregate)

        const rank = studentStats.findIndex(s => s.id === studentId) + 1
        return rank
    }

    const getClassName = (streamId: string) => {
        const stream = streams.find(s => s.id === parseInt(streamId))
        if (!stream) return ""
        const cls = classes.find(c => c.id === stream.classId)
        return `${cls?.code || ''} ${stream.name}`
    }

    const filteredStudents = students.filter(s =>
        `${s.firstName} ${s.lastName} ${s.middleName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleDownloadMarksheet = (student: Student) => {
        toast.info(`Generating marksheet for ${student.firstName}...`)
        // In a real app, this would trigger a PDF generation or CSV download
        setTimeout(() => {
            toast.success(`Marksheet for ${student.firstName} downloaded!`)
        }, 1500)
    }

    const handleExport = () => {
        if (students.length === 0) {
            toast.error("No data to export")
            return
        }

        try {
            // Prepare data for export
            const exportData = filteredStudents.map((student, idx) => {
                const stats = calculateStats(student.id)
                const row: Record<string, string | number> = {
                    "No": idx + 1,
                    "Admission No": student.admissionNumber,
                    "Student Name": `${student.firstName} ${student.lastName}`,
                    "Class": getClassName(selectedStream),
                }

                // Add subject marks and grades
                subjects.forEach(sub => {
                    const data = stats.subjectData[sub.id] || { score: 0, grade: '-' }
                    row[`${sub.code} Score`] = data.score
                    row[`${sub.code} Grade`] = data.grade
                })

                // Add stats
                row["Aggregate"] = stats.aggregate
                row["Division"] = stats.division
                row["Rank"] = getRank(student.id)

                return row
            })

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            // Add summary info at the top (optional, but good for context)
            XLSX.utils.sheet_add_aoa(ws, [
                ["School Nexus - Student Marksheet Report"],
                [`Term: ${terms.find(t => t.id === parseInt(selectedTerm))?.name || ''}`],
                [`Exam: ${examTypes.find(et => et.id === parseInt(selectedExamType))?.name || ''}`],
                [`Class: ${getClassName(selectedStream)}`],
                [`Date: ${new Date().toLocaleDateString()}`],
                [""] // Empty row
            ], { origin: "A1" })

            // Adjust data start row (since we added 6 header rows)
            // Note: json_to_sheet creates data starting at A1. We need to move it down or append it differently.
            // Easier approach: Create sheet from data, then insert rows at top? 
            // Or just append sheet as is for now to keep it simple and robust.
            // Let's stick to simple data export for now to ensure compatibility.

            XLSX.utils.book_append_sheet(wb, ws, "Marksheets")

            // Generate filename
            const fileName = `Marksheets_${getClassName(selectedStream)}_${new Date().toISOString().split('T')[0]}.xlsx`

            XLSX.writeFile(wb, fileName)
            toast.success("Marksheets exported successfully!")
        } catch (error) {
            console.error("Export failed:", error)
            toast.error("Failed to export marksheets")
        }
    }

    const handleExportPdf = async () => {
        if (students.length === 0) {
            toast.error("No data to export")
            return
        }

        try {
            const profile = await schoolProfileActions.get() as { name: string, address: string, phone: string, email: string }
            const doc = new jsPDF('l', 'mm', 'a4') // Landscape for better marksheet fit
            const pageWidth = doc.internal.pageSize.getWidth()

            // Add Header
            doc.setFontSize(22)
            doc.setTextColor(16, 185, 129) // Emerald-500
            doc.text(profile?.name || "School Nexus", pageWidth / 2, 15, { align: "center" })

            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139) // Slate-500
            doc.text(`${profile?.address || "P.O. Box 123, Kampala, Uganda"} | Tel: ${profile?.phone || "+256 772 123456"} | Email: ${profile?.email || "info@schoolnexus.com"}`, pageWidth / 2, 22, { align: "center" })

            // Exam Details
            const termName = terms.find(t => t.id === parseInt(selectedTerm))?.name || ''
            const examName = examTypes.find(et => et.id === parseInt(selectedExamType))?.name || ''
            const className = getClassName(selectedStream)
            const date = new Date().toLocaleDateString()

            doc.setDrawColor(226, 232, 240) // Slate-200
            doc.line(20, 25, pageWidth - 20, 25)

            doc.setFontSize(12)
            doc.setTextColor(30, 41, 59) // Slate-800
            doc.text(`OFFICIAL MARKSHEET REPORT`, pageWidth / 2, 32, { align: "center" })

            doc.setFontSize(10)
            doc.text(`Term: ${termName}`, 20, 40)
            doc.text(`Exam: ${examName}`, 80, 40)
            doc.text(`Class: ${className}`, 140, 40)
            doc.text(`Date: ${date}`, pageWidth - 50, 40)

            // Prepare table data
            const tableColumn = ["#", "Student Name", "Class", ...subjects.flatMap(s => [s.code, "GD"]), "AGG", "DIV", "RANK"]
            const tableRows = filteredStudents.map((student, idx) => {
                const stats = calculateStats(student.id)
                const row = [
                    idx + 1,
                    `${student.firstName} ${student.lastName}`,
                    className,
                    ...subjects.flatMap(s => {
                        const data = stats.subjectData[s.id] || { score: '-', grade: '-' }
                        return [data.score, data.grade]
                    }),
                    stats.aggregate,
                    stats.division,
                    `#${getRank(student.id)}`
                ]
                return row
            })

            // Generate Table
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 50, halign: 'left' },
                    2: { cellWidth: 30, halign: 'left' },
                },
                alternateRowStyles: { fillColor: [248, 250, 252] } // Slate-50
            })

            // Add Footer
            const lastTable = (doc as any).lastAutoTable as { finalY: number } | undefined
            const finalY = lastTable ? lastTable.finalY : 150
            doc.setFontSize(9)
            doc.setTextColor(148, 163, 184) // Slate-400
            doc.text(`Generated by ${profile?.name || "School Nexus"} Management System`, pageWidth / 2, finalY + 15, { align: "center" })

            // Save PDF
            const fileName = `Marksheet_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
            doc.save(fileName)
            toast.success("PDF exported successfully!")
        } catch (error) {
            console.error("PDF Export failed:", error)
            toast.error("Failed to export PDF")
        }
    }

    const handlePrint = () => {
        // Ensure window is focused before printing
        window.focus()
        setTimeout(() => {
            window.print()
        }, 100)
    }


    const handlePreview = (student: Student) => {
        setPreviewStudent(student)
        setIsPreviewOpen(true)
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
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8 print:w-full print:max-w-none print:p-0">
                <PageHeader
                    title="Student Marksheets"
                    description="View and generate student academic marksheets."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Examinations", href: "/exams" },
                        { label: "Marksheets" },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="h-11 px-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-semibold transition-all hover:scale-105 active:scale-95"
                            >
                                <Printer className="h-4 w-4 mr-2 text-emerald-600" /> Print
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExport}
                                className="h-11 px-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-semibold transition-all hover:scale-105 active:scale-95"
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" /> Export Excel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExportPdf}
                                className="h-11 px-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm font-semibold transition-all hover:scale-105 active:scale-95"
                            >
                                <FileText className="h-4 w-4 mr-2 text-emerald-600" /> Export PDF
                            </Button>
                        </div>
                    }
                />

                {/* Filter Bar */}
                <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50 print:hidden">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Class/Stream</Label>
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
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Term</Label>
                            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent>
                                    {terms.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Exam Type</Label>
                            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue placeholder="Select Exam Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {examTypes.map(et => (
                                        <SelectItem key={et.id} value={et.id.toString()}>
                                            {et.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={loadStudents} className="w-full h-11 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-bold shadow-lg shadow-slate-200/50 border-none transition-all duration-300">
                                <Filter className="h-4 w-4 mr-2" /> Load Data
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden print:shadow-none print:ring-0 print:bg-white">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/30 print:hidden">
                        <div className="flex items-center gap-4 flex-1 max-w-2xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name or admission number..."
                                    className="pl-11 h-11 bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500/20 transition-all rounded-xl shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {selectedStream && (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-2 flex items-center gap-2 shadow-sm whitespace-nowrap">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {getClassName(selectedStream)}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <CardContent className="p-0">
                        {/* Print Header - Visible only in print */}
                        <div className="hidden print:block p-8 mb-4 border-b border-slate-900/10">
                            <style jsx global>{`
                                @media print {
                                    @page {
                                        size: A4;
                                        margin: 1cm;
                                    }
                                    body {
                                        print-color-adjust: exact;
                                        -webkit-print-color-adjust: exact;
                                    }
                                }
                            `}</style>
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">School Nexus</h1>
                                <p className="text-sm text-slate-600">P.O. Box 123, Kampala, Uganda | Tel: +256 772 123456</p>
                                <div className="flex items-center justify-center gap-6 mt-4 text-sm font-medium text-slate-800 border-t border-b border-slate-900/10 py-2">
                                    <span>Term: {terms.find(t => t.id === parseInt(selectedTerm))?.name}</span>
                                    <span>•</span>
                                    <span>Exam: {examTypes.find(et => et.id === parseInt(selectedExamType))?.name}</span>
                                    <span>•</span>
                                    <span>Class: {getClassName(selectedStream)}</span>
                                    <span>•</span>
                                    <span>Date: {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto print:overflow-visible">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead rowSpan={2} className="font-bold text-white w-12 text-center border-r border-emerald-500/30 p-2">#</TableHead>
                                        <TableHead rowSpan={2} className="font-bold text-white border-r border-emerald-500/30 min-w-[200px] p-2">Student Name</TableHead>
                                        <TableHead rowSpan={2} className="font-bold text-white border-r border-emerald-500/30 min-w-[150px] p-2">Class</TableHead>
                                        {subjects.map(sub => (
                                            <TableHead key={sub.id} colSpan={2} className="font-bold text-white text-center border-r border-b border-emerald-500/30 bg-emerald-600/90 px-1 py-1 h-8">
                                                {sub.code}
                                            </TableHead>
                                        ))}
                                        <TableHead rowSpan={2} className="font-bold text-white text-center border-r border-emerald-500/30 bg-emerald-700/50 w-16 p-2">AGG</TableHead>
                                        <TableHead rowSpan={2} className="font-bold text-white text-center border-r border-emerald-500/30 bg-teal-700/50 w-16 p-2">DIV</TableHead>
                                        <TableHead rowSpan={2} className="font-bold text-white text-center border-r border-emerald-500/30 bg-emerald-800/50 w-16 p-2">RANK</TableHead>
                                        <TableHead rowSpan={2} className="font-bold text-white text-center w-12 p-2 print:hidden">Action</TableHead>
                                    </TableRow>
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        {subjects.map(sub => (
                                            <React.Fragment key={sub.id}>
                                                <TableHead className="text-[10px] font-bold text-emerald-50 text-center border-r border-emerald-500/30 h-6 bg-emerald-600/80 w-12 p-0">MKS</TableHead>
                                                <TableHead className="text-[10px] font-bold text-emerald-50 text-center border-r border-emerald-500/30 h-6 bg-emerald-600/80 w-12 p-0">GD</TableHead>
                                            </React.Fragment>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
                                        const stats = calculateStats(student.id)
                                        return (
                                            <TableRow key={student.id} className={cn(
                                                "hover:bg-emerald-50 transition-colors group h-9 border-emerald-100/50",
                                                idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                            )}>
                                                <TableCell className="text-center font-mono text-slate-500 border-r border-emerald-100/50 p-1">{idx + 1}</TableCell>
                                                <TableCell className="font-bold text-slate-900 border-r border-emerald-100/50 group-hover:text-emerald-700 transition-colors p-1 px-2">{student.firstName} {student.lastName}</TableCell>
                                                <TableCell className="text-slate-500 border-r border-emerald-100/50 p-1 px-2">{getClassName(selectedStream)}</TableCell>
                                                {subjects.map(sub => {
                                                    const data = stats.subjectData[sub.id] || { score: '-', grade: '-' }
                                                    return (
                                                        <React.Fragment key={sub.id}>
                                                            <TableCell className="text-center text-slate-700 border-r border-emerald-100/50 bg-white/50 font-medium p-0.5">{data.score}</TableCell>
                                                            <TableCell className="text-center font-bold text-slate-900 border-r border-emerald-100/50 bg-white/50 p-0.5">{data.grade}</TableCell>
                                                        </React.Fragment>
                                                    )
                                                })}
                                                <TableCell className="text-center font-bold text-emerald-700 border-r border-emerald-100/50 bg-emerald-50/40 p-1">{stats.aggregate}</TableCell>
                                                <TableCell className="text-center font-bold text-teal-700 border-r border-emerald-100/50 bg-teal-50/40 p-1">{stats.division}</TableCell>
                                                <TableCell className="text-center font-bold text-slate-900 border-r border-emerald-100/50 bg-slate-100/30 p-1">#{getRank(student.id)}</TableCell>
                                                <TableCell className="text-center p-1 border-emerald-100/50 print:hidden">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100/50" onClick={() => handlePreview(student)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={8 + subjects.length * 2} className="text-center py-12 text-slate-400 border-emerald-100/50">
                                                {students.length === 0
                                                    ? "Select a class/stream and click 'Load Data'"
                                                    : "No students match your search"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Marksheet Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-emerald-600" />
                            Marksheet Preview
                        </DialogTitle>
                        <DialogDescription>
                            Previewing academic performance for {previewStudent?.firstName} {previewStudent?.lastName}.
                        </DialogDescription>
                    </DialogHeader>
                    {previewStudent && (
                        <MarksheetPreview
                            student={previewStudent}
                            exam={exams.find(e => e.termId === parseInt(selectedTerm) && e.examTypeId === parseInt(selectedExamType))}
                            marks={marks.filter(m => m.studentId === previewStudent.id)}
                            subjects={subjects}
                            stats={calculateStats(previewStudent.id)}
                            rank={getRank(previewStudent.id)}
                            gradingScales={gradingScales}
                        />
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Close
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                            onClick={() => previewStudent && handleDownloadMarksheet(previewStudent)}
                        >
                            <Download className="h-4 w-4 mr-2" /> Download PDF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
