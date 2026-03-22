"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowUpRight, Briefcase, Building2, Calendar, CheckCircle2, ChevronRight, Coins, Download, Filter, FilterX, Hash, LayoutGrid, Loader2, MoreHorizontal, PieChart, Plus, Search, TrendingUp, Wallet } from 'lucide-react';
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
import { incomeActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

const INCOME_CATEGORIES = [
    "Donations & Grants",
    "Facility Rental",
    "Sale of Assets",
    "Alumni Contributions",
    "Extra-curricular Fees",
    "Government Subsidy",
    "Service Income",
    "Other"
]

const SOURCES = [
    "Government",
    "Private Donor",
    "NGO",
    "Internal Operations",
    "Community Event",
    "Other"
]

interface Income {
    id: number
    category: string
    amount: number
    date: string
    description: string | null
    source: string | null
}

interface IncomeStats {
    total: number
    pending: number
    topSource: { name: string; amount: number } | null
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

export default function IncomePage() {
    const { confirm } = useConfirm()
    const [incomeRecords, setIncomeRecords] = useState<Income[]>([])
    const [stats, setStats] = useState<IncomeStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [profile, setProfile] = useState<RawProfile | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedIncome, setSelectedIncome] = useState<Income | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Form state
    const [isSaving, setIsSaving] = useState(false)
    const [newIncome, setNewIncome] = useState({
        description: "",
        amount: "",
        category: "",
        source: "",
        date: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [incomeData, statsData, profileData] = await Promise.all([
                incomeActions.getAll() as Promise<Income[]>,
                incomeActions.getStats() as Promise<IncomeStats>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])
            setIncomeRecords(incomeData)
            setStats(statsData)
            setProfile(profileData)
        } catch (error: unknown) {
            console.error("Failed to fetch income:", error)
            toast.error("Failed to load income records")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        const exportData = filteredIncome.map(inc => ({
            ID: `INC-${inc.id.toString().padStart(4, '0')}`,
            Date: inc.date,
            Source: inc.source || 'Standard Revenue',
            Category: inc.category,
            Amount: inc.amount,
            Currency: profile?.currency || 'UGX'
        }))
        exportToCSV(exportData, 'School_Income_Report')
    }

    const openDetails = (income: Income) => {
        setSelectedIncome(income)
        setIsDetailModalOpen(true)
    }

    const handleCreateIncome = async () => {
        if (!newIncome.description || !newIncome.amount || !newIncome.category || !newIncome.source || !newIncome.date) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSaving(true)
        try {
            await incomeActions.create({
                ...newIncome,
                amount: parseFloat(newIncome.amount)
            })
            toast.success("Income record created successfully")
            setIsAddModalOpen(false)
            setNewIncome({
                description: "",
                amount: "",
                category: "",
                source: "",
                date: new Date().toISOString().split('T')[0]
            })
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to create income:", error)
            toast.error("Failed to record income")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteIncome = async (id: number) => {
        if (await confirm({
            title: "Delete Income Record",
            description: "Are you sure you want to permanently delete this revenue record? This will impact your balance sheets and auditing.",
            confirmText: "Delete Record",
            variant: "destructive"
        })) {
            try {
                await incomeActions.delete(id)
                toast.success("Income record deleted successfully")
                fetchData()
            } catch (error: unknown) {
                console.error("Failed to delete income:", error)
                toast.error("Failed to delete income")
            }
        }
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString()
    }

    const filteredIncome = incomeRecords.filter(inc =>
        inc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600 opacity-20" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse">Synchronizing revenue ledger...</p>
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
                    title="Revenue Management"
                    description="Comprehensive tracking of non-fee institutional inflows."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Accounts", href: "/accounts/dashboard" },
                        { label: "Income" },
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
                                        <Plus className="mr-2 h-5 w-5" /> Record Revenue
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[550px] rounded-3xl border-none shadow-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <TrendingUp className="h-6 w-6" />
                                            </div>
                                            Lodge Revenue Record
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-500 font-medium">
                                            Properly categorize all incoming funds for accurate financial reporting.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-6 py-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Voucher Description</label>
                                            <Input
                                                placeholder="e.g., Annual Alumni Fund Donation"
                                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium"
                                                value={newIncome.description}
                                                onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
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
                                                        value={newIncome.amount}
                                                        onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Revenue Source</label>
                                                <Select
                                                    value={newIncome.source}
                                                    onValueChange={(val) => setNewIncome({ ...newIncome, source: val })}
                                                >
                                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium">
                                                        <SelectValue placeholder="Origin" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200">
                                                        {SOURCES.map(s => (
                                                            <SelectItem key={s} value={s} className="rounded-lg">{s}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Category</label>
                                                <Select
                                                    value={newIncome.category}
                                                    onValueChange={(val) => setNewIncome({ ...newIncome, category: val })}
                                                >
                                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium">
                                                        <SelectValue placeholder="Classification" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200">
                                                        {INCOME_CATEGORIES.map(cat => (
                                                            <SelectItem key={cat} value={cat} className="rounded-lg">{cat}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">Date of Receipt</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        type="date"
                                                        className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium"
                                                        value={newIncome.date}
                                                        onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                                                    />
                                                </div>
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
                                            onClick={handleCreateIncome}
                                            disabled={isSaving}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-8 rounded-xl font-bold shadow-xl shadow-emerald-200 transition-all active:scale-[0.98]"
                                        >
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                            Verify & Commit
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    }
                />

                {/* Revenue Highlights */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-4 gap-6"
                >
                    <motion.div variants={item}>
                        <StatCard
                            title="Total Realized"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats?.total || 0)}`}
                            variant="gradient"
                            icon={<TrendingUp className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-emerald-500 to-teal-600"
                            className="shadow-emerald-200/50"
                            change="Gross Revenue"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <StatCard
                            title={stats?.topSource?.name || 'N/A'}
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats?.topSource?.amount || 0)}`}
                            variant="gradient"
                            icon={<Coins className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-blue-600 to-indigo-700"
                            className="shadow-blue-200/50"
                            change="Dominant Origin"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <StatCard
                            title="Expected Inflow"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats?.pending || 0)}`}
                            variant="gradient"
                            icon={<Calendar className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
                            className="shadow-amber-200/50"
                            change="Projected"
                        />
                    </motion.div>

                    <motion.div variants={item}>
                        <StatCard
                            title="Total Records"
                            value={`${stats?.count || 0}`}
                            variant="gradient"
                            icon={<Briefcase className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-indigo-500 to-purple-600"
                            className="shadow-indigo-200/50"
                            change="Entries"
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
                                        placeholder="Search records by source or category..."
                                        className="pl-11 h-10 bg-slate-50 border-slate-100 focus:bg-white focus:ring-emerald-500 transition-all rounded-xl text-sm font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Badge variant="outline" className="h-10 px-3 rounded-xl border-slate-200 bg-emerald-50 text-emerald-700 font-bold border-emerald-100 flex gap-2 cursor-default text-[10px]">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Real-time
                                    </Badge>
                                    <Badge variant="outline" className="h-10 px-3 rounded-xl border-slate-200 bg-blue-50 text-blue-700 font-bold border-blue-100 flex gap-2 cursor-default text-[10px]">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Audited
                                    </Badge>
                                    <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold bg-white hover:bg-slate-50 transition-all shadow-sm text-xs">
                                        <Filter className="mr-2 h-3.5 w-3.5" /> Advance Filters
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
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px] pl-8">Entry / Description</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Category</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Date</TableHead>
                                            <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Amount ({profile?.currency || 'UGX'})</TableHead>
                                            <TableHead className="py-5 text-right font-bold text-emerald-900 uppercase tracking-widest text-[10px] pr-8">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {filteredIncome.length > 0 ? (
                                                filteredIncome.map((inc, idx) => (
                                                    <motion.tr
                                                        key={inc.id}
                                                        layout
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="group border-b border-slate-50 hover:bg-emerald-50/30 transition-colors"
                                                    >
                                                        <TableCell className="py-5 pl-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                                                    {(inc.source || 'IN').substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900">
                                                                        {inc.source || 'Standard Revenue'}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                                                                        Record • INC-#{inc.id.toString().padStart(4, '0')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 rounded-lg px-2.5 py-1 font-bold text-[10px] uppercase tracking-wide">
                                                                {inc.category}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-bold text-slate-600 text-sm">
                                                                {inc.date}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-black text-slate-900">
                                                                {formatCurrency(inc.amount)}
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
                                                                    <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1.5">Manage Income</DropdownMenuLabel>
                                                                    <DropdownMenuItem
                                                                        className="rounded-lg focus:bg-emerald-50 focus:text-emerald-600 py-2.5 cursor-pointer"
                                                                        onClick={() => openDetails(inc)}
                                                                    >
                                                                        <LayoutGrid className="mr-2 h-4 w-4" /> Full Ledger Entry
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                                                    <DropdownMenuItem
                                                                        className="rounded-lg focus:bg-red-50 focus:text-red-600 py-2.5 cursor-pointer text-red-600 font-bold"
                                                                        onClick={() => handleDeleteIncome(inc.id)}
                                                                    >
                                                                        <Briefcase className="mr-2 h-4 w-4" /> Void Entry
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
                                                                <p className="font-black text-xl text-slate-900 uppercase tracking-tighter">No Entry Matched</p>
                                                                <p className="text-sm font-bold text-slate-500">Your current search yielded no records.</p>
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

                    {/* DETAIL MODAL */}
                    <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-slate-200">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2 italic">
                                    <Coins className="h-6 w-6 text-emerald-600" /> Income Detail
                                </DialogTitle>
                                <DialogDescription className="font-medium text-slate-500">
                                    Comprehensive record of institutional revenue.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Record ID</Label>
                                        <p className="font-bold text-slate-900 text-lg">#INC-{selectedIncome?.id.toString().padStart(4, '0')}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Received</Label>
                                        <p className="font-bold text-slate-900 text-lg">{selectedIncome?.date}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Source</Label>
                                        <p className="font-bold text-slate-900">{selectedIncome?.source || 'Standard Revenue'}</p>
                                    </div>
                                    <div className="space-y-1.5 text-right">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount</Label>
                                        <p className="font-black text-emerald-600 text-2xl">{formatUtility(selectedIncome?.amount || 0, profile?.currency)}</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-4 border-t border-slate-100">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Revenue Category</Label>
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg px-3 py-1 font-bold text-xs">
                                        {selectedIncome?.category}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 uppercase">Verified Revenue</p>
                                        <p className="text-[10px] text-emerald-700/70 font-bold italic">This entry has been validated against the institutional treasury.</p>
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

                </div>
            </div>
        </motion.div>
    )
}


