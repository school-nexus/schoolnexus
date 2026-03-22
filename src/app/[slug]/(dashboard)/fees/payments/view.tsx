"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Banknote, Calendar, Download, FileSpreadsheet, FileText, Filter, Loader2, Printer, Search } from 'lucide-react';
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
import { feeActions, schoolProfileActions, classActions, streamActions } from "@/lib/electron"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/dashboard/stat-card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface RawPayment {
    id: number
    amount: number
    date: string
    method: string
    receiptNumber: string
    studentName: string
    admissionNumber: string
    className: string
    invoiceNumber: string
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

interface RawProfile {
    currency: string
    name: string
    address: string
    phone: string
    email: string
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<RawPayment[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Filter State
    const [selectedClass, setSelectedClass] = useState("all")
    const [selectedStream, setSelectedStream] = useState("all")
    const [selectedMethod, setSelectedMethod] = useState("all")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [profile, setProfile] = useState<RawProfile | null>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [paymentsData, classesData, streamsData, profileData] = await Promise.all([
                feeActions.getAllPayments() as Promise<RawPayment[]>,
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])
            setPayments(paymentsData)
            setClasses(classesData)
            setStreams(streamsData)
            setProfile(profileData)
        } catch (error: unknown) {
            console.error("Failed to fetch initial data:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const handleExportPDF = async () => {
        try {
            const { default: jsPDF } = await import("jspdf")
            const { default: autoTable } = await import("jspdf-autotable")

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
            doc.text("PAYMENT HISTORY REPORT", pageWidth / 2, 32, { align: "center" })

            doc.setFontSize(10)
            doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 40, { align: "right" })

            const tableColumn = ["Date", "Receipt #", "Student", "Class", "Method", "Amount"]
            const tableRows = filteredPayments.map(p => [
                p.date,
                p.receiptNumber,
                p.studentName,
                p.className,
                p.method,
                p.amount.toLocaleString()
            ])

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    2: { halign: 'left' }, // Student Name
                    5: { halign: 'right' } // Amount
                },
                alternateRowStyles: { fillColor: [248, 250, 252] } // Slate-50
            })

            // Footer
            // @ts-expect-error - jspdf-autotable adds lastAutoTable to jsPDF instance
            const lastTable = (doc as any).lastAutoTable
            const finalY = lastTable ? lastTable.finalY : 150
            doc.setFontSize(9)
            doc.setTextColor(148, 163, 184) // Slate-400
            doc.text(`Generated by ${profile?.name || "School Nexus"} Management System`, pageWidth / 2, finalY + 15, { align: "center" })

            doc.save("payments_report.pdf")
            toast.success("PDF exported successfully")
        } catch (error: unknown) {
            console.error("PDF export failed:", error)
            toast.error("Failed to export to PDF")
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleExportCSV = () => {
        const headers = ["Date", "Receipt Number", "Student Name", "Admission No", "Class", "Method", "Invoice Number", "Amount"]
        const csvContent = [
            headers.join(","),
            ...filteredPayments.map(p => [
                p.date,
                p.receiptNumber,
                `"${p.studentName}"`,
                p.admissionNumber,
                p.className,
                p.method,
                p.invoiceNumber || "N/A",
                p.amount
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "payments_export.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("CSV exported successfully")
    }

    const filteredPayments = payments.filter(p => {
        const matchesSearch = p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesClass = selectedClass === "all" || p.className?.includes(classes.find(c => c.id.toString() === selectedClass)?.name || "")
        const matchesStream = selectedStream === "all" || p.className?.includes(streams.find(s => s.id.toString() === selectedStream)?.name || "")
        const matchesMethod = selectedMethod === "all" || p.method?.toLowerCase() === selectedMethod.toLowerCase()

        const paymentDate = new Date(p.date)
        const matchesStartDate = !startDate || paymentDate >= new Date(startDate)
        const matchesEndDate = !endDate || paymentDate <= new Date(endDate)

        return matchesSearch && matchesClass && matchesStream && matchesMethod && matchesStartDate && matchesEndDate
    })

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)
    const today = new Date().toLocaleDateString()
    const todayCollected = payments
        .filter(p => p.date === today)
        .reduce((sum, p) => sum + p.amount, 0)

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthCollected = payments
        .filter(p => {
            const d = new Date(p.date)
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
        .reduce((sum, p) => sum + p.amount, 0)

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8 print:w-full print:max-w-none print:p-0">
                <PageHeader
                    title="Payments"
                    description="View and export payment history."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Fees", href: "/fees" },
                        { label: "Payments" },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                className="h-11 rounded-xl bg-white border-slate-200 shadow-xl shadow-emerald-500/5 text-slate-700 font-bold px-5 transition-all hover:scale-[1.05] hover:border-emerald-200 hover:bg-emerald-50/50 flex items-center gap-2 group"
                            >
                                <Printer className="h-4 w-4 text-emerald-600 transition-transform group-hover:rotate-12" /> Print
                            </Button>
                            <Button
                                onClick={handleExportCSV}
                                variant="outline"
                                className="h-11 rounded-xl bg-white border-slate-200 shadow-xl shadow-emerald-500/5 text-slate-700 font-bold px-5 transition-all hover:scale-[1.05] hover:border-emerald-200 hover:bg-emerald-50/50 flex items-center gap-2 group"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600 transition-transform group-hover:-translate-y-1" /> CSV
                            </Button>
                            <Button
                                onClick={handleExportPDF}
                                variant="outline"
                                className="h-11 rounded-xl bg-white border-slate-200 shadow-xl shadow-emerald-500/5 text-slate-700 font-bold px-5 transition-all hover:scale-[1.05] hover:border-emerald-200 hover:bg-emerald-50/50 flex items-center gap-2 group"
                            >
                                <Download className="h-4 w-4 text-emerald-600 transition-transform group-hover:translate-y-1" /> PDF
                            </Button>
                        </div>
                    }
                />

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
                    <StatCard
                        title="Total Collected"
                        value={`${totalCollected.toLocaleString()} ${profile?.currency || 'UGX'}`}
                        variant="gradient"
                        className="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        title="Today's Collections"
                        value={`${todayCollected.toLocaleString()} ${profile?.currency || 'UGX'}`}
                        variant="gradient"
                        className="bg-gradient-to-br from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Monthly Collections"
                        value={`${monthCollected.toLocaleString()} ${profile?.currency || 'UGX'}`}
                        variant="gradient"
                        className="bg-gradient-to-br from-purple-500 to-purple-600"
                    />
                    <StatCard
                        title="Total Transactions"
                        value={payments.length}
                        variant="gradient"
                        className="bg-gradient-to-br from-amber-500 to-amber-600"
                    />
                </div>

                {/* Advanced Filters */}
                <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50 print:hidden">
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Student, receipt #..."
                                        className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Class</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
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
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Stream</Label>
                                <Select value={selectedStream} onValueChange={setSelectedStream}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="All Streams" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Streams</SelectItem>
                                        {streams
                                            .filter(s => selectedClass === "all" || s.classId.toString() === selectedClass)
                                            .map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Method</Label>
                                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="All Methods" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Methods</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Bank">Bank</SelectItem>
                                        <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Start Date</Label>
                                <Input
                                    type="date"
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">End Date</Label>
                                <Input
                                    type="date"
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50/50"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
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
                                    <span>PAYMENT HISTORY REPORT</span>
                                    <span>•</span>
                                    <span>Date: {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto print:overflow-visible">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="font-bold text-white h-14 border-r border-emerald-500/30">Date</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Receipt #</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Student</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Class</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Method</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Invoice</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.length > 0 ? filteredPayments.map((payment, idx) => (
                                        <TableRow key={payment.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="text-slate-600 font-medium border-r border-emerald-100/50">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {payment.date}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-bold text-slate-500 border-r border-emerald-100/50">{payment.receiptNumber}</TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <div className="font-bold text-slate-900">{payment.studentName}</div>
                                                <div className="text-xs text-slate-500">{payment.admissionNumber}</div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 border-r border-emerald-100/50">{payment.className}</TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                                    {payment.method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 border-r border-emerald-100/50">{payment.invoiceNumber || '-'}</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600 pr-6">
                                                {payment.amount.toLocaleString()} <span className="text-[10px] text-emerald-600/70 font-medium">{profile?.currency || 'UGX'}</span>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-slate-400 border-emerald-100/50">
                                                No payments found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
