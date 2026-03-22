"use client"
export const runtime = 'edge';

import { useState, useEffect, useMemo, Suspense } from "react"
import { AlertCircle, ArrowUpDown, Briefcase, Calendar, CheckCircle2, ChevronRight, Clock, CreditCard, Download, Eye, FileText, Filter, FilterX, GraduationCap, Hash, Layers, Loader2, MoreVertical, Plus, Printer, Receipt, RefreshCw, Search, Sparkles, Trash2, User, X } from 'lucide-react';
import { feeActions, studentActions, schoolProfileActions } from "@/lib/electron"
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
import { ReceiptPreview } from "./components/ReceiptPreview"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { printDiv } from "@/lib/printUtils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useApp } from "@/context/AppContext"

export interface RawReceipt {
    id: number
    receiptNumber: string
    studentName: string
    studentAdmNo: string
    className: string
    amount: number
    date: string
    termName: string
    academicYearName: string
    studentId: number
    paymentMethod?: string
    reference?: string
    notes?: string
    paidBy?: string
    guardianName?: string
}

interface RawStudent {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
}

export interface RawProfile {
    name: string
    motto: string
    address: string
    phone: string
    email: string
    logo?: string
    currency?: string
}

function ReceiptsPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { activeYear, activeTerm } = useApp()
    const studentIdParam = searchParams.get("studentId")
    const filterParam = searchParams.get("filter")

    const [receipts, setReceipts] = useState<RawReceipt[]>([])
    const [students, setStudents] = useState<RawStudent[]>([])
    const [schoolProfile, setSchoolProfile] = useState<RawProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedReceipt, setSelectedReceipt] = useState<RawReceipt | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [receiptToDelete, setReceiptToDelete] = useState<RawReceipt | null>(null)

    const stats = useMemo(() => {
        const total = receipts.reduce((sum, r) => sum + (r.amount || 0), 0)
        const todayCount = receipts.filter(r => r.date === new Date().toISOString().split('T')[0]).length
        const totalCount = receipts.length
        const avgPayment = totalCount > 0 ? total / totalCount : 0

        return {
            totalAmount: total,
            totalCount,
            todayCount,
            avgPayment
        }
    }, [receipts])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [paymentsData, studentsData, profileData] = await Promise.all([
                feeActions.getAllPayments() as Promise<RawReceipt[]>,
                studentActions.getAll() as Promise<RawStudent[]>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])

            setStudents(studentsData)
            setSchoolProfile(profileData)

            let enriched = paymentsData

            // Apply query param filters
            if (studentIdParam) {
                enriched = enriched.filter((r: RawReceipt) => r.studentId === parseInt(studentIdParam))
            }

            if (filterParam === "today") {
                const today = new Date().toISOString().split("T")[0]
                enriched = enriched.filter((r: RawReceipt) => r.date === today)
            }

            setReceipts(enriched)
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load receipts")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [studentIdParam, filterParam, activeYear?.id, activeTerm?.id])

    const filteredReceipts = useMemo(() => {
        return receipts.filter(r =>
            r.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.studentAdmNo?.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [receipts, searchQuery])

    const handlePrint = (receipt: RawReceipt) => {
        setSelectedReceipt(receipt)
        // Check if we are printing from the preview modal or from the table
        const id = isPreviewOpen ? "printable-receipt" : "receipt-content"
        setTimeout(() => printDiv(id), 100)
    }

    const handleDelete = async () => {
        if (!receiptToDelete) return
        setIsDeleting(true)
        try {
            await feeActions.deletePayment(receiptToDelete.id)
            setReceipts(prev => prev.filter(r => r.id !== receiptToDelete.id))
            toast.success("Receipt deleted successfully")
            setReceiptToDelete(null)
        } catch (error: unknown) {
            toast.error("Failed to delete receipt")
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
                    <span className="text-emerald-600">Receipts</span>
                </nav>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Receipt Ledger</h1>
                        <p className="text-slate-500 text-sm max-w-2xl font-medium tracking-tight">
                            Comprehensive history of all fee payments and receipt generation.
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
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 font-black uppercase tracking-tight"
                            onClick={() => router.push("/fees/payments")}
                        >
                            <Plus className="w-4 h-4 text-emerald-100" />
                            New Payment
                        </Button>
                    </div>
                </div>

                {/* Statistics Console */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Collection"
                        value={formatCurrency(stats.totalAmount)}
                        variant="gradient"
                        iconColor="bg-gradient-to-br from-emerald-500 to-emerald-700"
                        icon={<Briefcase className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Receipts Issued"
                        value={stats.totalCount}
                        variant="gradient"
                        iconColor="bg-gradient-to-br from-blue-500 to-blue-700"
                        icon={<Receipt className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Today's Count"
                        value={stats.todayCount}
                        variant="gradient"
                        iconColor="bg-gradient-to-br from-amber-500 to-amber-700"
                        icon={<Calendar className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Average Payment"
                        value={formatCurrency(stats.avgPayment)}
                        variant="gradient"
                        iconColor="bg-gradient-to-br from-indigo-500 to-indigo-700"
                        icon={<Sparkles className="w-5 h-5" />}
                    />
                </div>

                {/* Advanced Filter Console */}
                <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-visible rounded-3xl">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Search className="h-4 w-4 text-emerald-500" /> Search Identity
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Receipt #, Name, Adm No..."
                                        className="pl-12 bg-slate-50 border-0 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-emerald-500" /> Temporal Filter
                                </label>
                                <div className="flex bg-slate-50 p-1 rounded-xl h-12 border-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "flex-1 rounded-lg h-full font-bold transition-all",
                                            !filterParam ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                                        )}
                                        onClick={() => router.push("/fees/receipts")}
                                    >
                                        All Time
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "flex-1 rounded-lg h-full font-bold transition-all",
                                            filterParam === "today" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                                        )}
                                        onClick={() => router.push("/fees/receipts?filter=today")}
                                    >
                                        Today
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <div className="rounded-xl border border-emerald-100/50 bg-white shadow-xl shadow-slate-200/20 overflow-hidden">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center space-y-6">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            <p className="text-slate-400 font-black italic uppercase tracking-[6px] text-[10px]">Syncing Records...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-[24px]">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="h-11 text-[11px] font-bold text-white uppercase tracking-wider border-r border-emerald-500/30 last:border-0">Receipt #</TableHead>
                                        <TableHead className="h-11 text-[11px] font-bold text-white uppercase tracking-wider border-r border-emerald-500/30 last:border-0">Student Details</TableHead>
                                        <TableHead className="h-11 text-[11px] font-bold text-white uppercase tracking-wider border-r border-emerald-500/30 last:border-0">Period</TableHead>
                                        <TableHead className="h-11 text-[11px] font-bold text-white uppercase tracking-wider border-r border-emerald-500/30 last:border-0 text-right">Amount</TableHead>
                                        <TableHead className="h-11 text-[11px] font-bold text-white uppercase tracking-wider text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReceipts.length > 0 ? (
                                        filteredReceipts.map((receipt, idx) => (
                                            <TableRow
                                                key={receipt.id}
                                                className={cn(
                                                    "group hover:bg-emerald-50 transition-colors border-emerald-100/50",
                                                    idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                                )}
                                            >
                                                <TableCell className="py-3 text-sm border-r border-emerald-100/50 font-semibold text-slate-900">
                                                    #{receipt.receiptNumber}
                                                </TableCell>
                                                <TableCell className="py-3 text-sm border-r border-emerald-100/50">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900 tracking-tight">{receipt.studentName}</span>
                                                        <span className="text-[10px] font-medium text-emerald-600 tracking-widest leading-none mt-1">
                                                            ADM: {receipt.studentAdmNo} &bull; {receipt.className}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 text-sm border-r border-emerald-100/50">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-700">{receipt.termName}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 mt-0.5 whitespace-nowrap">{receipt.academicYearName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 text-sm border-r border-emerald-100/50 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-slate-900">{formatCurrency(receipt.amount)}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 mt-0.5">{new Date(receipt.date).toLocaleDateString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 text-sm text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"
                                                            onClick={() => {
                                                                setSelectedReceipt(receipt)
                                                                setIsPreviewOpen(true)
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                                                            onClick={() => handlePrint(receipt)}
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 rounded-xl">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                                                                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-3 py-2">Operations</DropdownMenuLabel>
                                                                <DropdownMenuItem className="rounded-xl h-11 font-bold px-3 transition-all hover:bg-slate-50" onClick={() => handlePrint(receipt)}>
                                                                    <Printer className="w-4 h-4 mr-2 text-slate-400" />
                                                                    Print Copy
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                                                <DropdownMenuItem
                                                                    className="rounded-xl h-11 font-black px-3 text-red-500 focus:text-red-600 focus:bg-red-50 transition-all"
                                                                    onClick={() => setReceiptToDelete(receipt)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Void Receipt
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-96 text-center py-8 text-slate-400">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center">
                                                        <FilterX className="w-10 h-10 text-slate-200" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-lg font-black text-slate-800">No Receipts Found</p>
                                                        <p className="text-sm italic font-medium">Try clearing your filters or searching again</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <div className="p-6 border-t border-slate-50 bg-slate-50/30 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Showing {filteredReceipts.length} total entries from database
                    </div>
                </div>

                {/* Dialogs */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-[230mm] w-[95vw] h-[95vh] p-0 overflow-hidden border-none rounded-[40px] shadow-2xl flex flex-col">
                        <DialogHeader className="sr-only print:hidden">
                            <DialogTitle>Receipt Quick Preview</DialogTitle>
                            <DialogDescription>Review receipt details before printing</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="flex-1 print:max-h-none print:overflow-visible overflow-auto">
                            <div className="p-10 bg-slate-50 print:p-0 print:bg-white flex justify-center">
                                {selectedReceipt && (
                                    <ReceiptPreview
                                        id="printable-receipt"
                                        receipt={selectedReceipt}
                                        schoolProfile={schoolProfile}
                                    />
                                )}
                            </div>
                        </ScrollArea>
                        <div className="p-8 pb-14 bg-white border-t border-slate-100 flex items-center justify-between print:hidden">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Reference</span>
                                <span className="text-sm font-black text-slate-900 mt-1">RCP-{selectedReceipt?.receiptNumber}</span>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="ghost" className="rounded-2xl font-bold h-12 px-8" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                                <Button
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black h-12 px-8 shadow-xl shadow-slate-200 transition-all hover:scale-[1.02]"
                                    onClick={() => selectedReceipt && handlePrint(selectedReceipt)}
                                >
                                    <Printer className="w-4 h-4 mr-2 text-emerald-400" />
                                    PRINT
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!receiptToDelete} onOpenChange={() => setReceiptToDelete(null)}>
                    <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Void Receipt Record?</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium leading-relaxed italic mt-2">
                                Permanent erasure of receipt <span className="text-slate-900 font-black">#{receiptToDelete?.receiptNumber}</span>.
                                This will revert the student's balance account.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">Student:</span>
                                <span className="text-slate-900">{receiptToDelete?.studentName}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">Amount:</span>
                                <span className="text-slate-900">{formatCurrency(receiptToDelete?.amount || 0)}</span>
                            </div>
                        </div>
                        <DialogFooter className="mt-8 flex gap-3">
                            <Button variant="ghost" className="flex-1 font-bold rounded-2xl h-12" onClick={() => setReceiptToDelete(null)}>Cancel Action</Button>
                            <Button
                                variant="destructive"
                                className="flex-1 font-black rounded-2xl bg-red-600 hover:bg-red-700 h-12 shadow-lg shadow-red-200 transition-all hover:scale-[1.02]"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Processing..." : "VOID RECEIPT"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Hidden container for background printing */}
                <div id="print-source-container" className="hidden">
                    {selectedReceipt && (
                        <ReceiptPreview id="receipt-content" receipt={selectedReceipt} schoolProfile={schoolProfile} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ReceiptsPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-slate-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-slate-400 font-black italic uppercase tracking-[6px] text-[10px]">Preparing Ledger...</p>
            </div>
        }>
            <ReceiptsPageContent />
        </Suspense>
    )
}
