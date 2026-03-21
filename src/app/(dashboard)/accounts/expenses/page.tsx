"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Plus,
    Search,
    Filter,
    Download,
    Receipt,
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Tag,
    Wallet,
    Loader2,
    Hash,
    FilterX,
    LayoutGrid,
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
import { cn, formatCurrency as formatUtility, exportToCSV } from "@/lib/utils"
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
import { expenseActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

const CATEGORIES = [
    "Utilities (Water/Electricity)",
    "Food & Dining",
    "Stationery & Supplies",
    "Maintenance & Repairs",
    "Transport & Fuel",
    "Marketing & Events",
    "Instructional Materials",
    "Staff Welfare",
    "Other"
]

interface Expense {
    id: number
    category: string
    amount: number
    date: string
    description: string | null
}

interface ExpenseStats {
    total: number
    pending: number
    topCategory: { name: string; amount: number } | null
    count: number
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

export default function ExpensesPage() {
    const { confirm } = useConfirm()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [stats, setStats] = useState<ExpenseStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [profile, setProfile] = useState<RawProfile | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

    // Form state
    const [isSaving, setIsSaving] = useState(false)
    const [newExpense, setNewExpense] = useState({
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [expensesData, statsData, profileData] = await Promise.all([
                expenseActions.getAll() as Promise<Expense[]>,
                expenseActions.getStats() as Promise<ExpenseStats>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])
            setExpenses(expensesData)
            setStats(statsData)
            setProfile(profileData)
        } catch (error: unknown) {
            console.error("Failed to fetch expenses:", error)
            toast.error("Failed to load expenses")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        const exportData = filteredExpenses.map(exp => ({
            ID: `EXP-${exp.id.toString().padStart(4, '0')}`,
            Date: exp.date,
            Category: exp.category,
            Description: exp.description || 'N/A',
            Amount: exp.amount,
            Currency: profile?.currency || 'UGX'
        }))
        exportToCSV(exportData, 'School_Expenses_Report')
    }

    const openDetails = (expense: Expense) => {
        setSelectedExpense(expense)
        setIsDetailModalOpen(true)
    }

    const handleCreateExpense = async () => {
        if (!newExpense.description || !newExpense.amount || !newExpense.category || !newExpense.date) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSaving(true)
        try {
            await expenseActions.create({
                ...newExpense,
                amount: parseFloat(newExpense.amount)
            })
            toast.success("Expense recorded successfully")
            setIsAddModalOpen(false)
            setNewExpense({
                description: "",
                amount: "",
                category: "",
                date: new Date().toISOString().split('T')[0]
            })
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to create expense:", error)
            toast.error("Failed to record expense")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteExpense = async (id: number) => {
        if (await confirm({
            title: "Delete Expense Record",
            description: "Are you sure you want to permanently delete this expenditure record? This will impact your financial reports.",
            confirmText: "Delete Record",
            variant: "destructive"
        })) {
            try {
                await expenseActions.delete(id)
                toast.success("Expense deleted successfully")
                fetchData()
            } catch (error: unknown) {
                console.error("Failed to delete expense:", error)
                toast.error("Failed to delete expense")
            }
        }
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString()
    }

    const filteredExpenses = expenses.filter(exp =>
        exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600 opacity-20" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse">Loading expenditure ledger...</p>
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
                    title="Institutional Expenditure"
                    description="Audit-ready tracking of all school-related disbursements."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Accounts", href: "/accounts/dashboard" },
                        { label: "Expenses" },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-12 px-6 rounded-xl border-slate-200 bg-white hover:bg-emerald-50/50 hover:border-emerald-200 text-slate-600 font-bold shadow-xl shadow-emerald-500/5 transition-all hover:scale-[1.05] flex items-center gap-2 group"
                                onClick={handleExport}
                            >
                                <Download className="h-5 w-5 text-emerald-600 transition-transform group-hover:-translate-y-1" /> Export CSV
                            </Button>

                            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 h-12 px-8 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        <Plus className="mr-2 h-5 w-5" /> Record Expense
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <Receipt className="h-6 w-6" />
                                            </div>
                                            Record Expenditure
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-500 font-medium">
                                            Ensure all details match the official receipt for auditing purposes.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Voucher Description</label>
                                            <Input
                                                placeholder="e.g., Purchase of Biology Lab Supplies"
                                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium"
                                                value={newExpense.description}
                                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Amount ({profile?.currency || 'UGX'})</label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{profile?.currency || 'UGX'}</div>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-lg"
                                                        value={newExpense.amount}
                                                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Category</label>
                                                <Select
                                                    value={newExpense.category}
                                                    onValueChange={(val) => setNewExpense({ ...newExpense, category: val })}
                                                >
                                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium">
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200">
                                                        {CATEGORIES.map(cat => (
                                                            <SelectItem key={cat} value={cat} className="rounded-lg">{cat}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Date of Disbursement</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="date"
                                                    className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium"
                                                    value={newExpense.date}
                                                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsAddModalOpen(false)}
                                            className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:text-slate-900"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleCreateExpense}
                                            disabled={isSaving}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 rounded-xl font-bold shadow-xl shadow-emerald-200"
                                        >
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                            Submit Voucher
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    }
                />

                {/* Expense Performance Stats */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-4 gap-6"
                >
                    <motion.div variants={item}>
                        <StatCard
                            title="Total Expenditures"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats?.total || 0)}`}
                            variant="gradient"
                            icon={<TrendingDown className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-rose-500 to-pink-600"
                            className="shadow-rose-200/50"
                            change="Gross Outflow"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <StatCard
                            title="Pending Approval"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats?.pending || 0)}`}
                            variant="gradient"
                            icon={<Clock className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
                            className="shadow-amber-200/50"
                            change="Uncaptured"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <StatCard
                            title={stats?.topCategory?.name || 'N/A'}
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats?.topCategory?.amount || 0)}`}
                            variant="gradient"
                            icon={<LayoutGrid className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-blue-600 to-indigo-700"
                            className="shadow-blue-200/50"
                            change="Dominant Type"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <StatCard
                            title="Transaction Count"
                            value={`${stats?.count || 0}`}
                            variant="gradient"
                            icon={<Hash className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-purple-500 to-fuchsia-600"
                            className="shadow-purple-200/50"
                            change="Vouchers"
                        />
                    </motion.div>
                </motion.div>

                {/* Main Ledger Section */}
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
                                        placeholder="Search expenses by category or description..."
                                        className="pl-11 h-10 bg-slate-50 border-slate-100 focus:bg-white focus:ring-emerald-500 transition-all rounded-xl text-sm font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Badge variant="outline" className="h-10 px-3 rounded-xl border-slate-200 bg-emerald-50 text-emerald-700 font-bold border-emerald-100 flex gap-2 cursor-default text-[10px]">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Professional
                                    </Badge>
                                    <Badge variant="outline" className="h-10 px-3 rounded-xl border-slate-200 bg-amber-50 text-amber-700 font-bold border-amber-100 flex gap-2 cursor-default text-[10px]">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Verified
                                    </Badge>
                                    <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold bg-white hover:bg-slate-50 transition-all shadow-sm text-xs">
                                        <Filter className="mr-2 h-3.5 w-3.5" /> Advance Filters
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* DETAIL MODAL */}
                    <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-slate-200">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2 italic">
                                    <Receipt className="h-6 w-6 text-emerald-600" /> Expense Detail
                                </DialogTitle>
                                <DialogDescription className="font-medium text-slate-500">
                                    Comprehensive record of financial expenditure.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Record ID</Label>
                                        <p className="font-bold text-slate-900 text-lg">#EXP-{selectedExpense?.id.toString().padStart(4, '0')}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Posted</Label>
                                        <p className="font-bold text-slate-900 text-lg">{selectedExpense?.date}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</Label>
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg px-3 py-1 font-bold text-xs">
                                            {selectedExpense?.category}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5 text-right">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount</Label>
                                        <p className="font-black text-emerald-600 text-2xl">{formatUtility(selectedExpense?.amount || 0, profile?.currency)}</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger Description</Label>
                                    <p className="text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                                        {selectedExpense?.description || "No additional description provided for this ledger entry."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 uppercase">Verified Entry</p>
                                        <p className="text-[10px] text-emerald-700/70 font-bold italic">This record has been reconciled with the institutional registry.</p>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-slate-200 h-12 w-full font-bold text-slate-600"
                                    onClick={() => setIsDetailModalOpen(false)}
                                >
                                    Close Detail View
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

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
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px] pl-8">Voucher / Description</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Category</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Date</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Amount ({profile?.currency || 'UGX'})</TableHead>
                                            <TableHead className="py-5 text-right font-bold text-emerald-900 uppercase tracking-widest text-[10px] pr-8">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {filteredExpenses.length > 0 ? (
                                                filteredExpenses.map((exp, idx) => (
                                                    <motion.tr
                                                        key={exp.id}
                                                        layout
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="group border-b border-slate-50 hover:bg-emerald-50/30 transition-colors"
                                                    >
                                                        <TableCell className="py-5 pl-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                                                    {(exp.description || 'EX').substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900">
                                                                        {exp.description || 'Institutional Expenditure'}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                                                                        Voucher • EXP-#{exp.id.toString().padStart(4, '0')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 rounded-lg px-2.5 py-1 font-bold text-[10px] uppercase tracking-wide">
                                                                {exp.category}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-bold text-slate-600 text-sm">
                                                                {exp.date}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-black text-slate-900">
                                                                {formatCurrency(exp.amount)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-8">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100/50">
                                                                        <MoreHorizontal className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl p-2 w-48">
                                                                    <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1.5">Manage Entry</DropdownMenuLabel>
                                                                    <DropdownMenuItem
                                                                        className="rounded-lg focus:bg-emerald-50 focus:text-emerald-600 py-2.5 cursor-pointer"
                                                                        onClick={() => openDetails(exp)}
                                                                    >
                                                                        <LayoutGrid className="mr-2 h-4 w-4" /> Full Ledger Entry
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                                                    <DropdownMenuItem
                                                                        className="rounded-lg focus:bg-red-50 focus:text-red-600 py-2.5 cursor-pointer text-red-600 font-bold"
                                                                        onClick={() => handleDeleteExpense(exp.id)}
                                                                    >
                                                                        <AlertCircle className="mr-2 h-4 w-4" /> Void Transaction
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                                            <FilterX className="h-16 w-16 text-slate-400" />
                                                            <div className="space-y-1">
                                                                <p className="font-black text-xl text-slate-900 uppercase tracking-tighter">Null Result</p>
                                                                <p className="text-sm font-bold text-slate-500">No expenditure records match your current query.</p>
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

                    {/* Audit & Compliance Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="border-none shadow-2xl shadow-slate-900/10 bg-slate-900 text-white overflow-hidden rounded-3xl relative group">
                            <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
                            <CardContent className="p-10 flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                                <div className="flex flex-col lg:flex-row items-center gap-8 text-center lg:text-left">
                                    <div className="h-24 w-24 rounded-[2.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                        <AlertCircle className="h-10 w-10 text-red-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-3xl font-black tracking-tight leading-none uppercase italic">Compliance Monitor</h4>
                                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl opacity-80">
                                            All disbursements exceeding <span className="text-red-400 font-bold">{profile?.currency || 'UGX'} 1,000,000</span> undergo mandated tertiary audit.
                                            Please ensure supporting documentation is filed with the bursar.
                                        </p>
                                    </div>
                                </div>
                                <Button className="bg-white text-slate-950 hover:bg-slate-100 h-16 px-10 rounded-2xl font-black text-lg shadow-2xl transition-all hover:scale-[1.05] active:scale-[0.95] shrink-0 uppercase tracking-tighter">
                                    Audit Analysis
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}


