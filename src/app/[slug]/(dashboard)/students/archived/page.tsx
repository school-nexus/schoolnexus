"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Trash2, Users, Archive, Loader2, ChevronRight, Search, CheckCircle, GraduationCap } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { studentActions } from "@/lib/electron"
import { toast } from "sonner"

type ArchivedStudent = {
    id: string
    studentId: string
    name: string
    lastClass: string
    archivedDate: string
    reason: "Graduated" | "Transferred" | "Expelled" | "Withdrawn" | "Archived"
}

import { useConfirm } from "@/components/providers/confirm-provider"

export default function ArchivedStudentsPage() {
    const { confirm } = useConfirm()
    const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, graduated: 0, transferred: 0, other: 0 })

    // Filter States
    const [searchQuery, setSearchQuery] = useState("")
    const [reasonFilter, setReasonFilter] = useState("all")

    const filteredStudents = archivedStudents.filter(s => {
        const matchesSearch = searchQuery === "" ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesReason = reasonFilter === "all" || s.reason === reasonFilter;
        return matchesSearch && matchesReason;
    });

    const columns: ColumnDef<ArchivedStudent>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "studentId",
            header: "ID",
            cell: ({ row }) => <span className="font-medium text-slate-600">{row.getValue("studentId")}</span>,
        },
        {
            accessorKey: "name",
            header: "Student Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                        {row.getValue<string>("name").charAt(0)}
                    </div>
                    <span className="font-medium text-slate-900">{row.getValue("name")}</span>
                </div>
            ),
        },
        {
            accessorKey: "lastClass",
            header: "Last Class",
            cell: ({ row }) => <span className="text-slate-600">{row.getValue("lastClass")}</span>,
        },
        {
            accessorKey: "archivedDate",
            header: "Archived Date",
            cell: ({ row }) => <span className="text-slate-500 text-xs">{row.getValue("archivedDate")}</span>,
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => {
                const reason = row.getValue("reason") as string
                return (
                    <Badge variant="outline" className={
                        reason === "Graduated" ? "bg-teal-50 text-teal-700 border-teal-200" :
                            reason === "Transferred" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                reason === "Expelled" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                    "bg-slate-50 text-slate-700 border-slate-200"
                    }>
                        {reason}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const student = row.original
                return (
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Restore"
                            onClick={async () => {
                                if (await confirm({
                                    title: "Restore Student",
                                    description: `Are you sure you want to restore ${student.name}?`,
                                    confirmText: "Restore",
                                    variant: "default"
                                })) {
                                    try {
                                        await studentActions.restore(parseInt(student.id))
                                        toast.success("Student restored successfully")
                                        window.location.reload()
                                    } catch (error: unknown) {
                                        console.error("Failed to restore student:", error)
                                        toast.error("Failed to restore student")
                                    }
                                }
                            }}
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Permanently Delete"
                            onClick={async () => {
                                if (await confirm({
                                    title: "Permanently Delete",
                                    description: `Are you sure you want to PERMANENTLY delete ${student.name}? This action cannot be undone.`,
                                    confirmText: "Delete Permanently",
                                    variant: "destructive"
                                })) {
                                    try {
                                        await studentActions.permanentDelete(parseInt(student.id))
                                        toast.success("Student permanently deleted")
                                        window.location.reload()
                                    } catch (error: unknown) {
                                        console.error("Failed to delete student:", error)
                                        toast.error("Failed to delete student")
                                    }
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const allStudents = await studentActions.getAll() as {
                id: number;
                firstName: string;
                lastName: string;
                streamName?: string;
                status: string;
                updatedAt?: string;
            }[]
            // Filter for archived/inactive students
            const archived = allStudents.filter((s) =>
                s.status === 'Archived' || s.status === 'Inactive' || s.status === 'Graduated' || s.status === 'Transferred'
            )

            const mappedStudents: ArchivedStudent[] = archived.map((s) => ({
                id: s.id.toString(),
                studentId: `STU-${s.id.toString().padStart(3, '0')}`,
                name: `${s.firstName} ${s.lastName}`,
                lastClass: s.streamName || 'N/A',
                archivedDate: s.updatedAt ? new Date(s.updatedAt).toISOString().split('T')[0] : 'N/A',
                reason: (s.status === 'Graduated' ? 'Graduated' :
                    s.status === 'Transferred' ? 'Transferred' :
                        s.status === 'Inactive' ? 'Withdrawn' : 'Archived') as ArchivedStudent['reason']
            }))

            setArchivedStudents(mappedStudents)
            setStats({
                total: mappedStudents.length,
                graduated: mappedStudents.filter(s => s.reason === 'Graduated').length,
                transferred: mappedStudents.filter(s => s.reason === 'Transferred').length,
                other: mappedStudents.filter(s => s.reason !== 'Graduated' && s.reason !== 'Transferred').length
            })
        } catch (error: unknown) {
            console.error("Failed to fetch archived students:", error)
            toast.error("Failed to load archived students")
        } finally {
            setLoading(false)
        }
    }

    const handleBulkRestore = async (selectedRows: ArchivedStudent[]) => {
        if (await confirm({
            title: "Restore Students",
            description: `Are you sure you want to restore ${selectedRows.length} students?`,
            confirmText: "Restore All",
            variant: "default"
        })) {
            try {
                await studentActions.restoreBulk(selectedRows.map(s => parseInt(s.id)))
                toast.success(`${selectedRows.length} students restored successfully`)
                fetchData()
            } catch (error: unknown) {
                console.error("Failed to restore students:", error)
                toast.error("Failed to restore students")
            }
        }
    }

    const handleBulkPermanentDelete = async (selectedRows: ArchivedStudent[]) => {
        if (await confirm({
            title: "Permanently Delete",
            description: `Are you sure you want to PERMANENTLY delete ${selectedRows.length} students? This action cannot be undone.`,
            confirmText: "Delete Permanently",
            variant: "destructive"
        })) {
            try {
                await studentActions.permanentDeleteBulk(selectedRows.map(s => parseInt(s.id)))
                toast.success(`${selectedRows.length} students permanently deleted`)
                fetchData()
            } catch (error: unknown) {
                console.error("Failed to delete students:", error)
                toast.error("Failed to delete students")
            }
        }
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-slate-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8 relative z-10 pb-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/students" className="hover:text-emerald-600 transition-colors">Students</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-emerald-600 font-bold">Archived</span>
                </nav>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Archived Students</h1>
                        <p className="text-slate-500 text-base max-w-2xl font-medium leading-relaxed">
                            Complete historical records of students who have graduated, transferred, or left the institution.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden transition-all hover:scale-[1.02]">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center ring-1 ring-slate-200 shadow-sm">
                                <Archive className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Total</p>
                                <p className="text-3xl font-black text-slate-900">{stats.total}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden transition-all hover:scale-[1.02]">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-100 shadow-sm">
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs text-teal-600/60 font-black uppercase tracking-widest">Graduated</p>
                                <p className="text-3xl font-black text-slate-900">{stats.graduated}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden transition-all hover:scale-[1.02]">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100 shadow-sm">
                                <CheckCircle className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-600/60 font-black uppercase tracking-widest">Transferred</p>
                                <p className="text-3xl font-black text-slate-900">{stats.transferred}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden transition-all hover:scale-[1.02]">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center ring-1 ring-slate-100 shadow-sm">
                                <Users className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Other</p>
                                <p className="text-3xl font-black text-slate-900">{stats.other}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Advanced Filter Console */}
                <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-visible rounded-3xl">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Archive className="h-4 w-4 text-emerald-500" /> Archive Reason
                                </label>
                                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="All Reasons" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg py-3">All Reasons</SelectItem>
                                        <SelectItem value="Graduated" className="rounded-lg py-3">Graduated</SelectItem>
                                        <SelectItem value="Transferred" className="rounded-lg py-3">Transferred</SelectItem>
                                        <SelectItem value="Archived" className="rounded-lg py-3">Archived</SelectItem>
                                        <SelectItem value="Withdrawn" className="rounded-lg py-3">Withdrawn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3 lg:col-span-2">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Search className="h-4 w-4 text-emerald-500" /> Student Identity
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Search name or ID..."
                                        className="pl-12 bg-slate-50 border-0 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-[32px] overflow-hidden">
                    <CardContent className="p-2">
                        {archivedStudents.length > 0 ? (
                            <DataTable
                                columns={columns}
                                data={filteredStudents}
                                showViewOptions={false}
                                className="border-0 shadow-none bg-transparent"
                                bulkActions={(selectedRows) => (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkRestore(selectedRows)}
                                            className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Restore Selected ({selectedRows.length})
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleBulkPermanentDelete(selectedRows)}
                                            className="h-8"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Permanently ({selectedRows.length})
                                        </Button>
                                    </div>
                                )}
                            />
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <Archive className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-medium">No archived students found.</p>
                                <p className="text-sm text-slate-400 mt-1">Students marked as archived will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

