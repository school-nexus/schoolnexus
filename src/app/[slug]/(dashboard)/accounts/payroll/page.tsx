export const runtime = 'edge';
"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Plus,
    Search,
    Filter,
    Download,
    Users,
    CreditCard,
    Banknote,
    FileText,
    MoreHorizontal,
    ChevronRight,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Briefcase,
    ShieldCheck,
    Loader2,
    Settings2,
    PiggyBank,
    Clock,
    UserPlus,
    Wallet,
    TrendingUp,
    ShieldAlert,
    RefreshCw,
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
import { cn, exportToCSV } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { payrollActions, teacherActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"
import { motion, AnimatePresence } from "framer-motion"

interface PayrollDefinition {
    id: number
    teacherId: number
    teacherName: string
    baseSalary: number
    allowances: number
    deductions: number
    status: string
}

interface PayrollStats {
    activeStaffCount: number
    monthlyTotal: number
    totalPaid: number
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
}

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
}

interface RawProfile {
    currency: string
    name: string
}

interface RawTeacher {
    id: number
    firstName: string
    lastName: string
}

export default function PayrollPage() {
    const { confirm } = useConfirm()
    const [payrollList, setPayrollList] = useState<PayrollDefinition[]>([])
    const [stats, setStats] = useState<PayrollStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isManageModalOpen, setIsManageModalOpen] = useState(false)
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
    const [profile, setProfile] = useState<RawProfile | null>(null)
    const [teachers, setTeachers] = useState<RawTeacher[]>([])

    // Management Form State
    const [isSaving, setIsSaving] = useState(false)
    const [editingPayroll, setEditingPayroll] = useState({
        id: undefined as number | undefined,
        teacherId: "",
        baseSalary: "",
        allowances: "",
        deductions: "",
        status: "Active"
    })

    // Payment Form State
    const [processingSalary, setProcessingSalary] = useState({
        payrollId: "",
        amount: "",
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear().toString(),
        paymentDate: new Date().toISOString().split('T')[0],
        method: "Cash"
    })

    useEffect(() => {
        fetchData()
        fetchTeachers()
    }, [])

    const fetchData = async () => {
        try {
            const [list, statsData, profileData] = await Promise.all([
                payrollActions.getAll() as Promise<PayrollDefinition[]>,
                payrollActions.getStats() as Promise<PayrollStats>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])
            setPayrollList(list)
            setStats(statsData)
            setProfile(profileData)
        } catch (error: unknown) {
            console.error("Failed to fetch payroll:", error)
            toast.error("Failed to load payroll records")
        } finally {
            setLoading(false)
        }
    }

    const fetchTeachers = async () => {
        try {
            const list = await teacherActions.getAll() as RawTeacher[]
            setTeachers(list)
        } catch (error: unknown) {
            console.error("Failed to fetch teachers:", error)
        }
    }

    const handleSavePayroll = async () => {
        if (!editingPayroll.teacherId || !editingPayroll.baseSalary) {
            toast.error("Teacher and Base Salary are required")
            return
        }

        setIsSaving(true)
        try {
            const data = {
                ...editingPayroll,
                teacherId: parseInt(editingPayroll.teacherId),
                baseSalary: parseFloat(editingPayroll.baseSalary),
                allowances: parseFloat(editingPayroll.allowances || "0"),
                deductions: parseFloat(editingPayroll.deductions || "0"),
            }

            if (editingPayroll.id) {
                await payrollActions.update(data)
                toast.success("Payroll definition updated")
            } else {
                await payrollActions.create(data)
                toast.success("New payroll definition created")
            }
            setIsManageModalOpen(false)
            setEditingPayroll({
                id: undefined,
                teacherId: "",
                baseSalary: "",
                allowances: "",
                deductions: "",
                status: "Active"
            })
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to save payroll:", error)
            toast.error("Failed to save payroll definition")
        } finally {
            setIsSaving(false)
        }
    }

    const handleExport = () => {
        const exportData = filteredList.map(item => ({
            Employee: item.teacherName,
            Salary_Definition: `${item.teacherName} - ${item.status}`,
            Basic_Salary: item.baseSalary + item.allowances - item.deductions,
            Last_Paid: 'Never', // Placeholder as PayrollDefinition doesn't have this field
            Status: item.status
        }))
        exportToCSV(exportData, 'School_Payroll_Roster')
    }

    const handleDeleteRosterItem = async (id: number) => {
        if (await confirm({
            title: "Remove from Payroll",
            description: "Are you sure you want to remove this employee from the payroll roster? This will stop all future salary processing for them.",
            confirmText: "Remove Employee",
            variant: "destructive"
        })) {
            try {
                await payrollActions.deleteRoster(id)
                toast.success("Employee removed from payroll")
                fetchData()
            } catch (error: unknown) {
                toast.error("Failed to remove employee")
            }
        }
    }

    const handleProcessPayment = async () => {
        if (!processingSalary.payrollId || !processingSalary.amount) {
            toast.error("Voucher selection and amount are required")
            return
        }

        setIsSaving(true)
        try {
            await payrollActions.processPayment({
                ...processingSalary,
                payrollId: parseInt(processingSalary.payrollId),
                amountPaid: parseFloat(processingSalary.amount),
                year: parseInt(processingSalary.year)
            })
            toast.success("Salary payment processed successfully")
            setIsProcessModalOpen(false)
            setProcessingSalary({
                payrollId: "",
                amount: "",
                month: new Date().toLocaleString('default', { month: 'long' }),
                year: new Date().getFullYear().toString(),
                paymentDate: new Date().toISOString().split('T')[0],
                method: "Bank Transfer"
            })
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to process payment:", error)
            toast.error("Failed to process salary payment")
        } finally {
            setIsSaving(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString()
    }

    const filteredList = payrollList.filter(p =>
        p.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600 opacity-20" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse">Initializing payroll system...</p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-10">
                <PageHeader
                    title="Payroll Administration"
                    description="Comprehensive staff remuneration and benefits management."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Accounts", href: "/accounts/dashboard" },
                        { label: "Payroll" },
                    ]}
                    actions={
                        <>
                            <Button
                                variant="outline"
                                className="h-12 px-6 rounded-xl border-slate-200 bg-white hover:bg-emerald-50/50 hover:border-emerald-200 text-slate-600 font-bold shadow-xl shadow-emerald-500/5 transition-all hover:scale-[1.05] flex items-center gap-2 group"
                                onClick={handleExport}
                            >
                                <Download className="h-5 w-5 text-emerald-600 transition-transform group-hover:-translate-y-1" /> Export CSV
                            </Button>

                            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 h-12 px-6 rounded-2xl shadow-sm transition-all hover:shadow-md">
                                        <UserPlus className="mr-2 h-4 w-4" /> Definition
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Settings2 className="h-6 w-6" />
                                            </div>
                                            {editingPayroll.id ? 'Modify Definition' : 'Define Compensation'}
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-500 font-medium">
                                            Set base salary and recurring statutory adjustments.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Staff Member</label>
                                            <Select
                                                value={editingPayroll.teacherId}
                                                onValueChange={(val) => setEditingPayroll({ ...editingPayroll, teacherId: val })}
                                                disabled={!!editingPayroll.id}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium">
                                                    <SelectValue placeholder="Select Staff" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {teachers.map(t => (
                                                        <SelectItem key={t.id} value={t.id.toString()}>{t.firstName} {t.lastName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Base Contract Salary ({profile?.currency || 'UGX'})</label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{profile?.currency || 'UGX'}</div>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-lg"
                                                        value={editingPayroll.baseSalary}
                                                        onChange={(e) => setEditingPayroll({ ...editingPayroll, baseSalary: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Standard Allowances</label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium"
                                                    value={editingPayroll.allowances}
                                                    onChange={(e) => setEditingPayroll({ ...editingPayroll, allowances: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Standard Deductions</label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium"
                                                    value={editingPayroll.deductions}
                                                    onChange={(e) => setEditingPayroll({ ...editingPayroll, deductions: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setIsManageModalOpen(false)
                                                setEditingPayroll({ id: undefined, teacherId: "", baseSalary: "", allowances: "", deductions: "", status: "Active" })
                                            }}
                                            className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:text-slate-900"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSavePayroll}
                                            disabled={isSaving}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 rounded-xl font-bold shadow-xl shadow-emerald-200 transition-all active:scale-[0.98]"
                                        >
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                            Commit Definition
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 h-12 px-8 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        <CreditCard className="mr-2 h-5 w-5" /> Process Disbursement
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <Wallet className="h-6 w-6" />
                                            </div>
                                            Execute Disbursement
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-500 font-medium">
                                            Authorize and record a salary payment voucher.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Active Voucher</label>
                                            <Select
                                                value={processingSalary.payrollId}
                                                onValueChange={(val) => {
                                                    const p = payrollList.find(x => x.id === parseInt(val))
                                                    setProcessingSalary({
                                                        ...processingSalary,
                                                        payrollId: val,
                                                        amount: p ? (p.baseSalary + p.allowances - p.deductions).toString() : ""
                                                    })
                                                }}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium">
                                                    <SelectValue placeholder="Select Staff Definition" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {payrollList.map(p => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>{p.teacherName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Cycle Month</label>
                                                <Select
                                                    value={processingSalary.month}
                                                    onValueChange={(val) => setProcessingSalary({ ...processingSalary, month: val })}
                                                >
                                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium">
                                                        <SelectValue placeholder="Month" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Amount Disbursed</label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{profile?.currency || 'UGX'}</div>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-lg"
                                                        value={processingSalary.amount}
                                                        onChange={(e) => setProcessingSalary({ ...processingSalary, amount: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Payment Channel</label>
                                                <Select
                                                    value={processingSalary.method}
                                                    onValueChange={(val) => setProcessingSalary({ ...processingSalary, method: val })}
                                                >
                                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium">
                                                        <SelectValue placeholder="Method" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="Cash">Cash Handover</SelectItem>
                                                        <SelectItem value="Bank Transfer">Bank Electronic Transfer</SelectItem>
                                                        <SelectItem value="Mobile Money">Mobile Money Wallet</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Disbursement Date</label>
                                                <Input
                                                    type="date"
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium"
                                                    value={processingSalary.paymentDate}
                                                    onChange={(e) => setProcessingSalary({ ...processingSalary, paymentDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setIsProcessModalOpen(false)
                                            }}
                                            className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:text-slate-900"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleProcessPayment}
                                            disabled={isSaving}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 rounded-xl font-bold shadow-xl shadow-emerald-200 transition-all active:scale-[0.98]"
                                        >
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Banknote className="h-4 w-4 mr-2" />}
                                            Execute Batch
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    }
                />

                {/* Payroll Metrics */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-4 gap-6"
                >
                    <motion.div variants={item}>
                        <StatCard
                            title="Monthly Liability"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats?.monthlyTotal || 0)}`}
                            variant="gradient"
                            icon={<TrendingUp className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-blue-600 to-indigo-700"
                            className="shadow-blue-200/50"
                            change="Commitment Total"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <StatCard
                            title="Active Recipients"
                            value={`${stats?.activeStaffCount || 0}`}
                            variant="gradient"
                            icon={<Users className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-emerald-500 to-teal-600"
                            className="shadow-emerald-200/50"
                            change="Payroll Roster"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <StatCard
                            title="Cycle Deductions"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(payrollList.reduce((s, p) => s + p.deductions, 0))}`}
                            variant="gradient"
                            icon={<ShieldCheck className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-indigo-500 to-purple-600"
                            className="shadow-indigo-200/50"
                            change="Statutory Levy"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <StatCard
                            title="Cumulative Paid"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats?.totalPaid || 0)}`}
                            variant="gradient"
                            icon={<Briefcase className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
                            className="shadow-amber-200/50"
                            change="Annual Disbursed"
                        />
                    </motion.div>
                </motion.div>

                {/* Main Roster Section */}
                <div className="space-y-6">
                    {/* FILTERS & SEARCH */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 p-4">
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative flex-1 max-w-md w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search staff members by name..."
                                        className="pl-11 h-10 bg-slate-50 border-slate-100 focus:bg-white focus:ring-emerald-500 transition-all rounded-xl text-sm font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Button variant="ghost" className="h-10 px-4 rounded-xl text-slate-400 font-bold hover:text-slate-900 transition-colors text-xs" onClick={() => fetchData()}>
                                        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Sync
                                    </Button>
                                    <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold bg-white hover:bg-slate-50 transition-all shadow-sm text-xs">
                                        <Filter className="mr-2 h-3.5 w-3.5" /> Filter
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* TABLE SECTION */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/40 overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-emerald-50 border-b border-emerald-100">
                                        <TableRow className="hover:bg-emerald-50/50 border-none">
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px] pl-8">Employee Details</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Net Salary</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Allowances</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Deductions</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Status</TableHead>
                                            <TableHead className="py-5 text-right font-bold text-emerald-900 uppercase tracking-widest text-[10px] pr-8">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {filteredList.length > 0 ? (
                                                filteredList.map((p, idx) => (
                                                    <motion.tr
                                                        key={p.id}
                                                        layout
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="group border-b border-slate-50 hover:bg-emerald-50/30 transition-colors"
                                                    >
                                                        <TableCell className="py-5 pl-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                                                    {p.teacherName.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                                        {p.teacherName}
                                                                    </p>
                                                                    <span className="text-[11px] text-slate-400 font-black uppercase tracking-tighter">
                                                                        VOUCHER • VCH-#{p.id.toString().padStart(4, '0')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-black text-slate-900">
                                                                {formatCurrency(p.baseSalary + p.allowances - p.deductions)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm font-bold text-slate-600">+{formatCurrency(p.allowances)}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm font-bold text-slate-600">-{formatCurrency(p.deductions)}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn(
                                                                "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-none",
                                                                p.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                            )}>
                                                                {p.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-8">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100/50">
                                                                        <MoreHorizontal className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl p-2 w-56">
                                                                    <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1.5">Employee Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem className="rounded-lg focus:bg-emerald-50 focus:text-emerald-600 py-2.5 cursor-pointer" onClick={() => {
                                                                        setEditingPayroll({
                                                                            id: p.id,
                                                                            teacherId: p.teacherId.toString(),
                                                                            baseSalary: p.baseSalary.toString(),
                                                                            allowances: p.allowances.toString(),
                                                                            deductions: p.deductions.toString(),
                                                                            status: p.status
                                                                        })
                                                                        setIsManageModalOpen(true)
                                                                    }}>
                                                                        <Settings2 className="mr-2 h-4 w-4" /> Adjust Definition
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="rounded-lg focus:bg-emerald-50 focus:text-emerald-600 py-2.5 cursor-pointer" onClick={() => {
                                                                        setProcessingSalary({
                                                                            ...processingSalary,
                                                                            payrollId: p.id.toString(),
                                                                            amount: (p.baseSalary + p.allowances - p.deductions).toString()
                                                                        })
                                                                        setIsProcessModalOpen(true)
                                                                    }}>
                                                                        <CreditCard className="mr-2 h-4 w-4" /> Individual Pay
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="rounded-lg focus:bg-emerald-50 focus:text-emerald-600 py-2.5 cursor-pointer" onClick={() => {
                                                                        toast.info("Generating payslip for " + p.teacherName)
                                                                        // Mock payslip export
                                                                        const payslip = [{
                                                                            Employee: p.teacherName,
                                                                            Salary: p.baseSalary + p.allowances - p.deductions,
                                                                            Date: new Date().toLocaleDateString(),
                                                                            Institution: profile?.name || "School Nexus"
                                                                        }]
                                                                        exportToCSV(payslip, `Payslip_${p.teacherName.replace(' ', '_')}`)
                                                                    }}>
                                                                        <FileText className="mr-2 h-4 w-4" /> Export Payslip
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer rounded-xl h-11 font-bold text-rose-600 focus:text-rose-700 focus:bg-rose-50 flex items-center gap-3"
                                                                    >
                                                                        <ShieldAlert className="h-4 w-4" /> Terminate Roster Item
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                                            <Users className="h-16 w-16 text-slate-400" />
                                                            <div className="space-y-1">
                                                                <p className="font-black text-xl text-slate-900 uppercase tracking-tighter">Null Roster</p>
                                                                <p className="text-sm font-bold text-slate-500">No staff members have been defined on the payroll ledger.</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </motion.div>

                </div>
            </div>
        </motion.div >
    )
}


