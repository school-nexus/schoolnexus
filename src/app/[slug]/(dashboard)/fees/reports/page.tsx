"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    FileText,
    Download,
    Loader2,
    Users,
    Calendar,
    BarChart3,
    User,
    TrendingDown,
    Printer,
    FileSpreadsheet,
    Clock,
    CheckCircle2,
    ArrowRight,
    Filter,
    Eye,
    RefreshCw,
    Building2,
    Receipt,
    Wallet,
    ChevronRight,
    CalendarDays,
    GraduationCap
} from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { feeActions, studentActions, classActions, termActions, schoolProfileActions, dashboardActions, invoiceActions } from "@/lib/electron"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { cn } from "@/lib/utils"
import { createStandardPDF, addStandardFooter, addInfoBox, standardTableStyles } from "@/lib/pdfUtils"

interface ReportType {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    category: "financial" | "student" | "administrative"
}

interface RawClass {
    id: number
    name: string
}

interface RawTerm {
    id: number
    name: string
    academicYearId: number
}

interface RawStudent {
    id: number
    firstName: string
    lastName: string
    classId: number
    admissionNumber: string
}

interface RawProfile {
    currency: string
    name: string
    address: string
    phone: string
    email: string
}

interface RawDashboardStats {
    totalRevenue?: number
    pendingFees?: number
}

interface GeneratedReport {
    id: string
    type: string
    title: string
    date: string
    format: string
}

const reportTypes: ReportType[] = [
    {
        id: "collection",
        title: "Collection Summary",
        description: "Total fee collections by class",
        icon: <Wallet className="h-5 w-5" />,
        category: "financial"
    },
    {
        id: "daily",
        title: "Daily Collection",
        description: "Payments on a specific date",
        icon: <CalendarDays className="h-5 w-5" />,
        category: "financial"
    },
    {
        id: "balances",
        title: "Outstanding Balances",
        description: "Students with unpaid balances",
        icon: <TrendingDown className="h-5 w-5" />,
        category: "financial"
    },
    {
        id: "invoices",
        title: "Invoice Summary",
        description: "All invoices by status",
        icon: <Receipt className="h-5 w-5" />,
        category: "financial"
    },
    {
        id: "class",
        title: "Class Fee Report",
        description: "All students in a class",
        icon: <GraduationCap className="h-5 w-5" />,
        category: "student"
    },
    {
        id: "student",
        title: "Student Statement",
        description: "Individual fee history",
        icon: <User className="h-5 w-5" />,
        category: "student"
    }
]

interface RawPayment {
    id: number
    studentId: number
    amount: number
    date: string
    receiptNumber?: string
    paymentMethod?: string
}

interface RawDebtor {
    firstName: string
    lastName: string
    admissionNumber: string
    balance: number
}

interface RawInvoiceData {
    id: number
    invoiceNumber: string
    studentName: string
    amount: number
    status: string
    dueDate: string
}

