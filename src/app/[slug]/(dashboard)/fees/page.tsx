"use client"
export const runtime = 'edge';

import { useState, useEffect, Suspense } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    User,
    CreditCard,
    History,
    Receipt,
    Wallet,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Banknote,
    Smartphone,
    Building2,
    Loader2,
    FileText,
    Eye,
    RefreshCw,
    FileSpreadsheet
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn, exportToCSV } from "@/lib/utils"
import { getPaymentMethodInfo, PAYMENT_METHODS } from "@/lib/constants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { studentActions, feeActions, termActions, invoiceActions, schoolProfileActions } from "@/lib/electron"
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
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

interface RawStudent {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
    parentNames?: string
}

interface RawPayment {
    id: number
    amount: number
    date: string
    method: string
    receiptNumber: string
}

interface RawFeeStructure {
    id: number
    name: string
    amount: number
    invoiceId?: number
}

interface RawTerm {
    id: number
    name: string
    isActive: boolean
    academicYearId: number
}

interface RawProfile {
    currency: string
}

interface StudentFeeData {
    student: RawStudent
    totalFees: number
    totalPaid: number
    balance: number
    payments: RawPayment[]
    structures: RawFeeStructure[]
    invoices: Invoice[]
}

interface Invoice {
    id: number
    invoiceNumber: string
    amount: number
    status: string
    dueDate: string
    balance?: number
    paidAmount?: number
}

interface FeeStructure {
    name: string
    amount: number
    status: string
    invoiceId?: number
}

interface StatementEntry {
    Type: 'INVOICE' | 'PAYMENT'
    Date: string
    Reference: string
    Amount: number
    Paid: number
    Balance: number
    Status: string
}

