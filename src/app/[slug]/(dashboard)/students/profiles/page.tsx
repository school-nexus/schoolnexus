"use client"
export const runtime = 'edge';

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Mail, Phone, MapPin, GraduationCap, MoreHorizontal, Clock, Award, Shield, FileText, CreditCard, Download, Upload, ChevronDown, TrendingUp, AlertCircle, CheckCircle2, Loader2, ChevronRight, Users, Wallet, User, UploadCloud, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { reportUtils } from "@/lib/report-utils"
import { studentActions, guardianActions, feeActions, classActions, streamActions, fileActions, marksActions, attendanceActions } from "@/lib/electron"
import { toast } from "sonner"
import { Pencil } from "lucide-react"

interface Student {
    id: number
    admissionNumber: string
    linNumber: string | null
    schoolPayCode: string | null
    firstName: string
    lastName: string
    gender: string
    dateOfBirth: string | null
    status: string | null
    classId: number | null
    streamId: number | null
    address: string | null
    nationality: string | null
    previousSchool: string | null
    photoUrl: string | null
}

interface Guardian {
    id: number
    fullName: string
    relationship: string
    phone: string
    email: string
}

interface FeePayment {
    date: string
    receiptNumber: string
    method: string
    notes: string
    amount: number
}

interface FeeInvoice {
    invoiceNumber: string
    dueDate: string
    amount: number
    paidAmount: number
    balance: number
    status: string
}

interface FeeData {
    total: number
    paid: number
    balance: number
    payments: FeePayment[]
    invoices: FeeInvoice[]
}

interface StudentDocument {
    id: number
    name: string
    type: string
    url?: string
    path: string
    size: string
    date: string
    createdAt: string
}

interface StudentMark {
    subjectName: string
    score: number
    termName: string
    examName: string
    grade: string
    remarks: string
}