export default function FeeReportsPage() {
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [classes, setClasses] = useState<RawClass[]>([])
    const [terms, setTerms] = useState<RawTerm[]>([])
    const [students, setStudents] = useState<RawStudent[]>([])
    const [schoolProfile, setSchoolProfile] = useState<RawProfile | null>(null)
    const [recentReports, setRecentReports] = useState<GeneratedReport[]>([])

    // Stats
    const [stats, setStats] = useState({
        totalCollected: 0,
        pendingFees: 0,
        totalStudents: 0,
        reportsGenerated: 0
    })

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
    const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf")

    // Form state
    const [selectedClass, setSelectedClass] = useState("all")
    const [selectedTerm, setSelectedTerm] = useState("")
    const [selectedStudent, setSelectedStudent] = useState("")
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [includeDetails, setIncludeDetails] = useState(true)

    useEffect(() => {
        fetchData()
        const saved = localStorage.getItem("recentFeeReports")
        if (saved) {
            const parsed = JSON.parse(saved)
            setRecentReports(parsed)
            setStats(prev => ({ ...prev, reportsGenerated: parsed.length }))
        }
    }, [])

    const fetchData = async () => {
        try {
            const activeTerm = await termActions.getActive()
            const [classData, termData, studentData, profileData, dashboardStats] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                activeTerm ? termActions.getByYear(activeTerm.academicYearId) as Promise<RawTerm[]> : Promise.resolve([] as RawTerm[]),
                studentActions.getAll() as Promise<RawStudent[]>,
                schoolProfileActions.get() as Promise<RawProfile>,
                dashboardActions.getStats() as Promise<RawDashboardStats>
            ])
            setClasses(classData)
            setTerms(termData)
            setStudents(studentData)
            setSchoolProfile(profileData)
            if (activeTerm) setSelectedTerm(activeTerm.id.toString())
            setStats(prev => ({
                ...prev,
                totalCollected: dashboardStats.totalRevenue || 0,
                pendingFees: dashboardStats.pendingFees || 0,
                totalStudents: studentData.length
            }))
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const openReportDialog = (report: ReportType) => {
        setSelectedReport(report)
        setExportFormat("pdf")
        setIncludeDetails(true)
        setIsDialogOpen(true)
    }

    const saveRecentReport = (report: GeneratedReport) => {
        const updated = [report, ...recentReports.slice(0, 9)]
        setRecentReports(updated)
        setStats(prev => ({ ...prev, reportsGenerated: updated.length }))
        localStorage.setItem("recentFeeReports", JSON.stringify(updated))
    }

    const formatCurrency = (amount: number) => `${schoolProfile?.currency || 'UGX'} ${amount.toLocaleString()}`

    const generateReport = async () => {
        if (!selectedReport) return

        setGenerating(true)
        try {
            if (exportFormat === "csv") {
                await generateCSVReport()
            } else {
                await generatePDFReport()
            }

            saveRecentReport({
                id: Date.now().toString(),
                type: selectedReport.id,
                title: selectedReport.title,
                date: new Date().toLocaleString(),
                format: exportFormat.toUpperCase()
            })

            setIsDialogOpen(false)
        } catch (error: unknown) {
            console.error("Failed to generate report:", error)
            toast.error("Failed to generate report")
        } finally {
            setGenerating(false)
        }
    }

    const generateCSVReport = async () => {
        if (!selectedReport) return

        let csvContent = ""
        const filename = `${selectedReport.id}_report_${Date.now()}.csv`

        switch (selectedReport.id) {
            case "collection": {
                const payments = await feeActions.getAllPayments() as RawPayment[]
                csvContent = "Class,Students,Amount Collected\n"
                classes.forEach(c => {
                    const classStudents = students.filter(s => s.classId === c.id)
                    const classStudentIds = classStudents.map(s => s.id)
                    const classPayments = payments.filter((p: RawPayment) => classStudentIds.includes(p.studentId))
                    const amount = classPayments.reduce((sum: number, p: RawPayment) => sum + p.amount, 0)
                    csvContent += `"${c.name}",${classStudents.length},${amount}\n`
                })
                break
            }
            case "balances": {
                const topDebtors = await dashboardActions.getTopDebtors() as RawDebtor[]
                csvContent = "Student Name,Admission No,Balance\n"
                topDebtors.forEach((d: RawDebtor) => {
                    csvContent += `"${d.firstName} ${d.lastName}",${d.admissionNumber || "N/A"},${d.balance || 0}\n`
                })
                break
            }
            case "daily": {
                const payments = await feeActions.getAllPayments() as RawPayment[]
                const todayPayments = payments.filter((p: RawPayment) => p.date === selectedDate)
                csvContent = "Receipt #,Student,Method,Amount\n"
                todayPayments.forEach((p: RawPayment) => {
                    const student = students.find(s => s.id === p.studentId)
                    csvContent += `"${p.receiptNumber || `RCP-${p.id}`}","${student ? `${student.firstName} ${student.lastName}` : 'Unknown'}","${p.paymentMethod || 'Cash'}",${p.amount}\n`
                })
                break
            }
            case "class": {
                if (selectedClass === "all") {
                    toast.error("Please select a specific class")
                    return
                }
                const payments = await feeActions.getAllPayments() as RawPayment[]
                const classStudents = students.filter(s => s.classId === parseInt(selectedClass))
                csvContent = "Student Name,Admission No,Amount Paid,Status\n"
                classStudents.forEach(s => {
                    const studentPayments = payments.filter((p: RawPayment) => p.studentId === s.id)
                    const paid = studentPayments.reduce((sum: number, p: RawPayment) => sum + p.amount, 0)
                    csvContent += `"${s.firstName} ${s.lastName}",${s.admissionNumber || "N/A"},${paid},${paid > 0 ? "Paid" : "Unpaid"}\n`
                })
                break
            }
            case "student": {
                if (!selectedStudent) {
                    toast.error("Please select a student")
                    return
                }
                const student = students.find(s => s.id === parseInt(selectedStudent))
                const feeData = await feeActions.getStudentFees(parseInt(selectedStudent))
                csvContent = `Student Statement: ${student?.firstName} ${student?.lastName}\n\nDate,Receipt #,Method,Amount\n`
                    ; (feeData?.payments || []).forEach((p: RawPayment) => {
                        csvContent += `${p.date},"${p.receiptNumber || `RCP-${p.id}`}","${p.paymentMethod || 'Cash'}",${p.amount}\n`
                    })
                csvContent += `\nTotal Paid,,,${feeData?.totalPaid || 0}\nBalance,,,${feeData?.balance || 0}\n`
                break
            }
            case "invoices": {
                const invoiceData = await invoiceActions.getAll() as RawInvoiceData[]
                csvContent = "Invoice #,Student,Amount,Status,Due Date\n"
                invoiceData.forEach((inv: RawInvoiceData) => {
                    csvContent += `"${inv.invoiceNumber}","${inv.studentName || 'Unknown'}",${inv.amount},"${inv.status}","${inv.dueDate}"\n`
                })
                break
            }
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
        toast.success("CSV exported successfully")
    }

    const generatePDFReport = async () => {
        if (!selectedReport || !schoolProfile) return

        const { doc, pageWidth, margin } = createStandardPDF({
            title: selectedReport.title,
            subtitle: `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            schoolProfile,
            filename: `${selectedReport.id}_report_${Date.now()}.pdf`
        })

        switch (selectedReport.id) {
            case "collection":
                await generateCollectionPDF(doc, margin, pageWidth)
                break
            case "balances":
                await generateBalancesPDF(doc, margin, pageWidth)
                break
            case "daily":
                await generateDailyPDF(doc, margin, pageWidth)
                break
            case "class":
                await generateClassPDF(doc, margin, pageWidth)
                break
            case "student":
                await generateStudentPDF(doc, margin, pageWidth)
                break
            case "invoices":
                await generateInvoicePDF(doc, margin, pageWidth)
                break
        }

        addStandardFooter(doc, schoolProfile, margin, pageWidth)
        doc.save(`${selectedReport.id}_report_${Date.now()}.pdf`)
        toast.success("PDF generated successfully")
    }


    const generateCollectionPDF = async (doc: jsPDF, margin: number, pageWidth: number) => {
        const payments = await feeActions.getAllPayments() as RawPayment[]

        let y = 45
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, "F")
        doc.setTextColor(5, 150, 105)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(`Total Collected: ${formatCurrency(stats.totalCollected)}`, margin + 5, y + 13)
        doc.text(`Pending: ${formatCurrency(stats.pendingFees)}`, pageWidth / 2, y + 13)

        y += 30

        const tableData = classes.map(c => {
            const classStudents = students.filter(s => s.classId === c.id)
            const classPayments = payments.filter((p: RawPayment) => classStudents.some(s => s.id === p.studentId))
            const amount = classPayments.reduce((sum: number, p: RawPayment) => sum + p.amount, 0)
            return [c.name, classStudents.length.toString(), formatCurrency(amount)]
        })

        autoTable(doc, {
            ...standardTableStyles,
            head: [["Class", "Students", "Collected"]],
            body: tableData,
            startY: y,
        })
    }

    const generateBalancesPDF = async (doc: jsPDF, margin: number, pageWidth: number) => {
        const debtors = await dashboardActions.getTopDebtors() as RawDebtor[]

        let y = 45
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(9)
        doc.text("Students with outstanding balances", margin, y)

        y += 8

        const tableData = debtors.map((d: RawDebtor) => [
            `${d.firstName} ${d.lastName}`,
            d.admissionNumber || "N/A",
            formatCurrency(d.balance || 0)
        ])

        autoTable(doc, {
            ...standardTableStyles,
            head: [["Student", "Adm No", "Balance"]],
            body: tableData.length > 0 ? tableData : [["No debtors found", "", ""]],
            startY: y,
            headStyles: { fillColor: [245, 158, 11] as [number, number, number], textColor: 255, fontStyle: 'bold' },
            columnStyles: { 2: { halign: 'right', textColor: [220, 38, 38] } },
            alternateRowStyles: { fillColor: [254, 252, 232] as [number, number, number] }
        })
    }

    const generateDailyPDF = async (doc: jsPDF, margin: number, pageWidth: number) => {
        const payments = await feeActions.getAllPayments() as RawPayment[]
        const filtered = payments.filter((p: RawPayment) => p.date === selectedDate)
        const total = filtered.reduce((sum: number, p: RawPayment) => sum + p.amount, 0)

        let y = 45
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(9)
        doc.text(`Date: ${selectedDate} | Total: ${formatCurrency(total)}`, margin, y)

        y += 8

        const tableData = filtered.map((p: RawPayment) => {
            const student = students.find(s => s.id === p.studentId)
            return [p.receiptNumber || `RCP-${p.id}`, student ? `${student.firstName} ${student.lastName}` : "Unknown", p.paymentMethod || "Cash", formatCurrency(p.amount)]
        })

        autoTable(doc, {
            ...standardTableStyles,
            head: [["Receipt", "Student", "Method", "Amount"]],
            body: tableData.length > 0 ? tableData : [["No payments", "", "", ""]],
            startY: y,
            headStyles: { fillColor: [59, 130, 246] as [number, number, number], textColor: 255, fontStyle: 'bold' },
            columnStyles: { 3: { halign: 'right' } },
            alternateRowStyles: { fillColor: [239, 246, 255] as [number, number, number] }
        })
    }

    const generateClassPDF = async (doc: jsPDF, margin: number, pageWidth: number) => {
        if (selectedClass === "all") throw new Error("Select a class")

        const payments = await feeActions.getAllPayments() as RawPayment[]
        const classStudents = students.filter(s => s.classId === parseInt(selectedClass))
        const className = classes.find(c => c.id === parseInt(selectedClass))?.name

        let y = 45
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(9)
        doc.text(`Class: ${className} | Students: ${classStudents.length}`, margin, y)

        y += 8

        const tableData = classStudents.map(s => {
            const paid = payments.filter((p: RawPayment) => p.studentId === s.id).reduce((sum: number, p: RawPayment) => sum + p.amount, 0)
            return [`${s.firstName} ${s.lastName}`, s.admissionNumber || "N/A", formatCurrency(paid), paid > 0 ? "Paid" : "Unpaid"]
        })

        autoTable(doc, {
            ...standardTableStyles,
            head: [["Student", "Adm No", "Paid", "Status"]],
            body: tableData,
            startY: y,
            headStyles: { fillColor: [147, 51, 234] as [number, number, number], textColor: 255, fontStyle: 'bold' },
            columnStyles: { 2: { halign: 'right' } },
            alternateRowStyles: { fillColor: [250, 245, 255] as [number, number, number] }
        })
    }

    const generateStudentPDF = async (doc: jsPDF, margin: number, pageWidth: number) => {
        if (!selectedStudent) throw new Error("Select a student")

        const student = students.find(s => s.id === parseInt(selectedStudent))
        const feeData = await feeActions.getStudentFees(parseInt(selectedStudent))

        let y = 45
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, "F")
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.text(`${student?.firstName} ${student?.lastName}`, margin + 5, y + 8)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 116, 139)
        doc.text(`Adm: ${student?.admissionNumber || "N/A"}`, margin + 5, y + 15)
        doc.setTextColor(5, 150, 105)
        doc.setFont("helvetica", "bold")
        doc.text(`Balance: ${formatCurrency(feeData?.balance || 0)}`, pageWidth - margin - 5, y + 12, { align: "right" })

        y += 30

        const tableData = (feeData?.payments || []).map((p: RawPayment) => [p.date, p.receiptNumber || `RCP-${p.id}`, p.paymentMethod || "Cash", formatCurrency(p.amount)])

        autoTable(doc, {
            ...standardTableStyles,
            head: [["Date", "Receipt", "Method", "Amount"]],
            body: tableData.length > 0 ? tableData : [["No payments", "", "", ""]],
            startY: y,
            headStyles: { fillColor: [20, 184, 166] as [number, number, number], textColor: 255, fontStyle: 'bold' },
            columnStyles: { 3: { halign: 'right' } },
            alternateRowStyles: { fillColor: [240, 253, 250] as [number, number, number] }
        })
    }

    const generateInvoicePDF = async (doc: jsPDF, margin: number, pageWidth: number) => {
        const invoices = await invoiceActions.getAll() as RawInvoiceData[]

        let y = 45
        const paid = invoices.filter((i: RawInvoiceData) => i.status === "Paid").length
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(9)
        doc.text(`Total: ${invoices.length} | Paid: ${paid} | Pending: ${invoices.length - paid}`, margin, y)

        y += 8

        const tableData = invoices.map((inv: RawInvoiceData) => [inv.invoiceNumber || `INV-${inv.id}`, inv.studentName || "Unknown", formatCurrency(inv.amount || 0), inv.status || "Pending", inv.dueDate || "N/A"])

        autoTable(doc, {
            ...standardTableStyles,
            head: [["Invoice", "Student", "Amount", "Status", "Due"]],
            body: tableData.length > 0 ? tableData : [["No invoices", "", "", "", ""]],
            startY: y,
            headStyles: { fillColor: [99, 102, 241] as [number, number, number], textColor: 255, fontStyle: 'bold' },
            columnStyles: { 2: { halign: 'right' } },
            alternateRowStyles: { fillColor: [238, 242, 255] as [number, number, number] }
        })
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    const financialReports = reportTypes.filter(r => r.category === "financial")
    const studentReports = reportTypes.filter(r => r.category === "student")

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-6">
                <PageHeader
                    title="Fee Reports"
                    description="Generate comprehensive fee reports and statements."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Fees", href: "/fees" },
                        { label: "Reports" },
                    ]}
                    actions={
                        <Button variant="outline" onClick={fetchData} className="h-10 rounded-xl border-slate-200 shadow-sm">
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                    }
                />

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Collected"
                        value={formatCurrency(stats.totalCollected)}
                        icon={<Wallet className="h-6 w-6 text-white" />}
                        variant="gradient"
                        className="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        title="Pending"
                        value={formatCurrency(stats.pendingFees)}
                        icon={<TrendingDown className="h-6 w-6 text-white" />}
                        variant="gradient"
                        className="bg-gradient-to-br from-amber-500 to-amber-600"
                    />
                    <StatCard
                        title="Students"
                        value={stats.totalStudents}
                        icon={<Users className="h-6 w-6 text-white" />}
                        variant="gradient"
                        className="bg-gradient-to-br from-blue-500 to-blue-600"
                    />
                    <StatCard
                        title="Reports Generated"
                        value={stats.reportsGenerated}
                        icon={<FileText className="h-6 w-6 text-white" />}
                        variant="gradient"
                        className="bg-gradient-to-br from-purple-500 to-purple-600"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Report Categories */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Financial Reports */}
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <BarChart3 className="h-4 w-4" />
                                    </div>
                                    Financial Reports
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {financialReports.map((report) => (
                                        <button
                                            key={report.id}
                                            onClick={() => openReportDialog(report)}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left group"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                {report.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-slate-900">{report.title}</p>
                                                <p className="text-[11px] text-slate-500 truncate">{report.description}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Student Reports */}
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                                        <User className="h-4 w-4" />
                                    </div>
                                    Student Reports
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {studentReports.map((report) => (
                                        <button
                                            key={report.id}
                                            onClick={() => openReportDialog(report)}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-all text-left group"
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                                {report.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-slate-900">{report.title}</p>
                                                <p className="text-[11px] text-slate-500 truncate">{report.description}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Reports Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    Recent Reports
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {recentReports.length > 0 ? (
                                    <div className="space-y-2">
                                        {recentReports.slice(0, 6).map((report) => {
                                            const reportType = reportTypes.find(r => r.id === report.type)
                                            return (
                                                <div
                                                    key={report.id}
                                                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/80"
                                                >
                                                    <div className="h-7 w-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                        {reportType?.icon || <FileText className="h-3 w-3" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-slate-900 truncate">{report.title}</p>
                                                        <p className="text-[10px] text-slate-400">{report.date}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-[9px] h-5 bg-slate-50">{report.format}</Badge>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">No recent reports</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Tips */}
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-emerald-50 ring-1 ring-emerald-100">
                            <CardContent className="p-4">
                                <div className="flex gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-emerald-900">Quick Tip</p>
                                        <p className="text-xs text-emerald-700 mt-1">
                                            Export as CSV for spreadsheet analysis or PDF for printing and archiving.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Report Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl shadow-emerald-500/20 bg-white">
                    <DialogHeader className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                                {selectedReport?.icon}
                            </div>
                            {selectedReport?.title}
                        </DialogTitle>
                        <DialogDescription className="text-emerald-100/80 mt-1">{selectedReport?.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 p-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Export Format</Label>
                            <div className="flex gap-2">
                                <Button
                                    variant={exportFormat === "pdf" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setExportFormat("pdf")}
                                    className={cn("flex-1 rounded-xl h-11", exportFormat === "pdf" && "bg-emerald-600 hover:bg-emerald-700")}
                                >
                                    <FileText className="h-4 w-4 mr-2" /> PDF Document
                                </Button>
                                <Button
                                    variant={exportFormat === "csv" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setExportFormat("csv")}
                                    className={cn("flex-1 rounded-xl h-11", exportFormat === "csv" && "bg-emerald-600 hover:bg-emerald-700")}
                                >
                                    <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV Spreadsheet
                                </Button>
                            </div>
                        </div>

                        {(selectedReport?.id === "collection" || selectedReport?.id === "class") && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Class {selectedReport?.id === "class" && <span className="text-red-500">*</span>}
                                </Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedReport?.id === "collection" && <SelectItem value="all">All Classes</SelectItem>}
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {selectedReport?.id === "daily" && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date <span className="text-red-500">*</span></Label>
                                <Input type="date" className="rounded-xl h-11 border-slate-200 bg-slate-50/50" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                            </div>
                        )}

                        {selectedReport?.id === "student" && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student <span className="text-red-500">*</span></Label>
                                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                    <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.firstName} {s.lastName} ({s.admissionNumber})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox id="details" checked={includeDetails} onCheckedChange={(v) => setIncludeDetails(v as boolean)} />
                            <label htmlFor="details" className="text-sm text-slate-600 cursor-pointer">Include detailed breakdown</label>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 gap-3">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl text-slate-500 hover:text-slate-700">Cancel</Button>
                        <Button onClick={generateReport} disabled={generating} className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                            Generate Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