function CollectFeesPageContent() {
    const { confirm } = useConfirm()
    const searchParams = useSearchParams()
    const studentIdParam = searchParams.get("studentId")

    const [searchQuery, setSearchQuery] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("bank")
    const [loading, setLoading] = useState(false)
    const [students, setStudents] = useState<RawStudent[]>([])
    const [selectedStudent, setSelectedStudent] = useState<StudentFeeData | null>(null)
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
    const [paymentAmount, setPaymentAmount] = useState("")
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("")
    const [activeTerm, setActiveTerm] = useState<RawTerm | null>(null)
    const [isGenerateOpen, setIsGenerateOpen] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [terms, setTerms] = useState<RawTerm[]>([])
    const [genTermId, setGenTermId] = useState<string>("")
    const [genDueDate, setGenDueDate] = useState<string>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    const [profile, setProfile] = useState<RawProfile | null>(null)

    useEffect(() => {
        // Fetch students and terms on component mount
        fetchStudents()
        fetchFeeStructures()
    }, [])

    useEffect(() => {
        if (studentIdParam && students.length > 0) {
            // Don't overwrite if user has already typed something (unless it matches the current selection)
            if (searchQuery && selectedStudent?.student.id !== parseInt(studentIdParam)) {
                return
            }

            const studentId = parseInt(studentIdParam)
            const student = students.find(s => s.id === studentId)
            if (student) {
                // Only select if not already selected to avoid loops/resets
                if (selectedStudent?.student.id !== student.id) {
                    console.log('Auto-selecting student from URL param:', studentId);
                    handleStudentSelect(student)
                }
            } else {
                console.log('Student not found in students list:', studentId);
                console.log('Available students:', students.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));
            }
        }
    }, [studentIdParam, students, searchQuery, selectedStudent])

    const fetchStudents = async () => {
        try {
            const [data, term, profileData] = await Promise.all([
                studentActions.getAll() as Promise<RawStudent[]>,
                termActions.getActive() as Promise<RawTerm>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])
            setProfile(profileData)
            setStudents(data)
            setActiveTerm(term)
            if (term) {
                const termsData = await termActions.getByYear(term.academicYearId) as RawTerm[]
                setTerms(termsData)
                setGenTermId(term.id.toString())
            }

            // If there's a studentId parameter, try to select that student
            if (studentIdParam && data.length > 0) {
                const studentId = parseInt(studentIdParam)
                const student = data.find(s => s.id === studentId)
                if (student) {
                    // Small delay to ensure state is updated
                    setTimeout(() => {
                        handleStudentSelect(student)
                    }, 100)
                }
            }
        } catch (error: unknown) {
            console.error("Failed to fetch students:", error)
        }
    }

    const fetchFeeStructures = async () => {
        try {
            const data = await feeActions.getStructures() as RawFeeStructure[]
            setFeeStructures(data.map((s) => ({
                name: s.name,
                amount: s.amount,
                status: "Unpaid"
            })))
        } catch (error: unknown) {
            console.error("Failed to fetch fee structures:", error)
        }
    }

    const handleStudentSelect = async (student: RawStudent) => {
        setLoading(true)
        try {
            console.log('Fetching fee data for student:', student.id, student.firstName, student.lastName);
            const feeData = await feeActions.getStudentFees(student.id) as StudentFeeData
            console.log('Fee data received:', feeData);

            // Ensure invoices array exists and has proper status
            const invoices = feeData.invoices || [];
            console.log('Raw invoices:', invoices);

            const validInvoices = invoices.map((inv) => ({
                ...inv,
                invoiceNumber: inv.invoiceNumber || `INV-${inv.id}`,
                status: (inv.balance ?? 0) <= 0 ? 'Paid' : (inv.balance ?? 0) < inv.amount ? 'Partially Paid' : 'Pending'
            }));

            console.log('Processed invoices:', validInvoices);

            const updatedFeeData = {
                ...feeData,
                invoices: validInvoices
            };

            setSelectedStudent(updatedFeeData);
            setSearchQuery(`${student.firstName} ${student.lastName}`)

            // Auto-select first unpaid invoice
            const firstUnpaid = validInvoices.find((i) => i.status !== 'Paid')
            if (firstUnpaid) {
                setSelectedInvoiceId(firstUnpaid.id.toString())
                setPaymentAmount(firstUnpaid.balance?.toString() || firstUnpaid.amount.toString())
                console.log('Auto-selected invoice:', firstUnpaid.id, 'Amount:', firstUnpaid.balance || firstUnpaid.amount);
            } else {
                setSelectedInvoiceId("")
                setPaymentAmount("")
                console.log('No unpaid invoices found');
            }

            console.log('Student selection complete. Invoices count:', validInvoices.length);
        } catch (error: unknown) {
            console.error("Error loading student fee data:", error)
            toast.error("Failed to load student fee data")
        } finally {
            setLoading(false)
        }
    }

    const handleStudentSearch = async () => {
        if (!searchQuery.trim()) return

        setLoading(true)
        try {
            console.log('Searching for student:', searchQuery);
            // Find student by ID or name
            const student = students.find(s =>
                s.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
            )

            console.log('Found student:', student);

            if (student) {
                await handleStudentSelect(student)
            } else {
                toast.error("Student not found")
                setSelectedStudent(null)
            }
        } catch (error: unknown) {
            console.error("Error searching student:", error)
            toast.error("Failed to load student fee data")
        } finally {
            setLoading(false)
        }
    }

    const handleGenerate = async () => {
        if (!selectedStudent || !genTermId) return

        setIsGenerating(true)
        try {
            const result = await invoiceActions.generate({
                studentId: selectedStudent.student.id,
                termId: parseInt(genTermId),
                dueDate: genDueDate
            }) as any

            if (result && result.count > 0) {
                toast.success(`Generated invoice successfully`)
                // Refresh student data
                await handleStudentSelect(selectedStudent.student)
            } else {
                toast.info("No new fees to invoice for this term")
            }
            setIsGenerateOpen(false)
        } catch (error: unknown) {
            console.error("Failed to generate invoice:", error)
            toast.error("Failed to generate invoice")
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePayment = async () => {
        if (!selectedStudent || !paymentAmount) {
            toast.error("Please enter a payment amount")
            return
        }

        if (!selectedInvoiceId) {
            toast.error("Please select an invoice to pay against")
            return
        }

        if (await confirm({
            title: "Confirm Fee Payment",
            description: `Are you sure you want to record a payment of ${formatCurrency(parseFloat(paymentAmount.replace(/,/g, "")))} for ${selectedStudent.student.firstName} ${selectedStudent.student.lastName}?`,
            confirmText: "Record Payment",
            variant: "default"
        })) {
            try {
                await feeActions.createPayment({
                    studentId: selectedStudent.student.id,
                    amount: parseFloat(paymentAmount.replace(/,/g, "")),
                    date: new Date().toISOString().split("T")[0],
                    method: getPaymentMethodInfo(paymentMethod).label,
                    termId: activeTerm?.id || 1,
                    receiptNumber: `RCP-${Date.now()}`,
                    invoiceId: parseInt(selectedInvoiceId)
                })
                toast.success("Payment recorded successfully!")
                // Refresh fee data
                const feeData = await feeActions.getStudentFees(selectedStudent.student.id) as StudentFeeData
                setSelectedStudent(feeData)
                setPaymentAmount("")
            } catch (error: unknown) {
                console.error("Failed to record payment:", error)
                toast.error("Failed to record payment")
            }
        }
    }

    const handleExportStatement = () => {
        if (!selectedStudent) return
 
        const statementData: StatementEntry[] = []
 
        // Add Invoices
        selectedStudent.invoices.forEach((inv) => {
            statementData.push({
                Type: 'INVOICE',
                Date: inv.dueDate,
                Reference: inv.invoiceNumber,
                Amount: inv.amount,
                Paid: inv.paidAmount || 0,
                Balance: inv.balance || 0,
                Status: inv.status
            })
        })
 
        // Add Payments
        selectedStudent.payments.forEach((pay) => {
            statementData.push({
                Type: 'PAYMENT',
                Date: pay.date,
                Reference: pay.receiptNumber,
                Amount: 0,
                Paid: pay.amount,
                Balance: 0,
                Status: 'Cleared'
            })
        })
 
        // Sort by date
        statementData.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
 
        exportToCSV(statementData as any, `${selectedStudent.student.firstName}_Fee_Statement`)
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString() + " " + (profile?.currency || "UGX")
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-6">
                <PageHeader
                    title="Collect Fees"
                    description="Search students and process fee payments securely."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Fees Collection", href: "/fees/dashboard" },
                        { label: "Collect Fees" },
                    ]}
                    actions={
                        <div className="relative w-full lg:max-w-md flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search student ID or name..."
                                    className="pl-11 h-12 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500/20 transition-all min-w-[300px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                                />
                            </div>
                            <Button onClick={handleStudentSearch} disabled={loading} className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                            </Button>
                        </div>
                    }
                />

                {selectedStudent ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left Column: Student Info & Breakdown (7 columns) */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Student Profile Card - More Compact */}
                            <Card className="border-none shadow-lg shadow-slate-200/50 bg-white/90 backdrop-blur-md ring-1 ring-slate-200/60 overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <Avatar className="h-20 w-20 border-2 border-white shadow-lg ring-1 ring-slate-100">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.student.firstName}`} />
                                                <AvatarFallback className="bg-emerald-50 text-emerald-600 text-xl font-bold">
                                                    {selectedStudent.student.firstName?.[0]}{selectedStudent.student.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-xl font-bold text-slate-900">
                                                        {selectedStudent.student.firstName} {selectedStudent.student.lastName}
                                                    </h2>
                                                    <Badge variant="outline" className="bg-emerald-50/50 text-emerald-700 border-emerald-100 font-mono text-[10px]">
                                                        {selectedStudent.student.admissionNumber}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium">
                                                    {selectedStudent.student.parentNames || "N/A"}
                                                </p>

                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Balance Due</span>
                                                        <span className="text-sm font-bold text-red-600">{formatCurrency(selectedStudent.balance)}</span>
                                                    </div>
                                                    <div className="h-8 w-px bg-slate-100 mx-2" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Paid</span>
                                                        <span className="text-sm font-bold text-emerald-600">{formatCurrency(selectedStudent.totalPaid)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="h-11 bg-white border-slate-200 shadow-xl shadow-emerald-500/5 text-slate-700 font-bold px-6 rounded-xl transition-all hover:scale-[1.05] hover:border-emerald-200 hover:bg-emerald-50/50 flex items-center gap-2 group"
                                            onClick={handleExportStatement}
                                        >
                                            <FileSpreadsheet className="h-4 w-4 text-emerald-600 transition-transform group-hover:-translate-y-1" />
                                            Export Statement
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>


                            {/* Invoices */}
                            <Card className="border-none shadow-lg shadow-slate-200/50 bg-white/90 backdrop-blur-md ring-1 ring-slate-200/60 overflow-hidden">
                                <CardHeader className="border-b border-slate-100 p-5 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" /> Invoices
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => selectedStudent && handleStudentSelect(selectedStudent.student)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 hover:bg-blue-50 text-[10px] font-bold uppercase tracking-wider h-6 px-2"
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                                        </Button>
                                        {selectedStudent.structures?.some(s => !s.invoiceId) && (
                                            <Button
                                                onClick={() => setIsGenerateOpen(true)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:bg-blue-50 text-[10px] font-bold uppercase tracking-wider h-6 px-2"
                                            >
                                                Generate New
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-50">
                                        {selectedStudent.invoices?.length > 0 ? (
                                            <>
                                                {selectedStudent.invoices.map((inv, idx: number) => (
                                                    <div key={idx} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-700">{inv.invoiceNumber}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">Due: {inv.dueDate || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <span className="block text-sm font-bold text-slate-900">{formatCurrency(inv.balance ?? inv.amount)}</span>
                                                                {inv.balance !== inv.amount && (
                                                                    <span className="text-[10px] text-slate-400">of {formatCurrency(inv.amount)}</span>
                                                                )}
                                                            </div>
                                                            <Badge className={
                                                                inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                                    inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-slate-100 text-slate-700'
                                                            }>
                                                                {inv.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="p-3 bg-slate-50 text-center text-[10px] text-slate-500 border-t border-slate-100">
                                                    Showing {selectedStudent.invoices.length} invoice{selectedStudent.invoices.length !== 1 ? 's' : ''}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-6 text-center text-slate-400">
                                                No invoices generated yet
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment History */}
                            <Card className="border-none shadow-lg shadow-slate-200/50 bg-white/90 backdrop-blur-md ring-1 ring-slate-200/60 overflow-hidden">
                                <CardHeader className="border-b border-slate-100 p-5 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <History className="h-4 w-4 text-teal-500" /> Recent Payments
                                    </CardTitle>
                                    <Link href={`/fees/receipts?studentId=${selectedStudent.student.id}`}>
                                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 text-[10px] font-bold uppercase tracking-wider">
                                            View All History
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-50">
                                        {selectedStudent.payments.length > 0 ? selectedStudent.payments.map((pay, idx: number) => (
                                            <div key={idx} className="p-4 flex items-center justify-between group">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{pay.receiptNumber}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{pay.date} • {pay.method}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(pay.amount)}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-emerald-50/30 text-emerald-700 border-emerald-100 rounded-lg px-2 py-0.5 text-[9px] font-bold">
                                                            Verified
                                                        </Badge>
                                                        <Link href={`/fees/receipts?id=${pay.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-6 text-center text-slate-400">
                                                No payments recorded yet
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Payment Form (5 columns) */}
                        <div className="lg:col-span-5 space-y-6">
                            <Card className="border-none shadow-2xl shadow-emerald-200/30 bg-white ring-1 ring-emerald-100 overflow-hidden sticky top-8">
                                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                                            <CreditCard className="h-4 w-4 text-white" />
                                        </div>
                                        <CardTitle className="text-lg font-bold">Process Payment</CardTitle>
                                    </div>
                                    <CardDescription className="text-emerald-100 text-xs">Securely record student fee collections.</CardDescription>
                                </div>
                                <CardContent className="p-6 space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Invoice</label>
                                        <select
                                            className="w-full h-12 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all text-sm px-4 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            value={selectedInvoiceId}
                                            onChange={(e) => {
                                                setSelectedInvoiceId(e.target.value)
                                                if (e.target.value) {
                                                    const inv = selectedStudent.invoices.find(i => i.id.toString() === e.target.value)
                                                    if (inv) {
                                                        setPaymentAmount(inv.balance?.toString() || inv.amount.toString())
                                                        console.log('Selected invoice:', inv.id, 'Balance:', inv.balance || inv.amount);
                                                    }
                                                } else {
                                                    setPaymentAmount("")
                                                }
                                            }}
                                        >
                                            <option value="">-- Select Invoice --</option>
                                            {selectedStudent.invoices?.map((inv) => (
                                                <option key={inv.id} value={inv.id.toString()}>
                                                    {inv.invoiceNumber} - {inv.status} - Bal: {formatCurrency(inv.balance ?? inv.amount)} (Total: {formatCurrency(inv.amount)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount to Pay ({profile?.currency || 'UGX'})</label>
                                        <div className="relative">
                                            <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="e.g. 150,000"
                                                className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all text-lg font-bold"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {Object.values(PAYMENT_METHODS).filter(m => m.id !== 'card').map((method) => {
                                                const Icon = method.icon
                                                return (
                                                    <button
                                                        key={method.id}
                                                        onClick={() => setPaymentMethod(method.id)}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                                                            paymentMethod === method.id ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/50"
                                                        )}
                                                    >
                                                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                            <Icon className="h-4 w-4 text-emerald-600" />
                                                        </div>
                                                        <span className="text-xs font-bold">{method.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            onClick={handlePayment}
                                            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-95"
                                        >
                                            Confirm Payment <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <AlertCircle className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            A digital receipt will be generated and saved upon confirmation.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <Card className="border-none shadow-lg bg-white/90 p-12">
                        <div className="text-center">
                            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                <Search className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700">Search for a Student</h3>
                            <p className="text-sm text-slate-500 mt-2">Enter a student ID or name to view their fee details and record payments.</p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Generate Invoice Dialog */}
            <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Generate Invoice</DialogTitle>
                        <DialogDescription>
                            Create a new invoice for {selectedStudent?.student.firstName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Term</label>
                            <Select value={genTermId} onValueChange={setGenTermId}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent>
                                    {terms.map((t) => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Due Date</label>
                            <Input
                                type="date"
                                className="rounded-xl"
                                value={genDueDate}
                                onChange={(e) => setGenDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                        <Button onClick={handleGenerate} disabled={isGenerating} className="bg-emerald-600 hover:bg-emerald-700">
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Generate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function CollectFeesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>}>
            <CollectFeesPageContent />
        </Suspense>
    )
}

