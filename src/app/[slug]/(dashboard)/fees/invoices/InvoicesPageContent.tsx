"use client"

import { useState, useEffect, useMemo } from "react"
import { AlertCircle, ArrowUpDown, BadgeInfo, Briefcase, Calendar, CheckCircle2, ChevronRight, Clock, CreditCard, Download, Eye, FilePlus2, FileText, Filter, FilterX, GraduationCap, Hash, Layers, LayoutGrid, List, Loader2, Mail, MapPin, MoreVertical, Phone, Plus, Printer, Receipt, RefreshCw, School, Search, Send, Sparkles, Trash2, User, Users, X } from 'lucide-react';
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Label } from "@/components/ui/label"
import {
    feeActions, studentActions, academicYearActions,
    termActions, classActions, streamActions, schoolProfileActions,
    invoiceActions
} from "@/lib/electron"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import {
    Dialog, DialogContent, DialogDescription,
    DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoicePreview } from "./components/InvoicePreview"
import { columns } from "./components/columns"
import {
    useReactTable, getCoreRowModel, getPaginationRowModel,
    getSortedRowModel, getFilteredRowModel, flexRender,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { printDiv } from "@/lib/printUtils"
import { useApp } from "@/context/AppContext"

export interface RawInvoice {
    id: number
    invoiceNumber: string
    studentName: string
    studentAdmNo: string
    className: string
    amount: number
    paidAmount: number
    status: string
    dueDate: string
    createdAt: string
    classId: number
    termId: number
    guardianName?: string
    student?: {
        admissionNumber: string
    }
}

export interface RawStudent {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
}

export interface RawClass {
    id: number
    name: string
}

export interface RawStream {
    id: number
    name: string
}

export interface RawProfile {
    name: string
    motto: string
    address: string
    phone: string
    email: string
    logo: string
    currency: string
}

export default function InvoicesPageContent() {
    const router = useRouter()
    const { activeYear, activeTerm, allYears, allTerms } = useApp()

    // Data State
    const [invoices, setInvoices] = useState<RawInvoice[]>([])
    const [students, setStudents] = useState<RawStudent[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [schoolProfile, setSchoolProfile] = useState<RawProfile | null>(null)
    const [loading, setLoading] = useState(true)

    // UI State
    const [isGenerateOpen, setIsGenerateOpen] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<RawInvoice | null>(null)
    const [invoiceToDelete, setInvoiceToDelete] = useState<RawInvoice | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [generationType, setGenerationType] = useState<"individual" | "class">("individual")

    // Filter State
    const [selectedClass, setSelectedClass] = useState("all")
    const [selectedTerm, setSelectedTerm] = useState<string>("all")

    // Update selected term when global active term changes
    useEffect(() => {
        if (activeTerm) {
            setSelectedTerm(activeTerm.id.toString())
        }
    }, [activeTerm])

    // Form State
    const [formData, setFormData] = useState({
        studentId: "",
        classId: "",
        termId: "",
        academicYearId: "",
        dueDate: "",
        notes: ""
    })

    const fetchData = async () => {
        setLoading(true)
        try {
            const [
                invoicesData, studentsData, classesData, streamsData, profileData
            ] = await Promise.all([
                invoiceActions.getAll() as Promise<RawInvoice[]>,
                studentActions.getAll() as Promise<RawStudent[]>,
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])

            setInvoices(invoicesData)
            setStudents(studentsData)
            setClasses(classesData)
            setStreams(streamsData)
            setSchoolProfile(profileData)
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Data synchronization failed")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [activeYear?.id, activeTerm?.id])

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesSearch =
                inv.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.studentAdmNo?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesClass = selectedClass === "all" || inv.classId?.toString() === selectedClass;
            const matchesTerm = selectedTerm === "all" || inv.termId?.toString() === selectedTerm;

            return matchesSearch && matchesClass && matchesTerm;
        })
    }, [invoices, searchQuery, selectedClass, selectedTerm])

    const stats = useMemo(() => {
        const total = invoices.length
        const totalBilled = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
        const pendingCount = invoices.filter(inv => inv.status === 'Pending').length
        const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length
        return { total, totalBilled, pendingCount, overdueCount }
    }, [invoices])

    // Table Logic
    const tableInstance = useReactTable({
        data: filteredInvoices,
        columns: columns(
            (inv: RawInvoice) => { setSelectedInvoice(inv); setIsPreviewOpen(true); },
            (inv: RawInvoice) => { setSelectedInvoice(inv); setTimeout(() => printDiv("invoice-content"), 100); },
            (inv: RawInvoice) => { setInvoiceToDelete(inv); },
            router
        ),
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    const handleGenerate = async () => {
        if (!formData.termId || !formData.dueDate) {
            toast.error("Please fill in required fields")
            return
        }

        toast.info("Generating invoice(s)...")
        try {
            await invoiceActions.generate({
                classId: formData.classId ? parseInt(formData.classId) : undefined,
                studentId: formData.studentId ? parseInt(formData.studentId) : undefined,
                termId: parseInt(formData.termId),
                dueDate: formData.dueDate
            })
            await fetchData()
            toast.success("Invoices generated successfully")
            setIsGenerateOpen(false)
        } catch (error: unknown) {
            toast.error("Failed to generate invoices")
        }
    }

    const handleDelete = async () => {
        if (!invoiceToDelete) return
        setIsDeleting(true)
        try {
            await invoiceActions.delete(invoiceToDelete.id)
            setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete.id))
            toast.success("Invoice deleted successfully")
            setInvoiceToDelete(null)
        } catch (error: unknown) {
            toast.error("Failed to delete invoice")
        } finally {
            setIsDeleting(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 p-6 md:p-8 space-y-8 relative overflow-hidden font-sans">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-50/50 to-transparent -z-10" />
            <div className="absolute right-0 top-0 w-96 h-96 bg-teal-100/30 blur-3xl rounded-full -z-10" />
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-emerald-100/30 blur-3xl rounded-full -z-10" />

            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <button onClick={() => router.push("/dashboard")} className="hover:text-emerald-600 transition-colors">Dashboard</button>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-slate-900 font-bold">Fees</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-emerald-600">Invoices</span>
                </nav>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-gradient bg-clip-text">Invoice Central</h1>
                        <p className="text-slate-500 text-sm max-w-2xl font-medium">
                            Streamlined billing and invoice management system for academic excellence.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-xl shadow-slate-200/50 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 font-bold"
                            onClick={fetchData}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("w-4 h-4 text-emerald-600", loading && "animate-spin")} />
                            Sync Database
                        </Button>
                        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 font-black uppercase tracking-tight"
                                >
                                    <Sparkles className="w-4 h-4 text-emerald-100" />
                                    Generate Billing
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
                                <div className="bg-slate-900 p-8 text-white">
                                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                        <FilePlus2 className="text-emerald-400" />
                                        Create New Billing
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400 text-sm mt-1 font-medium italic">Generate invoices for students or entire classes automagically</DialogDescription>
                                </div>
                                <div className="p-8 space-y-6">
                                    <Tabs value={generationType} onValueChange={(v) => setGenerationType(v as "individual" | "class")}>
                                        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-2xl h-12">
                                            <TabsTrigger value="individual" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                                                <User className="w-4 h-4 mr-2" />
                                                Individual
                                            </TabsTrigger>
                                            <TabsTrigger value="class" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                                                <Users className="w-4 h-4 mr-2" />
                                                By Class
                                            </TabsTrigger>
                                        </TabsList>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Academic Year</Label>
                                                <Select onValueChange={(v) => setFormData({ ...formData, academicYearId: v })}>
                                                    <SelectTrigger className="rounded-xl h-12 border-0 bg-slate-50 font-semibold focus:ring-2 focus:ring-emerald-500/20">
                                                        <SelectValue placeholder="Select Year" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                        {allYears.map(y => <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Target Term</Label>
                                                <Select onValueChange={(v) => setFormData({ ...formData, termId: v })}>
                                                    <SelectTrigger className="rounded-xl h-12 border-0 bg-slate-50 font-semibold focus:ring-2 focus:ring-emerald-500/20">
                                                        <SelectValue placeholder="Select Term" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                        {allTerms.filter(t => t.academicYearId?.toString() === formData.academicYearId).map(t => (
                                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {generationType === "individual" ? (
                                                <div className="col-span-2 space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Student</Label>
                                                    <Select onValueChange={(v) => setFormData({ ...formData, studentId: v })}>
                                                        <SelectTrigger className="rounded-xl h-12 border-0 bg-slate-50 font-semibold focus:ring-2 focus:ring-emerald-500/20">
                                                            <SelectValue placeholder="Quick search students..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                            {students.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.firstName} {s.lastName} ({s.admissionNumber})</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ) : (
                                                <div className="col-span-2 space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Target Class</Label>
                                                    <Select onValueChange={(v) => setFormData({ ...formData, classId: v })}>
                                                        <SelectTrigger className="rounded-xl h-12 border-0 bg-slate-50 font-semibold focus:ring-2 focus:ring-emerald-500/20">
                                                            <SelectValue placeholder="Select a class" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                            {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            <div className="col-span-2 space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Payment Due Date</Label>
                                                <Input
                                                    type="date"
                                                    className="rounded-xl h-12 border-0 bg-slate-50 font-semibold focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium"
                                                    value={formData.dueDate}
                                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </Tabs>
                                </div>
                                <DialogFooter className="p-8 bg-slate-50 flex gap-3">
                                    <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold" onClick={() => setIsGenerateOpen(false)}>Cancel Action</Button>
                                    <Button
                                        className="rounded-2xl h-12 flex-1 font-black bg-slate-900 text-white shadow-xl shadow-slate-200 transition-all hover:scale-[1.02]"
                                        onClick={handleGenerate}
                                    >
                                        COMMIT GENERATION
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Billed"
                        value={formatCurrency(stats.totalBilled)}
                        variant="gradient"
                        iconColor="bg-gradient-to-br from-emerald-500 to-emerald-700"
                        icon={<Briefcase className="w-5 h-5" />}
                    />
                    <StatCard
                        title="All Invoices"
                        value={stats.total}
                        variant="gradient"
                        iconColor="bg-gradient-to-br from-blue-500 to-blue-700"
                        icon={<Layers className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Pending Review"
                        value={stats.pendingCount}
                        variant="gradient"
                        iconColor="bg-gradient-to-br from-amber-500 to-amber-700"
                        icon={<Clock className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Overdue Alerts"
                        value={stats.overdueCount}
                        variant="gradient"
                        iconColor="bg-gradient-to-br from-red-500 to-red-700"
                        icon={<AlertCircle className="w-5 h-5" />}
                    />
                </div>

                {/* Advanced Filter Console */}
                <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-visible rounded-3xl">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Search className="h-4 w-4 text-emerald-500" /> Search Identity
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Name, Invoice #, ID..."
                                        className="pl-12 bg-slate-50 border-0 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-emerald-500" /> Class Level
                                </label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg py-3">All Classes</SelectItem>
                                        {classes.map(c => <SelectItem key={c.id} value={c.id.toString()} className="rounded-lg py-3">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-emerald-500" /> Academic Term
                                </label>
                                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="All Terms" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg py-3">All Terms</SelectItem>
                                        {allTerms.map(t => <SelectItem key={t.id} value={t.id.toString()} className="rounded-lg py-3">{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <div className="rounded-xl border border-emerald-100/50 bg-white shadow-xl shadow-slate-200/20 overflow-hidden">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center space-y-6">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            <p className="text-slate-400 font-black italic uppercase tracking-[6px] text-[10px]">Processing Database...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-[24px]">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    {tableInstance.getHeaderGroups().map(headerGroup => (
                                        <TableRow key={headerGroup.id} className="hover:bg-transparent border-emerald-500/30">
                                            {headerGroup.headers.map(header => (
                                                <TableHead key={header.id} className="h-11 text-[11px] font-bold text-white uppercase tracking-wider border-r border-emerald-500/30 last:border-0">
                                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {tableInstance.getRowModel().rows.length > 0 ? (
                                        tableInstance.getRowModel().rows.map((row, idx) => (
                                            <TableRow
                                                key={row.id}
                                                className={cn(
                                                    "group hover:bg-emerald-50 transition-colors border-emerald-100/50",
                                                    idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                                )}
                                            >
                                                {row.getVisibleCells().map(cell => (
                                                    <TableCell key={cell.id} className="py-3 text-sm border-r border-emerald-100/50 last:border-0">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={tableInstance.getVisibleFlatColumns().length} className="h-96 text-center py-8 text-slate-400">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center">
                                                        <Search className="w-10 h-10 text-slate-200" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-lg font-black text-slate-800">No Invoices Found</p>
                                                        <p className="text-sm italic font-medium">Try searching with a different term</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="p-4 border-t border-emerald-100/50 bg-white flex items-center justify-between">
                        <div className="flex-1 text-xs text-muted-foreground">
                            Page {tableInstance.getState().pagination.pageIndex + 1} of {tableInstance.getPageCount()}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline" size="sm"
                                className="h-8 w-20"
                                onClick={() => tableInstance.previousPage()}
                                disabled={!tableInstance.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                className="h-8 w-20"
                                onClick={() => tableInstance.nextPage()}
                                disabled={!tableInstance.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Dialogs */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-[170mm] w-[95vw] h-[95vh] p-0 overflow-hidden border-none rounded-[40px] shadow-2xl flex flex-col">
                        <DialogHeader className="sr-only print:hidden">
                            <DialogTitle>Invoice Preview</DialogTitle>
                            <DialogDescription>Quick look at the selected invoice</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="flex-1 print:max-h-none print:overflow-visible overflow-auto">
                            <div className="p-10 bg-slate-50 print:p-0 print:bg-white flex justify-center">
                                {selectedInvoice && (
                                    <InvoicePreview
                                        id="printable-invoice"
                                        invoice={selectedInvoice}
                                        schoolProfile={schoolProfile}
                                    />
                                )}
                            </div>
                        </ScrollArea>
                        <div className="p-8 pb-14 bg-white border-t border-slate-100 flex items-center justify-between print:hidden">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Reference</span>
                                <span className="text-sm font-black text-slate-900 mt-1">INV-{selectedInvoice?.invoiceNumber}</span>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="ghost" className="rounded-2xl font-bold h-12 px-8" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                                <Button
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black h-12 px-8 shadow-xl shadow-slate-200 transition-all hover:scale-[1.02]"
                                    onClick={() => printDiv("printable-invoice")}
                                >
                                    <Printer className="w-4 h-4 mr-2 text-emerald-400" />
                                    PRINT
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!invoiceToDelete} onOpenChange={() => setInvoiceToDelete(null)}>
                    <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Void Invoice?</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium leading-relaxed italic mt-2">
                                Permanent deletion of invoice <span className="text-slate-900 font-black">#{invoiceToDelete?.invoiceNumber}</span>.
                                This will also affect payment history.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-8 flex gap-3">
                            <Button variant="ghost" className="flex-1 font-bold rounded-2xl h-12" onClick={() => setInvoiceToDelete(null)}>Cancel Action</Button>
                            <Button
                                variant="destructive"
                                className="flex-1 font-black rounded-2xl bg-red-600 hover:bg-red-700 h-12 shadow-lg shadow-red-200 transition-all hover:scale-[1.02]"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Voiding..." : "VOID INVOICE"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Hidden container for background printing */}
                <div id="print-source-container" className="hidden">
                    {selectedInvoice && (
                        <InvoicePreview id="invoice-content" invoice={selectedInvoice} schoolProfile={schoolProfile} />
                    )}
                </div>
            </div>
        </div>
    )
}
