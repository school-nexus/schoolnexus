"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { columns, Student } from "./components/columns"
import { Button } from "@/components/ui/button"
import { Plus, Download, Loader2, FileText, Users, Ban, CheckCircle, Trash2, ArrowUpCircle, UserCheck, XCircle, Search, GraduationCap, ChevronRight } from "lucide-react"
import Link from "next/link"
import { studentActions, streamActions, classActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useConfirm } from "@/components/providers/confirm-provider"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Students", href: "/students" },
    { label: "List", href: "/students" },
]

interface RawStudent {
    id: number
    firstName: string
    lastName: string
    email?: string
    admissionNumber: string
    linNumber?: string
    schoolPayCode?: string
    streamId?: number
    classId?: number
    gender: string
    status?: string
    parentNames?: string
    parentContact?: string
    photoUrl?: string
}

interface RawStream {
    id: number
    name: string
    classId: number
}

interface RawClass {
    id: number
    name: string
}

export default function StudentListPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [loading, setLoading] = useState(true)
    const { confirm } = useConfirm()

    // Bulk Action States
    const [isPromoteOpen, setIsPromoteOpen] = useState(false)
    const [selectedStudentsForAction, setSelectedStudentsForAction] = useState<Student[]>([])
    const [targetStreamId, setTargetStreamId] = useState<string>("")
    const [isPromoting, setIsPromoting] = useState(false)

    // Filter States
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [classFilter, setClassFilter] = useState("all")
    const [streamFilter, setStreamFilter] = useState("all")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [studentsData, streamsData, classesData] = await Promise.all([
                studentActions.getAll() as Promise<RawStudent[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                classActions.getAll() as Promise<RawClass[]>
            ])

            // Map database students to UI format
            const mappedStudents: Student[] = studentsData.map((s) => {
                const stream = streamsData.find((st) => st.id === s.streamId)
                const cls = classesData.find((c) => c.id === (s.classId || stream?.classId))

                return {
                    id: s.id.toString(),
                    firstName: s.firstName,
                    lastName: s.lastName,
                    email: s.email || "N/A",
                    admissionNumber: s.admissionNumber,
                    linNumber: s.linNumber || "N/A",
                    schoolPayCode: s.schoolPayCode || "N/A",
                    class: cls?.name || "N/A",
                    stream: stream?.name || "N/A",
                    gender: s.gender as "Male" | "Female",
                    status: (s.status || "Active") as "Active" | "Inactive" | "Suspended",
                    guardianName: s.parentNames || "N/A",
                    guardianPhone: s.parentContact || "N/A",
                    photoUrl: s.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.firstName}`
                }
            })

            setStudents(mappedStudents)
            setStreams(streamsData)
            setClasses(classesData)
        } catch (error: unknown) {
            console.error("Failed to fetch students:", error)
            toast.error("Failed to load students")
        } finally {
            setLoading(false)
        }
    }

    const filteredStudents = students.filter((s) => {
        // Exclude archived/graduated/transferred from main list
        const isArchived = ["Archived", "Graduated", "Transferred"].includes(s.status);
        if (isArchived) return false;

        const matchesSearch =
            searchQuery === "" ||
            s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || s.status === statusFilter;
        const matchesClass = classFilter === "all" || s.class === classFilter;
        const matchesStream = streamFilter === "all" || s.stream === streamFilter;
        return matchesSearch && matchesStatus && matchesClass && matchesStream;
    });

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    const handleExportPDF = async () => {
        try {
            const profile = await schoolProfileActions.get()
            const doc = new jsPDF()
            const pageWidth = doc.internal.pageSize.getWidth()

            // Header
            doc.setFontSize(22)
            doc.setTextColor(16, 185, 129) // Emerald-500
            doc.text(profile?.name || "School Nexus", pageWidth / 2, 15, { align: "center" })

            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139) // Slate-500
            doc.text(`${profile?.address || "P.O. Box 123, Kampala, Uganda"} | Tel: ${profile?.phone || "+256 772 123456"} | Email: ${profile?.email || "info@schoolnexus.com"}`, pageWidth / 2, 22, { align: "center" })

            doc.setDrawColor(226, 232, 240) // Slate-200
            doc.line(20, 25, pageWidth - 20, 25)

            doc.setFontSize(12)
            doc.setTextColor(30, 41, 59) // Slate-800
            doc.text("STUDENT LIST REPORT", pageWidth / 2, 32, { align: "center" })

            doc.setFontSize(10)
            doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 40, { align: "right" })

            const tableColumn = ["Adm No", "Name", "Class", "Stream", "Gender", "Status", "Email", "LIN", "Pay Code"]
            const tableRows: string[][] = students.map(s => [
                s.admissionNumber || "",
                `${s.firstName} ${s.lastName}`,
                s.class || "",
                s.stream || "",
                s.gender || "",
                s.status || "",
                s.email || "",
                s.linNumber || "",
                s.schoolPayCode || ""
            ])

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    1: { halign: 'left' }, // Name
                    6: { halign: 'left' }  // Guardian
                },
                alternateRowStyles: { fillColor: [248, 250, 252] } // Slate-50
            })

            // Footer
            // @ts-expect-error - jspdf-autotable adds lastAutoTable to jsPDF instance
            const lastTable = doc.lastAutoTable
            const finalY = lastTable ? lastTable.finalY : 150
            doc.setFontSize(9)
            doc.setTextColor(148, 163, 184) // Slate-400
            doc.text(`Generated by ${profile?.name || "School Nexus"} Management System`, pageWidth / 2, finalY + 15, { align: "center" })

            doc.save("students_list.pdf")
            toast.success("PDF exported successfully")
        } catch (error: unknown) {
            console.error("Failed to export PDF:", error)
            toast.error("Failed to export PDF")
        }
    }

    const handleExportCSV = () => {
        const headers = ["Admission No", "First Name", "Last Name", "Class", "Stream", "Gender", "Status", "Email", "LIN Number", "SchoolPay Code", "Guardian Name", "Guardian Phone"]
        const csvContent = [
            headers.join(","),
            ...students.map(s => [
                s.admissionNumber,
                `"${s.firstName}"`,
                `"${s.lastName}"`,
                s.class,
                s.stream,
                s.gender,
                s.status,
                `"${s.email}"`,
                `"${s.linNumber}"`,
                `"${s.schoolPayCode}"`,
                `"${s.guardianName}"`,
                `"${s.guardianPhone}"`
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "students_export.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("CSV exported successfully")
    }

    const handleBulkArchive = async (selectedStudents: Student[]) => {
        if (await confirm({
            title: "Archive Students",
            description: `Are you sure you want to archive ${selectedStudents.length} students?`,
            confirmText: "Archive All",
            variant: "destructive"
        })) {
            try {
                await Promise.all(selectedStudents.map(s => studentActions.delete(parseInt(s.id))))
                toast.success(`${selectedStudents.length} students archived successfully`)
                fetchData()
            } catch (error: unknown) {
                console.error("Failed to archive students:", error)
                toast.error("Failed to archive some students")
            }
        }
    }

    const handleBulkStatusChange = async (selectedStudents: Student[], status: string) => {
        if (await confirm({
            title: "Change Status",
            description: `Are you sure you want to mark ${selectedStudents.length} students as ${status}?`,
            confirmText: "Update Status",
            variant: status === "Active" ? "default" : "destructive"
        })) {
            try {
                // We use loop here because update endpoint is single item
                // Ideally backend should support bulk update
                await Promise.all(selectedStudents.map(s => studentActions.update({
                    id: parseInt(s.id),
                    status
                })))
                toast.success(`${selectedStudents.length} students marked as ${status}`)
                fetchData()
            } catch (error: unknown) {
                console.error("Failed to update status:", error)
                toast.error("Failed to update status")
            }
        }
    }

    const handleBulkPromoteSubmit = async () => {
        if (!targetStreamId) {
            toast.error("Please select a target class")
            return
        }

        setIsPromoting(true)
        try {
            if (targetStreamId === 'graduate') {
                await studentActions.promote({
                    studentIds: selectedStudentsForAction.map(s => parseInt(s.id)),
                    status: 'Graduated'
                })
                toast.success(`${selectedStudentsForAction.length} students graduated successfully`)
            } else {
                await studentActions.promote({
                    studentIds: selectedStudentsForAction.map(s => parseInt(s.id)),
                    targetStreamId: parseInt(targetStreamId)
                })
                toast.success(`${selectedStudentsForAction.length} students promoted successfully`)
            }

            setIsPromoteOpen(false)
            setTargetStreamId("")
            setSelectedStudentsForAction([])
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to promote students:", error)
            toast.error("Failed to promote students")
        } finally {
            setIsPromoting(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 p-6 md:p-8 space-y-8 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-50/50 to-transparent -z-10" />
            <div className="absolute right-0 top-0 w-96 h-96 bg-teal-100/30 blur-3xl rounded-full -z-10" />
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-emerald-100/30 blur-3xl rounded-full -z-10" />

            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-slate-900 text-bold">Students</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-emerald-600">List</span>
                </nav>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Enrollment</h1>
                        <p className="text-slate-500 text-base max-w-2xl font-medium leading-relaxed">
                            Manage and monitor student profiles, academic progress, and status across all levels.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button onClick={handleExportCSV} className="bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-xl shadow-slate-200/50 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                            <FileText className="h-4 w-4 text-emerald-600" /> Export CSV
                        </Button>
                        <Button onClick={handleExportPDF} className="bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-xl shadow-slate-200/50 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                            <Download className="h-4 w-4 text-emerald-600" /> Export PDF
                        </Button>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                            <Link href="/students/add">
                                <Plus className="h-4 w-4" /> Add Student
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Advanced Filter Console */}
                <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-visible rounded-3xl">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Member Status
                                </label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg py-3">All Statuses</SelectItem>
                                        <SelectItem value="Active" className="rounded-lg py-3">Active</SelectItem>
                                        <SelectItem value="Inactive" className="rounded-lg py-3">Inactive</SelectItem>
                                        <SelectItem value="Suspended" className="rounded-lg py-3">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-emerald-500" /> Class Level
                                </label>
                                <Select value={classFilter} onValueChange={setClassFilter}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg py-3">All Classes</SelectItem>
                                        {Array.from(new Set(classes.map(c => c.name))).map(name => (
                                            <SelectItem key={name} value={name} className="rounded-lg py-3">{name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Users className="h-4 w-4 text-emerald-500" /> Stream
                                </label>
                                <Select value={streamFilter} onValueChange={setStreamFilter}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="All Streams" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg py-3">All Streams</SelectItem>
                                        {Array.from(new Set(streams.map(s => s.name))).map(name => (
                                            <SelectItem key={name} value={name} className="rounded-lg py-3">{name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Search className="h-4 w-4 text-emerald-500" /> Search Identity
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Name or ID..."
                                        className="pl-12 bg-slate-50 border-0 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-2xl shadow-slate-200/20 rounded-[32px] overflow-hidden p-2">
                    <DataTable
                        columns={columns}
                        data={filteredStudents}
                        showViewOptions={false}
                        className="border-0 shadow-none bg-transparent"
                        containerClassName="relative z-10"
                        bulkActions={(selectedRows) => (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedStudentsForAction(selectedRows)
                                        setIsPromoteOpen(true)
                                    }}
                                    className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                >
                                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                                    Promote ({selectedRows.length})
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
                                        >
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Change Status
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onClick={() => handleBulkStatusChange(selectedRows, "Active")}>
                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Mark Active
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBulkStatusChange(selectedRows, "Inactive")}>
                                            <XCircle className="mr-2 h-4 w-4 text-slate-500" /> Mark Inactive
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBulkStatusChange(selectedRows, "Suspended")} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                            <Ban className="mr-2 h-4 w-4" /> Suspend
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleBulkArchive(selectedRows)}
                                    className="h-8"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Archive ({selectedRows.length})
                                </Button>
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Promote Dialog */}
            <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Promote Students</DialogTitle>
                        <DialogDescription>
                            Promote {selectedStudentsForAction.length} selected students to a new class or graduate them.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Target Class/Stream</Label>
                            <Select value={targetStreamId} onValueChange={setTargetStreamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select target class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="graduate" className="text-teal-600 font-semibold">
                                        Graduate / Archive
                                    </SelectItem>
                                    {streams.map(s => {
                                        const cls = classes.find(c => c.id === s.classId)
                                        return (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {cls?.name} {s.name}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPromoteOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkPromoteSubmit} disabled={isPromoting || !targetStreamId} className="bg-emerald-600 hover:bg-emerald-700">
                            {isPromoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Promotion
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