interface AttendanceRecord {
    date: string
    status: string
    remarks: string
    termName: string
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

function StudentProfilesContent() {
    const searchParams = useSearchParams()
    const studentIdParam = searchParams.get('id')
    const tabParam = searchParams.get('tab') || 'details'

    const [students, setStudents] = useState<Student[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [guardian, setGuardian] = useState<Guardian | null>(null)
    const [feeData, setFeeData] = useState<FeeData | null>(null)
    const [documents, setDocuments] = useState<StudentDocument[]>([])
    const [studentMarks, setStudentMarks] = useState<StudentMark[]>([])
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
    const [filterClass, setFilterClass] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")

    useEffect(() => {
        fetchData()
    }, [studentIdParam])

    const fetchData = async () => {
        try {
            const [studentsData, classesData, streamsData] = await Promise.all([
                studentActions.getAll() as Promise<Student[]>,
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>
            ])
            setStudents(studentsData)
            setClasses(classesData)
            setStreams(streamsData)

            if (studentsData.length > 0) {
                // Check if a specific student ID was passed in the URL
                if (studentIdParam) {
                    const targetStudent = studentsData.find((s: Student) => s.id.toString() === studentIdParam)
                    if (targetStudent) {
                        setSelectedStudent(targetStudent)
                        loadStudentDetails(targetStudent.id)
                        return
                    }
                }
                // Default to first student if no ID param or student not found
                setSelectedStudent(studentsData[0])
                loadStudentDetails(studentsData[0].id)
            }
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load student data")
        } finally {
            setLoading(false)
        }
    }

    const loadStudentDetails = async (studentId: number) => {
        try {
            const [guardianData, feesData, documentsData, marksData, attendanceData] = await Promise.all([
                guardianActions.getByStudent(studentId) as Promise<Guardian[]>,
                feeActions.getStudentFees(studentId) as Promise<FeeData>,
                studentActions.getDocuments(studentId) as Promise<StudentDocument[]>,
                marksActions.getByStudent(studentId) as Promise<StudentMark[]>,
                attendanceActions.getByStudent(studentId) as Promise<AttendanceRecord[]>
            ])
            setGuardian(guardianData?.[0] || null)
            setFeeData(feesData)
            setDocuments(documentsData)
            setStudentMarks(marksData)
            setAttendanceRecords(attendanceData)
        } catch (error: unknown) {
            console.error("Failed to load student details:", error)
        }
    }

    const getClassName = (student: Student) => {
        const stream = streams.find(s => s.id === student.streamId)
        const cls = student.classId ? classes.find(c => c.id === student.classId) : (stream ? classes.find(c => c.id === stream.classId) : null)
        if (!cls) return "N/A"
        return stream ? `${cls.name} ${stream.name}` : cls.name
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (query) {
            const found = students.find(student =>
                `${student.firstName} ${student.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
                student.admissionNumber.toLowerCase().includes(query.toLowerCase())
            )
            if (found) {
                setSelectedStudent(found)
                loadStudentDetails(found.id)
            }
        }
    }

    const handleStudentSelect = (studentId: string) => {
        const student = students.find(s => s.id.toString() === studentId)
        if (student) {
            setSelectedStudent(student)
            loadStudentDetails(student.id)
        }
    }

    // Filter students based on class and status
    const filteredStudents = students.filter(student => {
        // Filter by class
        if (filterClass !== "all") {
            const stream = streams.find(s => s.id === student.streamId)
            const clsId = student.classId || stream?.classId
            if (!clsId || clsId.toString() !== filterClass) return false
        }
        // Filter by status
        if (filterStatus !== "all") {
            if (student.status?.toLowerCase() !== filterStatus.toLowerCase()) return false
        }
        return true
    })

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    if (!selectedStudent) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <div className="text-center">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No students found. Add students to view profiles.</p>
                </div>
            </div>
        )
    }


    const performanceData = useMemo(() => {
        if (!studentMarks || studentMarks.length === 0) return { stats: null, chartData: [] };

        const scores = studentMarks.map(m => m.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const maxScore = Math.max(...scores);
        const bestSubject = studentMarks.reduce((prev, current) => (prev.score > current.score) ? prev : current).subjectName;

        interface PerformanceGroup {
            name: string
            total: number
            count: number
        }

        // Group by term/exam for chart
        const grouped = studentMarks.reduce((acc: Record<string, PerformanceGroup>, mark) => {
            const key = `${mark.termName} - ${mark.examName}`;
            if (!acc[key]) {
                acc[key] = { name: key, total: 0, count: 0 };
            }
            acc[key].total += mark.score;
            acc[key].count += 1;
            return acc;
        }, {});

        const chartData = Object.values(grouped).map((g) => ({
            name: g.name,
            score: Math.round(g.total / g.count)
        })).reverse(); // Reverse to show chronological order if sorted by desc in query

        return {
            stats: {
                avg: Math.round(avgScore),
                max: maxScore,
                bestSubject,
                totalExams: studentMarks.length
            },
            chartData
        };
    }, [studentMarks]);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 relative z-10 pb-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/students" className="hover:text-emerald-600 transition-colors">Students</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-emerald-600 font-bold">Profiles</span>
                </nav>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Profiles</h1>
                        <p className="text-slate-500 text-base max-w-2xl font-medium leading-relaxed">
                            Comprehensive view of student records including academic performance, fee history, and personal documentation.
                        </p>
                    </div>
                </div>

                {/* Search & Filter Bar - Floating Glass */}
                <div className="sticky top-4 z-20 mx-auto max-w-4xl">
                    <div className="flex flex-col md:flex-row gap-3 items-center bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-slate-200/50 p-2 rounded-2xl ring-1 ring-slate-900/5">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or ID..."
                                className="pl-10 bg-transparent border-none focus-visible:ring-0 h-10 text-slate-700 placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto px-2">
                            <Select value={selectedStudent?.id.toString()} onValueChange={handleStudentSelect}>
                                <SelectTrigger className="w-[160px] bg-slate-50 border-0 h-9 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                                    <SelectValue placeholder="Select Student" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredStudents.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.firstName} {s.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterClass} onValueChange={setFilterClass}>
                                <SelectTrigger className="w-[120px] bg-slate-50 border-0 h-9 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[100px] bg-slate-50 border-0 h-9 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Profile Header Card */}
                <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
                    {/* Header Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-slate-50 opacity-50" />
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <GraduationCap className="w-64 h-64 text-emerald-900 transform rotate-12" />
                    </div>

                    <div className="relative p-8 md:p-10">
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                                <div className="relative group">
                                    <div className="h-32 w-32 rounded-full ring-4 ring-white shadow-xl bg-white p-1 transition-transform transform group-hover:scale-105">
                                        <Avatar className="h-full w-full">
                                            <AvatarImage src={fileActions.getUrl(selectedStudent.photoUrl) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.firstName}`} />
                                            <AvatarFallback className="text-4xl font-bold text-emerald-600 bg-emerald-50">{selectedStudent.firstName[0]}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className={cn(
                                        "absolute bottom-2 right-2 h-7 w-7 rounded-full ring-4 ring-white shadow-md flex items-center justify-center",
                                        selectedStudent.status === 'Active' ? "bg-emerald-500" :
                                            selectedStudent.status === 'Inactive' ? "bg-slate-400" : "bg-red-500"
                                    )}>
                                        {selectedStudent.status === 'Active' && <CheckCircle2 className="h-4 w-4 text-white" />}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{selectedStudent.firstName} {selectedStudent.lastName}</h1>
                                        <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                                            {selectedStudent.admissionNumber}
                                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                                            {getClassName(selectedStudent)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 justify-center md:justify-start pt-2">
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-full">
                                            {selectedStudent.status || 'Unknown'} Student
                                        </Badge>
                                        <Badge variant="outline" className="border-slate-200 text-slate-600 px-3 py-1 rounded-full">
                                            {selectedStudent.gender}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-2 w-full">
                                    <Button asChild className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 rounded-xl h-11 px-6 transition-all hover:shadow-emerald-500/30">
                                        <Link href={`/students/add?id=${selectedStudent?.id}`}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                                        </Link>
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                            <DropdownMenuItem>
                                                <Download className="mr-2 h-4 w-4" /> Download Report
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue={tabParam} className="w-full space-y-8">
                    <TabsList className="w-full max-w-[800px] h-auto p-1.5 bg-slate-100/50 backdrop-blur-xl border border-slate-200/60 rounded-2xl gap-1">
                        <TabsTrigger
                            value="details"
                            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/40 transition-all duration-300"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="fees"
                            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/40 transition-all duration-300"
                        >
                            Fees
                        </TabsTrigger>
                        <TabsTrigger
                            value="performance"
                            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/40 transition-all duration-300"
                        >
                            Performance
                        </TabsTrigger>
                        <TabsTrigger
                            value="attendance"
                            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/40 transition-all duration-300"
                        >
                            Attendance
                        </TabsTrigger>
                        <TabsTrigger
                            value="documents"
                            className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/40 transition-all duration-300"
                        >
                            Documents
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Info */}
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                                <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-emerald-100/50 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-lg font-bold text-slate-800">Personal Information</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date of Birth</p>
                                            <p className="text-slate-800 font-semibold text-lg">{selectedStudent.dateOfBirth || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gender</p>
                                            <p className="text-slate-800 font-semibold text-lg">{selectedStudent.gender}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</p>
                                        <div className="flex items-center gap-2 text-slate-800 font-medium text-base bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                                            {selectedStudent.address || 'N/A'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Guardian Info */}
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
                                <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-indigo-100/50 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-lg font-bold text-slate-800">Guardian Details</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    {guardian ? (
                                        <>
                                            <div className="space-y-1.5">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                                                <div className="text-slate-800 font-semibold text-lg flex items-center gap-2">
                                                    {guardian.fullName}
                                                    <Badge variant="outline" className="text-xs font-medium text-slate-500 border-slate-200 bg-slate-50">
                                                        {guardian.relationship}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</p>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3 text-slate-700 font-medium text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                                                            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                                                <Phone className="h-3.5 w-3.5 text-emerald-500" />
                                                            </div>
                                                            {guardian.phone || 'N/A'}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-slate-700 font-medium text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                                                            <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                                                <Mail className="h-3.5 w-3.5 text-sky-500" />
                                                            </div>
                                                            {guardian.email || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                            <Users className="h-12 w-12 mb-3 text-slate-200" />
                                            <p className="text-sm font-medium">No guardian information</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Additional Info */}
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden md:col-span-2 group hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300">
                                <CardHeader className="bg-gradient-to-r from-amber-50/50 to-transparent border-b border-amber-100/50 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-lg font-bold text-slate-800">Additional Information</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">LIN Number</p>
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-blue-500" />
                                                <p className="text-slate-800 font-semibold text-lg">{selectedStudent.linNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SchoolPay Code</p>
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-emerald-500" />
                                                <p className="text-slate-800 font-semibold text-lg">{selectedStudent.schoolPayCode || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nationality</p>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                                <p className="text-slate-800 font-semibold text-lg">{selectedStudent.nationality || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Previous School</p>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                                <p className="text-slate-800 font-semibold text-lg">{selectedStudent.previousSchool || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="fees" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                                <CardContent className="p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                        <Wallet className="w-24 h-24 text-emerald-900" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-1">Total Fees</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-semibold text-slate-400">UGX</span>
                                            <span className="text-4xl font-black text-slate-800 tracking-tight">{(feeData?.total || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-emerald-100/60 shadow-xl shadow-emerald-100/40 bg-emerald-50/50 backdrop-blur-xl ring-1 ring-emerald-900/5 group hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
                                <CardContent className="p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
                                        <CheckCircle2 className="w-24 h-24 text-emerald-900" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-sm text-emerald-600/80 font-bold uppercase tracking-widest mb-1">Amount Paid</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-semibold text-emerald-600/60">UGX</span>
                                            <span className="text-4xl font-black text-emerald-700 tracking-tight">{(feeData?.paid || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-red-100/60 shadow-xl shadow-red-100/40 bg-red-50/50 backdrop-blur-xl ring-1 ring-red-900/5 group hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300">
                                <CardContent className="p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-45 group-hover:scale-110 transition-transform duration-500">
                                        <AlertCircle className="w-24 h-24 text-red-900" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-sm text-red-600/80 font-bold uppercase tracking-widest mb-1">Outstanding</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-semibold text-red-600/60">UGX</span>
                                            <span className="text-4xl font-black text-red-700 tracking-tight">{(feeData?.balance || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 pb-6 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold text-slate-800">Payment History & Invoices</CardTitle>
                                    <CardDescription className="font-medium text-slate-500">Detailed breakdown of fee payments and outstanding balances</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Tabs defaultValue="payments" className="w-full">
                                    <div className="border-b border-slate-100 px-6 py-2 bg-slate-50/30">
                                        <TabsList className="bg-transparent h-auto p-0 gap-4">
                                            <TabsTrigger value="payments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 py-3 text-sm font-semibold text-slate-500 data-[state=active]:text-emerald-700">Detailed Payment History</TabsTrigger>
                                            <TabsTrigger value="invoices" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 py-3 text-sm font-semibold text-slate-500 data-[state=active]:text-emerald-700">Invoices Breakdown</TabsTrigger>
                                        </TabsList>
                                    </div>
                                    <TabsContent value="payments" className="m-0 border-none p-0 outline-none">
                                        {feeData && feeData.payments && feeData.payments.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-slate-50/80">
                                                        <TableRow className="border-slate-200">
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Date</TableHead>
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Receipt</TableHead>
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Method</TableHead>
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Notes</TableHead>
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12 text-right">Amount</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {feeData.payments.map((payment, index) => (
                                                            <TableRow key={index} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                                                <TableCell className="font-medium text-slate-700">{new Date(payment.date).toLocaleDateString()}</TableCell>
                                                                <TableCell className="text-slate-600 font-mono text-xs">{payment.receiptNumber || '-'}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="font-medium border-slate-200 text-slate-600 px-2 py-0">
                                                                        {payment.method || 'Cash'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-slate-500 text-sm italic">{payment.notes || '-'}</TableCell>
                                                                <TableCell className="font-bold text-emerald-700 text-right">UGX {(payment.amount || 0).toLocaleString()}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white">
                                                <div className="p-4 bg-slate-50 rounded-full mb-4">
                                                    <Wallet className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <p className="font-bold text-lg text-slate-600">No payment history</p>
                                                <p className="text-sm text-slate-400 max-w-xs text-center mt-1">Fee payments for this student will appear here once recorded.</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="invoices" className="m-0 border-none p-0 outline-none">
                                        {feeData && feeData.invoices && feeData.invoices.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-slate-50/80">
                                                        <TableRow className="border-slate-200">
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Invoice No</TableHead>
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Due Date</TableHead>
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Total</TableHead>
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Paid</TableHead>
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Balance</TableHead>
                                                            <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12 text-right">Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {feeData.invoices.map((invoice, index) => (
                                                            <TableRow key={index} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                                                <TableCell className="text-slate-600 font-mono text-xs">{invoice.invoiceNumber || '-'}</TableCell>
                                                                <TableCell className="font-medium text-slate-700">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</TableCell>
                                                                <TableCell className="font-semibold text-slate-800">UGX {(invoice.amount || 0).toLocaleString()}</TableCell>
                                                                <TableCell className="font-medium text-emerald-600">UGX {(invoice.paidAmount || 0).toLocaleString()}</TableCell>
                                                                <TableCell className="font-medium text-red-600">UGX {(invoice.balance || 0).toLocaleString()}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <Badge variant="outline" className={cn(
                                                                        "font-bold border-0 px-2.5 py-0.5",
                                                                        invoice.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                                                                            invoice.status === "Partially Paid" ? "bg-amber-100 text-amber-700" :
                                                                                invoice.status === "Overdue" ? "bg-red-100 text-red-700" :
                                                                                    "bg-slate-100 text-slate-700"
                                                                    )}>
                                                                        {invoice.status}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white">
                                                <div className="p-4 bg-slate-50 rounded-full mb-4">
                                                    <FileText className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <p className="font-bold text-lg text-slate-600">No invoices available</p>
                                                <p className="text-sm text-slate-400 max-w-xs text-center mt-1">Invoices for this student will appear here once generated.</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="border-emerald-100 bg-white shadow-sm ring-1 ring-slate-900/5 group hover:shadow-md transition-all duration-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                        <Award className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Score</p>
                                        <p className="text-2xl font-black text-slate-800 tracking-tight">{performanceData.stats?.avg || 0}%</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-blue-100 bg-white shadow-sm ring-1 ring-slate-900/5 group hover:shadow-md transition-all duration-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Best Subject</p>
                                        <p className="text-xl font-black text-slate-800 tracking-tight truncate">{performanceData.stats?.bestSubject || 'N/A'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-purple-100 bg-white shadow-sm ring-1 ring-slate-900/5 group hover:shadow-md transition-all duration-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Score</p>
                                        <p className="text-2xl font-black text-slate-800 tracking-tight">{performanceData.stats?.max || 0}%</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-amber-100 bg-white shadow-sm ring-1 ring-slate-900/5 group hover:shadow-md transition-all duration-300">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Assessments</p>
                                        <p className="text-2xl font-black text-slate-800 tracking-tight">{performanceData.stats?.totalExams || 0}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Performance Chart */}
                            <Card className="lg:col-span-2 border-slate-200/60 shadow-lg shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 pb-6 flex flex-row items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold text-slate-800">Performance Trend</CardTitle>
                                        <CardDescription className="font-medium text-slate-500">Visual trend of average scores across assessment cycles</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {performanceData.chartData.length > 0 ? (
                                        <div className="h-[300px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={performanceData.chartData}>
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="name"
                                                        stroke="#94a3b8"
                                                        fontSize={11}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={12}
                                                    />
                                                    <YAxis
                                                        stroke="#94a3b8"
                                                        fontSize={11}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        domain={[0, 100]}
                                                        tickFormatter={(v) => `${v}%`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                            borderRadius: '12px',
                                                            border: '1px solid #e2e8f0',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                            fontSize: '12px'
                                                        }}
                                                        cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="score"
                                                        stroke="#10b981"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorScore)"
                                                        animationDuration={1500}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                                            <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                                            <p className="font-bold">Not enough data for trend analysis</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Actions & Report Summary */}
                            <Card className="border-slate-200/60 shadow-lg shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 flex flex-col">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 pb-6">
                                    <CardTitle className="text-lg font-bold text-slate-800">Reports</CardTitle>
                                    <CardDescription className="font-medium text-slate-500">Export academic data</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 flex-1 flex flex-col justify-center gap-4">
                                    <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-center space-y-3">
                                        <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                                            <Download className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-emerald-900">Academic Transcript</p>
                                            <p className="text-xs text-emerald-600/70 font-medium leading-relaxed">Download a comprehensive report of all assessment results.</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                await reportUtils.exportToPDF({
                                                    title: `Academic Report: ${selectedStudent.firstName} ${selectedStudent.lastName}`,
                                                    subtitle: `Admission No: ${selectedStudent.admissionNumber}`,
                                                    filename: `Academic_Report_${selectedStudent.admissionNumber}`,
                                                    columns: [
                                                        { header: "Subject", dataKey: "subjectName" },
                                                        { header: "Exam", dataKey: "examName" },
                                                        { header: "Score", dataKey: "score" },
                                                        { header: "Grade", dataKey: "grade" },
                                                        { header: "Remarks", dataKey: "remarks" }
                                                    ],
                                                    data: studentMarks as unknown as Record<string, unknown>[]
                                                })
                                            }}
                                            className="w-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all font-bold rounded-xl h-11"
                                        >
                                            Generate PDF Transcript
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Marks Table */}
                        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 pb-6">
                                <CardTitle className="text-lg font-bold text-slate-800">Historical Assessment Records</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {studentMarks.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/80">
                                                <TableRow className="border-slate-200">
                                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12 px-6">Term</TableHead>
                                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12 px-6">Exam</TableHead>
                                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12 px-6">Subject</TableHead>
                                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12 px-6">Score</TableHead>
                                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12 px-6">Grade</TableHead>
                                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12 px-6">Remarks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {studentMarks.map((mark, index) => (
                                                    <TableRow key={index} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                                        <TableCell className="font-semibold text-slate-700 px-6">{mark.termName}</TableCell>
                                                        <TableCell className="text-slate-600 font-medium px-6">{mark.examName}</TableCell>
                                                        <TableCell className="text-slate-600 px-6">{mark.subjectName}</TableCell>
                                                        <TableCell className="font-bold text-slate-800 px-6">{mark.score}</TableCell>
                                                        <TableCell className="px-6">
                                                            <Badge variant="outline" className={cn(
                                                                "font-bold border-0 px-2.5 py-0.5",
                                                                ["A", "D1", "D2"].includes(mark.grade) ? "bg-emerald-100 text-emerald-700" :
                                                                    ["B", "C3", "C4", "C5", "C6"].includes(mark.grade) ? "bg-blue-100 text-blue-700" :
                                                                        ["P7", "P8"].includes(mark.grade) ? "bg-amber-100 text-amber-700" :
                                                                            "bg-red-100 text-red-700"
                                                            )}>
                                                                {mark.grade}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-slate-500 text-sm italic px-6">{mark.remarks || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/30">
                                        <div className="p-4 bg-slate-100 rounded-full mb-4">
                                            <TrendingUp className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="font-bold text-lg text-slate-600">No performance records</p>
                                        <p className="text-sm text-slate-400 max-w-xs text-center mt-1">Marks and assessment results for this student will appear here once entered.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="attendance" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 shadow-sm">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-lg font-bold text-slate-800">Attendance Records</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {attendanceRecords.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/80">
                                                <TableRow className="border-slate-200">
                                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Date</TableHead>
                                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Term</TableHead>
                                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-xs h-12">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {attendanceRecords.map((record, index) => (
                                                    <TableRow key={index} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                                        <TableCell className="font-medium text-slate-700">{new Date(record.date).toLocaleDateString()}</TableCell>
                                                        <TableCell className="text-slate-600">{record.termName}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={cn(
                                                                "font-bold border-0 px-2.5 py-0.5",
                                                                record.status === "Present" ? "bg-emerald-100 text-emerald-700" :
                                                                    record.status === "Late" ? "bg-amber-100 text-amber-700" :
                                                                        record.status === "Excused" ? "bg-blue-100 text-blue-700" :
                                                                            "bg-red-100 text-red-700"
                                                            )}>
                                                                {record.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/30">
                                        <div className="p-4 bg-slate-100 rounded-full mb-4">
                                            <Clock className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="font-bold text-lg text-slate-600">No attendance records</p>
                                        <p className="text-sm text-slate-400 max-w-xs text-center mt-1">Attendance records for this student will appear here once entered.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 pb-6 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 shadow-sm">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold text-slate-800">Student Documents</CardTitle>
                                        <CardDescription className="font-medium text-slate-500">Manage admission forms, certificates, and other records</CardDescription>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="student-file-upload"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file && selectedStudent) {
                                                try {
                                                    const path = await fileActions.save(file, 'student_documents', selectedStudent.id);
                                                    await studentActions.addDocument({
                                                        studentId: selectedStudent.id,
                                                        name: file.name,
                                                        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
                                                        size: `${(file.size / 1024).toFixed(1)} KB`,
                                                        path: path
                                                    });
                                                    toast.success("Document uploaded successfully");
                                                    loadStudentDetails(selectedStudent.id); // Refresh data
                                                } catch (error: unknown) {
                                                    console.error("Failed to upload document:", error);
                                                    toast.error("Failed to upload document");
                                                }
                                            }
                                        }}
                                    />
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 rounded-xl h-10 px-4 transition-all hover:scale-105 active:scale-95"
                                        onClick={() => document.getElementById('student-file-upload')?.click()}
                                    >
                                        <Upload className="mr-2 h-4 w-4" /> Upload Document
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {documents.length > 0 ? (
                                        documents.map((doc, index) => (
                                            <Card key={index} className="group border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:border-emerald-200/60 cursor-pointer relative bg-white overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <CardContent className="p-5 flex items-start gap-4 relative z-10">
                                                    <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 ring-1 ring-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:ring-emerald-100 transition-all duration-300">
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 py-1">
                                                        <p className="font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{doc.name}</p>
                                                        <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-emerald-300 transition-colors" />
                                                            {new Date(doc.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col gap-1 -mr-2 -mt-2">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" onClick={() => window.open(fileActions.getUrl(doc.path))}>
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (confirm(`Are you sure you want to delete ${doc.name}?`)) {
                                                                    try {
                                                                        await studentActions.deleteDocument(doc.id);
                                                                        if (doc.path) {
                                                                            await fileActions.delete(doc.path);
                                                                        }
                                                                        toast.success("Document deleted");
                                                                        loadStudentDetails(selectedStudent.id);
                                                                    } catch (error: unknown) {
                                                                        console.error("Failed to delete document:", error)
                                                                        toast.error("Failed to delete document")
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-200/50 hover:bg-emerald-50/10 transition-all duration-300 cursor-pointer" onClick={() => document.getElementById('student-file-upload')?.click()}>
                                            <div className="p-4 bg-white rounded-full mb-4 shadow-sm ring-1 ring-slate-100 group-hover:scale-110 transition-transform">
                                                <UploadCloud className="h-8 w-8 text-emerald-500" />
                                            </div>
                                            <p className="font-bold text-lg text-slate-600">No documents uploaded yet</p>
                                            <p className="text-sm text-slate-400 max-w-xs text-center mt-1 mb-4">Upload admission forms, medical records, or other specific documents here.</p>
                                            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">Select a file to upload</Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default function StudentProfilesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>}>
            <StudentProfilesContent />
        </Suspense>
    )
}

