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
    Users,
    GraduationCap,
    BookOpen,
    Award,
    MoreHorizontal,
    FileSpreadsheet,
    ChevronRight,
    Calendar,
    Loader2,
    Mail,
    Phone
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { reportActions, subjectActions } from "@/lib/electron"
import { toast } from "sonner"
import { reportUtils } from "@/lib/report-utils"

interface Teacher {
    id: number
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    gender: string | null
    qualifications: string | null
    status: string | null
    joinedDate: string | null
    subjectCount?: number
}

interface Subject {
    id: number
    name: string
}

export default function TeacherReportsPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const [selectedGender, setSelectedGender] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 20

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [teachersData, subjectData] = await Promise.all([
                reportActions.getTeacherReport() as Promise<Teacher[]>,
                subjectActions.getAll() as Promise<Subject[]>
            ])
            setTeachers(teachersData)
            setSubjects(subjectData)
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load teacher data")
        } finally {
            setLoading(false)
        }
    }

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch =
            `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.phone?.includes(searchQuery)

        const matchesStatus = selectedStatus === "all" || t.status === selectedStatus
        const matchesGender = selectedGender === "all" || t.gender === selectedGender

        return matchesSearch && matchesStatus && matchesGender
    })

    const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE)
    const currentTeachers = filteredTeachers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    if (loading) {
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
                        title="Teacher Reports"
                        description="Generate detailed reports on teacher demographics, qualifications, and assignments."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Reports", href: "/reports" },
                            { label: "Teachers" },
                        ]}
                    />
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-11 rounded-xl shadow-sm"
                            onClick={() => reportUtils.exportToExcel({
                                filename: "Teacher_Report",
                                columns: [
                                    { header: "First Name", dataKey: "firstName" },
                                    { header: "Last Name", dataKey: "lastName" },
                                    { header: "Email", dataKey: "email" },
                                    { header: "Phone", dataKey: "phone" },
                                    { header: "Gender", dataKey: "gender" },
                                    { header: "Qualifications", dataKey: "qualifications" },
                                    { header: "Status", dataKey: "status" },
                                ],
                                data: filteredTeachers as unknown as Record<string, unknown>[]
                            })}
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                        </Button>
                        <Button
                            className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02]"
                            onClick={() => reportUtils.exportToPDF({
                                title: "Teacher Information Report",
                                subtitle: `Generated for ${filteredTeachers.length} teachers`,
                                filename: "Teacher_Report",
                                columns: [
                                    { header: "Name", dataKey: "fullName" },
                                    { header: "Gender", dataKey: "gender" },
                                    { header: "Phone", dataKey: "phone" },
                                    { header: "Qualifications", dataKey: "qualifications" },
                                    { header: "Status", dataKey: "status" },
                                ],
                                data: filteredTeachers.map(t => ({
                                    ...t,
                                    fullName: `${t.firstName} ${t.lastName}`
                                })) as unknown as Record<string, unknown>[]
                            })}
                        >
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                </div>

                {/* Quick Stats Removed as requested */}

                {/* Filter Section */}
                <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50 mb-6">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 justify-between">
                                        <div className="flex items-center">
                                            <Filter className="mr-2 h-4 w-4 text-teal-500" />
                                            <span>Status: {selectedStatus === "all" ? "All" : selectedStatus}</span>
                                        </div>
                                        <MoreHorizontal className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 rounded-xl">
                                    <DropdownMenuItem onClick={() => setSelectedStatus("all")}>All Statuses</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setSelectedStatus("Active")}>Active Only</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus("Inactive")}>Inactive Only</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="space-y-1.5">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 justify-between">
                                        <div className="flex items-center">
                                            <Users className="mr-2 h-4 w-4 text-blue-500" />
                                            <span>Gender: {selectedGender === "all" ? "All" : selectedGender}</span>
                                        </div>
                                        <MoreHorizontal className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 rounded-xl">
                                    <DropdownMenuItem onClick={() => setSelectedGender("all")}>All Genders</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setSelectedGender("Male")}>Male</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedGender("Female")}>Female</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex items-center justify-end text-sm text-slate-500">
                            Showing {currentTeachers.length} of {filteredTeachers.length} teachers
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
                                        <TableHead className="font-bold text-white h-14 border-r border-emerald-500/30">Teacher</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Contact Info</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Qualifications</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Assignments</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Status</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentTeachers.length > 0 ? currentTeachers.map((teacher, idx) => (
                                        <TableRow key={teacher.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">
                                                <div className="flex flex-col">
                                                    <span>{teacher.firstName} {teacher.lastName}</span>
                                                    <span className="text-[10px] text-slate-400">{teacher.gender || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 border-r border-emerald-100/50">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {teacher.email || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {teacher.phone || 'N/A'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 text-sm border-r border-emerald-100/50 italic">{teacher.qualifications || 'N/A'}</TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-slate-400" />
                                                    <span className="font-medium text-slate-700">{teacher.subjectCount || 0} Subjects</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                    teacher.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                                )}>
                                                    {teacher.status || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                        <DropdownMenuLabel>Report Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer">View Profile</DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer">Subject Allocation</DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer">Attendance Record</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer text-teal-600">Download Dossier</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-400 border-emerald-100/50">
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-100 mt-6 font-sans">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                            <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTeachers.length)}</span> of{" "}
                            <span className="font-medium">{filteredTeachers.length}</span> results
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg h-9"
                            >
                                Previous
                            </Button>
                            {[...Array(totalPages)].map((_, i) => (
                                <Button
                                    key={i + 1}
                                    variant={currentPage === i + 1 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={cn(
                                        "rounded-lg w-9 h-9 p-0",
                                        currentPage === i + 1 ? "bg-teal-600 hover:bg-teal-700" : ""
                                    )}
                                >
                                    {i + 1}
                                </Button>
                            )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg h-9"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

