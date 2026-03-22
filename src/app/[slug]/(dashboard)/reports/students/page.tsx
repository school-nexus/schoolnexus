export const runtime = 'edge';
"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    Filter,
    Download,
    Users,
    UserCheck,
    UserMinus,
    MapPin,
    Calendar,
    FileSpreadsheet,
    FileText,
    MoreHorizontal,
    ChevronRight,
    GraduationCap,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { reportActions, streamActions, classActions, studentActions } from "@/lib/electron"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { reportUtils } from "@/lib/report-utils"

interface Student {
    id: number
    admissionNumber: string
    firstName: string
    lastName: string
    gender: string
    status: string | null
    enrollmentDate: string | null
    streamId: number | null
    streamName?: string
    className?: string
}

interface Class {
    id: number
    name: string
}

interface Stream {
    id: number
    name: string
    classId: number
}

export default function StudentReportsPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [streams, setStreams] = useState<Stream[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedClass, setSelectedClass] = useState("all")
    const [selectedStream, setSelectedStream] = useState("all")
    const [selectedGender, setSelectedGender] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 20

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [studentsData, streamsData, classesData] = await Promise.all([
                studentActions.getAll() as Promise<Student[]>,
                streamActions.getAll() as Promise<Stream[]>,
                classActions.getAll() as Promise<Class[]>
            ])
            setStudents(studentsData)
            setStreams(streamsData)
            setClasses(classesData)
        } catch (error: unknown) {
            console.error("Failed to fetch report data:", error)
            toast.error("Failed to load student data")
        } finally {
            setLoading(false)
        }
    }

    const getClassName = (student: Student) => {
        if (student.className && student.streamName) {
            return `${student.className} ${student.streamName}`
        }
        if (!student.streamId) return "N/A"
        const stream = streams.find(s => s.id === student.streamId)
        if (!stream) return "N/A"
        const cls = classes.find(c => c.id === stream.classId)
        return `${cls?.name || 'Unknown'} ${stream.name}`
    }

    const activeCount = students.filter(s => s.status === 'Active').length
    const inactiveCount = students.filter(s => s.status !== 'Active').length

    // Calculate new this term (enrolled in last 3 months)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const newThisTerm = students.filter(s => {
        if (!s.enrollmentDate) return false
        return new Date(s.enrollmentDate) > threeMonthsAgo
    }).length

    const filteredStudents = students.filter(student => {
        const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesClass = selectedClass === "all" || (student.streamId && streams.find(s => s.id === student.streamId)?.classId.toString() === selectedClass)
        const matchesStream = selectedStream === "all" || student.streamId?.toString() === selectedStream
        const matchesGender = selectedGender === "all" || student.gender === selectedGender
        const matchesStatus = selectedStatus === "all" || student.status === selectedStatus

        return matchesSearch && matchesClass && matchesStream && matchesGender && matchesStatus
    })

    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    const handleDownloadDossier = (student: Student) => {
        reportUtils.exportToPDF({
            title: `Student Dossier: ${student.firstName} ${student.lastName}`,
            subtitle: `Admission No: ${student.admissionNumber} | Class: ${getClassName(student)}`,
            filename: `Dossier_${student.admissionNumber}`,
            columns: [
                { header: "Field", dataKey: "field" },
                { header: "Details", dataKey: "value" }
            ],
            data: [
                { field: "Full Name", value: `${student.firstName} ${student.lastName}` },
                { field: "Admission Number", value: student.admissionNumber },
                { field: "Gender", value: student.gender },
                { field: "Class", value: getClassName(student) },
                { field: "Status", value: student.status || "Active" },
                { field: "Enrollment Date", value: student.enrollmentDate || "N/A" }
            ] as unknown as Record<string, unknown>[]
        })
        toast.success(`Dossier for ${student.firstName} downloaded`)
    }

    if (loading) {
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

            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title="Student Info Reports"
                        description="Generate detailed reports on student demographics, enrollment, and status."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Reports", href: "/reports" },
                            { label: "Student Info" },
                        ]}
                    />
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-11 rounded-xl shadow-sm"
                            onClick={() => reportUtils.exportToExcel({
                                filename: "Student_Info_Report",
                                columns: [
                                    { header: "Admission No.", dataKey: "admissionNumber" },
                                    { header: "First Name", dataKey: "firstName" },
                                    { header: "Last Name", dataKey: "lastName" },
                                    { header: "Gender", dataKey: "gender" },
                                    { header: "Class", dataKey: "fullClassName" },
                                    { header: "Enrollment Date", dataKey: "enrollmentDate" },
                                    { header: "Status", dataKey: "status" },
                                ],
                                data: filteredStudents.map(s => ({
                                    ...s,
                                    fullClassName: getClassName(s)
                                })) as unknown as Record<string, unknown>[]
                            })}
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel ({filteredStudents.length})
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02]"
                            onClick={() => reportUtils.exportToPDF({
                                title: "Student Information Report",
                                subtitle: `Generated for ${filteredStudents.length} students | Filters: ${selectedClass !== 'all' ? 'Class applied' : 'None'}`,
                                filename: "Student_Info_Report",
                                columns: [
                                    { header: "Adm No.", dataKey: "admissionNumber" },
                                    { header: "Name", dataKey: "fullName" },
                                    { header: "Gender", dataKey: "gender" },
                                    { header: "Class", dataKey: "fullClassName" },
                                    { header: "Status", dataKey: "status" },
                                ],
                                data: filteredStudents.map(s => ({
                                    ...s,
                                    fullName: `${s.firstName} ${s.lastName}`,
                                    fullClassName: getClassName(s)
                                })) as unknown as Record<string, unknown>[]
                            })}
                        >
                            <Download className="mr-2 h-4 w-4" /> Download PDF ({filteredStudents.length})
                        </Button>
                    </div>
                </div>

                {/* Quick Stats Removed as requested */}

                {/* Filter Section */}
                <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50 mb-6 font-sans">
                    <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search name or ID..."
                                    className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl cursor-text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setSelectedStream("all"); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Select value={selectedStream} onValueChange={(val) => { setSelectedStream(val); setCurrentPage(1); }} disabled={selectedClass === "all"}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="All Streams" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Streams</SelectItem>
                                        {streams.filter(s => s.classId.toString() === selectedClass).map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={selectedGender} onValueChange={(val) => { setSelectedGender(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Gender</SelectItem>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="font-bold text-white h-14 border-r border-emerald-500/30">Student</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Class</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Gender</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Enrollment Date</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Status</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedStudents.length > 0 ? paginatedStudents.map((student, idx) => (
                                        <TableRow key={student.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">
                                                <div className="flex flex-col">
                                                    <span>{student.firstName} {student.lastName}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{student.admissionNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 font-medium border-r border-emerald-100/50">{getClassName(student)}</TableCell>
                                            <TableCell className="text-slate-600 border-r border-emerald-100/50">{student.gender}</TableCell>
                                            <TableCell className="text-slate-600 font-medium border-r border-emerald-100/50">{student.enrollmentDate || 'N/A'}</TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                    student.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                                )}>
                                                    {student.status || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl font-sans">
                                                        <DropdownMenuLabel>Report Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild className="cursor-pointer">
                                                            <Link href={`/students/profiles?id=${student.id}`}>View Profile</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild className="cursor-pointer">
                                                            <Link href={`/students/profiles?id=${student.id}&tab=performance`}>Academic History</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild className="cursor-pointer">
                                                            <Link href={`/students/profiles?id=${student.id}&tab=attendance`}>Attendance Report</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-emerald-600 font-bold"
                                                            onClick={() => handleDownloadDossier(student)}
                                                        >
                                                            <Download className="mr-2 h-4 w-4" /> Download Dossier
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-slate-400 border-emerald-100/50">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Users className="h-8 w-8 opacity-20" />
                                                    <p>No students found matching your filters.</p>
                                                    <Button variant="link" onClick={() => {
                                                        setSearchQuery("");
                                                        setSelectedClass("all");
                                                        setSelectedStream("all");
                                                        setSelectedGender("all");
                                                        setSelectedStatus("all");
                                                    }}>Clear all filters</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Showing <span className="font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}</span> of <span className="font-bold">{filteredStudents.length}</span> students
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="h-8 rounded-lg"
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex gap-1">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <Button
                                                key={i}
                                                variant={currentPage === i + 1 ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={cn("h-8 w-8 p-0 rounded-lg", currentPage === i + 1 ? "bg-emerald-600" : "")}
                                            >
                                                {i + 1}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="h-8 rounded-lg"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-emerald-600 text-white">
                        <CardContent className="p-6 flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold">Custom Report Builder</h4>
                                <p className="text-emerald-100 text-sm leading-relaxed">
                                    Need a specific data set? Use our custom report builder to select fields and apply complex filters.
                                </p>
                                <Button variant="link" className="text-white p-0 h-auto font-bold mt-2 flex items-center gap-1">
                                    Open Builder <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-7 w-7" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900">Scheduled Reports</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Automate your reporting. Schedule this report to be sent to your email every Monday morning.
                                </p>
                                <Button variant="link" className="text-emerald-600 p-0 h-auto font-bold mt-2 flex items-center gap-1">
                                    Manage Schedules <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

