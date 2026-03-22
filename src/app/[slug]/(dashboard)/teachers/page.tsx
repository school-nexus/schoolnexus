"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { columns, Teacher } from "./components/columns"
import { Button } from "@/components/ui/button"

import Link from "next/link"
import { teacherActions, subjectActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Download, FileSpreadsheet, FileText, Filter, Loader2, Plus, Search } from 'lucide-react';
const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Teachers", href: "/teachers" },
    { label: "List", href: "/teachers" },
]

interface RawTeacher {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    qualification?: string;
    subjectId?: number;
    subject?: string;
    subjects?: string;
    gender?: string;
    status?: string;
    phone?: string;
    experience?: number;
    photoUrl?: string;
}

interface RawSubject {
    id: number;
    name: string;
}

export default function TeacherListPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTeachers()
    }, [])

    const fetchTeachers = async () => {
        setLoading(true)
        try {
            const [data, subjectsData] = await Promise.all([
                teacherActions.getAll() as Promise<RawTeacher[]>,
                subjectActions.getAll() as Promise<RawSubject[]>
            ])

            const mappedTeachers: Teacher[] = data.map((t) => ({
                id: t.id.toString(),
                firstName: t.firstName,
                lastName: t.lastName,
                email: t.email || "N/A",
                teacherId: `TCH-${t.id.toString().padStart(3, '0')}`,
                qualification: t.qualification || "N/A",
                subject: (() => {
                    try {
                        if (t.subjects) {
                            const parsed = JSON.parse(t.subjects);
                            return Array.isArray(parsed) ? parsed.join(", ") : parsed;
                        }
                        // Fallback to old single subject
                        return subjectsData.find((s) => s.id === t.subjectId)?.name || t.subject || "N/A";
                    } catch {
                        return t.subject || "N/A";
                    }
                })(),
                gender: (t.gender || "Male") as "Male" | "Female",
                status: (t.status || "Active") as "Active" | "Inactive" | "On Leave",
                phone: t.phone || "N/A",
                experience: t.experience || 0,
                photoUrl: t.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.firstName}`
            }))
            setTeachers(mappedTeachers)
        } catch (error) {
            console.error("Failed to fetch teachers:", error)
            toast.error("Failed to load teachers")
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        if (teachers.length === 0) {
            toast.error("No data to export")
            return
        }

        try {
            const exportData = teachers.map((t, idx) => ({
                "No": idx + 1,
                "Teacher ID": t.teacherId,
                "First Name": t.firstName,
                "Last Name": t.lastName,
                "Gender": t.gender,
                "Email": t.email,
                "Phone": t.phone,
                "Subject": t.subject,
                "Qualification": t.qualification,
                "Experience (Years)": t.experience,
                "Status": t.status
            }))

            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Teachers")

            const fileName = `Teachers_List_${new Date().toISOString().split('T')[0]}.xlsx`
            XLSX.writeFile(wb, fileName)
            toast.success("Teachers list exported to Excel")
        } catch (error) {
            console.error("Excel export failed:", error)
            toast.error("Failed to export to Excel")
        }
    }

    const handleExportPdf = async () => {
        if (teachers.length === 0) {
            toast.error("No data to export")
            return
        }

        try {
            const profile = await schoolProfileActions.get()
            const doc = new jsPDF('p', 'mm', 'a4')
            const pageWidth = doc.internal.pageSize.getWidth()

            // Add Header
            doc.setFontSize(22)
            doc.setTextColor(13, 148, 136) // Teal-600
            doc.text(profile?.name || "School Nexus", pageWidth / 2, 15, { align: "center" })

            doc.setFontSize(10)
            doc.setTextColor(100, 116, 139) // Slate-500
            doc.text(`${profile?.address || "P.O. Box 123, Kampala, Uganda"} | Tel: ${profile?.phone || "+256 772 123456"} | Email: ${profile?.email || "info@schoolnexus.com"}`, pageWidth / 2, 22, { align: "center" })

            doc.setDrawColor(226, 232, 240) // Slate-200
            doc.line(20, 25, pageWidth - 20, 25)

            doc.setFontSize(14)
            doc.setTextColor(30, 41, 59) // Slate-800
            doc.text("OFFICIAL TEACHER RECORDS", pageWidth / 2, 32, { align: "center" })

            doc.setFontSize(10)
            doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 50, 32)

            // Prepare table data
            const tableColumn = ["#", "ID", "Name", "Gender", "Phone", "Subject", "Qualification", "Exp", "Status"]
            const tableRows = teachers.map((t, idx) => [
                idx + 1,
                t.teacherId,
                `${t.firstName} ${t.lastName}`,
                t.gender,
                t.phone,
                t.subject,
                t.qualification,
                `${t.experience}y`,
                t.status
            ])

            // Generate Table
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 38,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
                headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 20 },
                    2: { halign: 'left' },
                    5: { halign: 'left' },
                    6: { halign: 'left' },
                },
                alternateRowStyles: { fillColor: [240, 253, 250] } // Teal-50
            })

            // Add Footer
            // @ts-expect-error - lastAutoTable is added by jspdf-autotable
            const lastTable = doc.lastAutoTable as { finalY: number } | undefined;
            const finalY = lastTable ? lastTable.finalY : 150
            doc.setFontSize(9)
            doc.setTextColor(148, 163, 184) // Slate-400
            doc.text(`Generated by ${profile?.name || "School Nexus"} Management System`, pageWidth / 2, finalY + 15, { align: "center" })

            const fileName = `Teachers_List_${new Date().toISOString().split('T')[0]}.pdf`
            doc.save(fileName)
            toast.success("Teachers list exported to PDF")
        } catch (error) {
            console.error("PDF export failed:", error)
            toast.error("Failed to export to PDF")
        }
    }

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [selectedSubject, setSelectedSubject] = useState<string>("all")

    // Derived state for filtering
    const filteredTeachers = teachers.filter((teacher) => {
        const matchesSearch = (teacher.firstName + " " + teacher.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.teacherId.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = selectedStatus === "all" || teacher.status === selectedStatus
        const matchesSubject = selectedSubject === "all" || teacher.subject === selectedSubject

        return matchesSearch && matchesStatus && matchesSubject
    })

    // Unique subjects for filter
    const subjects = Array.from(new Set(teachers.map(t => t.subject))).filter(s => s !== "N/A")

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 p-6 md:p-8 space-y-8 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50/50 to-transparent -z-10" />
            <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-100/30 blur-3xl rounded-full -z-10" />
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-teal-100/30 blur-3xl rounded-full -z-10" />

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1cm;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>

            <PageHeader
                title="Teacher List"
                description="Manage and view all teaching staff records."
                breadcrumbs={breadcrumbs}
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        <Button onClick={handleExportExcel} className="bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-xl shadow-slate-200/50 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
                        </Button>
                        <Button onClick={handleExportPdf} className="bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-xl shadow-slate-200/50 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                            <Download className="h-4 w-4 text-emerald-600" /> Export PDF
                        </Button>
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                            <Link href="/teachers/add">
                                <Plus className="h-4 w-4" /> Add Teacher
                            </Link>
                        </Button>
                    </div>
                }
            />

            {/* Advanced Filter Console */}
            <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-visible rounded-3xl">
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Search className="h-4 w-4 text-emerald-500" /> Search Teacher
                            </label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder="Search by name or ID..."
                                    className="pl-12 bg-slate-50 border-0 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium placeholder:text-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Filter className="h-4 w-4 text-emerald-500" /> Filter by Status
                            </label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                    <SelectItem value="all" className="rounded-lg py-3">All Status</SelectItem>
                                    <SelectItem value="Active" className="rounded-lg py-3">Active</SelectItem>
                                    <SelectItem value="Inactive" className="rounded-lg py-3">Inactive</SelectItem>
                                    <SelectItem value="On Leave" className="rounded-lg py-3">On Leave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <FileText className="h-4 w-4 text-emerald-500" /> Filter by Subject
                            </label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                    <SelectValue placeholder="All Subjects" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                    <SelectItem value="all" className="rounded-lg py-3">All Subjects</SelectItem>
                                    {subjects.map((subject, idx) => (
                                        <SelectItem key={idx} value={subject} className="rounded-lg py-3">{subject}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DataTable
                columns={columns}
                data={filteredTeachers}
                className="bg-white/70 backdrop-blur-xl border-slate-200/60 shadow-xl shadow-slate-200/20 rounded-2xl"
                containerClassName="relative z-10"
                showViewOptions={false}
            />
        </div>
    )
}

