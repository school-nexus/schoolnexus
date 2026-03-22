"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Plus,
    Search,
    Filter,
    PieChart,
    BarChart3,
    Target,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    ChevronRight,
    ArrowUpRight,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Layers,
    Loader2,
    Trash2,
    Edit2,
    History,
    FileText,
    ArrowRight,
    Wallet,
    Sparkles,
    ShieldCheck
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
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { budgetActions, expenseActions, academicYearActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Budget {
    id: number
    category: string
    allocatedAmount: number
    academicYearId: number
    notes: string | null
}

interface BudgetStats {
    totalAllocated: number
    totalSpent: number
    remaining: number
    usage: number
    categoryCount: number
}

interface AcademicYear {
    id: number
    name: string
    status: string
    isActive: boolean
}

interface Expense {
    id: number
    category: string
    amount: number
    date: string
    description: string
}

interface ForecastItem {
    category: string
    previousAmount: number
    suggestedAmount: number
    growthFactor?: number
}

export default function BudgetPage() {
    const { confirm } = useConfirm()
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [stats, setStats] = useState<BudgetStats | null>(null)
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedYear, setSelectedYear] = useState<string>("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const [currentBudget, setCurrentBudget] = useState<Budget | null>(null)
    const [formData, setFormData] = useState({
        category: "",
        allocatedAmount: "",
        academicYearId: "",
        notes: ""
    })
    const [isForecastModalOpen, setIsForecastModalOpen] = useState(false)
    const [forecastData, setForecastData] = useState<ForecastItem[]>([])
    const [isForecasting, setIsForecasting] = useState(false)
    const [forecastSettings, setForecastSettings] = useState({
        growthMultiplier: 1.0,
        safetyBuffer: 10 // percentage
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [budgetData, expenseData, statsData, yearsData] = await Promise.all([
                budgetActions.getAll() as Promise<Budget[]>,
                expenseActions.getAll() as Promise<Expense[]>,
                budgetActions.getStats() as Promise<BudgetStats>,
                academicYearActions.getAll() as Promise<AcademicYear[]>
            ])
            setBudgets(budgetData)
            setExpenses(expenseData)
            setStats(statsData)
            setAcademicYears(yearsData)

            const activeYear = yearsData.find(y => y.isActive)
            const yearToSelect = activeYear ? activeYear.id.toString() : (yearsData.length > 0 ? yearsData[0].id.toString() : "")
            
            if (yearToSelect) {
                setSelectedYear(yearToSelect)
                setFormData(prev => ({ ...prev, academicYearId: yearToSelect }))
            }
        } catch (error: unknown) {
            console.error("Failed to fetch initial data:", error)
            toast.error("Failed to load budget data")
        } finally {
            setLoading(false)
        }
    }


    const refreshData = async () => {
        try {
            const [budgetData, statsData] = await Promise.all([
                budgetActions.getAll() as Promise<Budget[]>,
                budgetActions.getStats() as Promise<BudgetStats>
            ])
            setBudgets(budgetData)
            setStats(statsData)
        } catch (error: unknown) {
            console.error("Failed to refresh data:", error)
        }
    }

    const formatCurrency = (amount: number) => {
        return `UGX ${amount.toLocaleString()}`
    }

    const handleCreateBudget = async () => {
        const academicYearId = formData.academicYearId || selectedYear
        if (!formData.category || !formData.allocatedAmount || !academicYearId) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            await budgetActions.create({
                category: formData.category,
                allocatedAmount: parseFloat(formData.allocatedAmount),
                academicYearId: parseInt(academicYearId),
                notes: formData.notes
            })
            toast.success("Budget category created successfully")
            setIsCreateModalOpen(false)
            setFormData({ category: "", allocatedAmount: "", academicYearId: selectedYear, notes: "" })
            refreshData()
        } catch (error: unknown) {
            toast.error("Failed to create budget category")
        }
    }

    const handleUpdateBudget = async () => {
        if (!currentBudget || !formData.category || !formData.allocatedAmount) return

        try {
            await budgetActions.update({
                id: currentBudget.id,
                category: formData.category,
                allocatedAmount: parseFloat(formData.allocatedAmount),
                academicYearId: parseInt(formData.academicYearId || selectedYear),
                notes: formData.notes
            })
            toast.success("Budget updated successfully")
            setIsEditModalOpen(false)
            refreshData()
        } catch (error: unknown) {
            toast.error("Failed to update budget")
        }
    }

    const handleDeleteBudget = async (budget: Budget) => {
        if (await confirm({
            title: "Delete Budget Allocation",
            description: `Are you sure you want to delete the ${budget.category} allocation? This will remove the tracking for this category but won't delete existing expenses.`,
            confirmText: "Delete Category",
            variant: "destructive"
        })) {
            try {
                await budgetActions.delete(budget.id)
                toast.success("Budget category deleted")
                refreshData()
            } catch (error: unknown) {
                toast.error("Failed to delete budget")
            }
        }
    }

    const handleRunForecast = async () => {
        if (!selectedYear) {
            toast.error("Please select a target academic year first")
            return
        }

        setIsForecasting(true)
        try {
            const data = await budgetActions.getForecast(parseInt(selectedYear)) as ForecastItem[]
            setForecastData(data)
            setIsForecastModalOpen(true)
        } catch (error: unknown) {
            console.error("Forecasting failed:", error)
            toast.error("Failed to generate forecast. Ensure you have historical expense data.")
        } finally {
            setIsForecasting(false)
        }
    }

    const handleApplyForecast = async () => {
        if (forecastData.length === 0) return

        if (await confirm({
            title: "Apply Smart Forecast?",
            description: `This will create ${forecastData.length} new budget allocations for the selected year. This action cannot be easily undone.`,
            confirmText: "Apply Forecast",
            variant: "default"
        })) {
            try {
                const multiplier = forecastSettings.growthMultiplier * (1 + (forecastSettings.safetyBuffer / 100))
                
                for (const item of forecastData) {
                    await budgetActions.create({
                        category: item.category,
                        allocatedAmount: Math.ceil(item.suggestedAmount * (multiplier / (item.growthFactor || 1.1))),
                        academicYearId: parseInt(selectedYear),
                        notes: `Automated forecast based on previous spending. (Growth x${forecastSettings.growthMultiplier}, Buffer ${forecastSettings.safetyBuffer}%)`
                    })
                }
                toast.success("Forecast applied successfully")
                setIsForecastModalOpen(false)
                refreshData()
            } catch (error: unknown) {
                console.error("Failed to apply forecast:", error)
                toast.error("Failed to apply some forecast allocations")
            }
        }
    }

    const openEditModal = (budget: Budget) => {
        setCurrentBudget(budget)
        setFormData({
            category: budget.category,
            allocatedAmount: budget.allocatedAmount.toString(),
            academicYearId: budget.academicYearId.toString(),
            notes: budget.notes || ""
        })
        setIsEditModalOpen(true)
    }

    const openHistoryModal = (budget: Budget) => {
        setCurrentBudget(budget)
        setIsHistoryModalOpen(true)
    }

    // Calculate spent per category
    const getBudgetWithSpending = () => {
        const categorySpending: Record<string, number> = {}
        expenses.forEach(e => {
            categorySpending[e.category] = (categorySpending[e.category] || 0) + e.amount
        })

        return budgets
            .filter(b => b.academicYearId.toString() === selectedYear)
            .map(b => {
                const spent = categorySpending[b.category] || 0
                const remaining = b.allocatedAmount - spent
                const usage = b.allocatedAmount > 0 ? Math.round((spent / b.allocatedAmount) * 100) : 0
                let status = "On Track"
                if (usage > 100) status = "Overspent"
                else if (usage > 90) status = "Warning"
                else if (usage < 50) status = "Under"

                return {
                    ...b,
                    spent,
                    remaining,
                    usage,
                    status
                }
            })
            .filter(b => b.category.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    const enrichedBudgets = getBudgetWithSpending()
    const onTrack = enrichedBudgets.filter(b => b.status === "On Track").length
    const warning = enrichedBudgets.filter(b => b.status === "Warning").length
    const overspent = enrichedBudgets.filter(b => b.status === "Overspent").length

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600 opacity-20" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse">Syncing budget allocations...</p>
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
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <PageHeader
                                title="Budget Management"
                                description="Monitor institutional spending vs. budget allocations across categories."
                                breadcrumbs={[
                                    { label: "Accounts", href: "/accounts/dashboard" },
                                    { label: "Budget" },
                                ]}
                            />
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-wrap items-center gap-3"
                    >
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="h-12 w-[180px] rounded-xl border-slate-200 bg-white/80 backdrop-blur-md shadow-sm ring-offset-emerald-50 focus:ring-emerald-500">
                                <SelectValue placeholder="Fiscal Year" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                {academicYears.map(year => (
                                    <SelectItem key={year.id} value={year.id.toString()}>
                                        {year.name} {year.isActive && "(Active)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-3 h-12">

                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-full px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <Plus className="mr-2 h-5 w-5" /> New Allocation
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* OVERVIEW STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <StatCard
                            title="Total Budget"
                            value={formatCurrency(stats?.totalAllocated || 0).replace('UGX ', '')}
                            variant="gradient"
                            icon={<Wallet className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-blue-600 to-indigo-700"
                            className="shadow-blue-200/50"
                            change="Overall allocated funds"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <StatCard
                            title="Total Spent"
                            value={formatCurrency(stats?.totalSpent || 0).replace('UGX ', '')}
                            variant="gradient"
                            icon={<TrendingUp className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-emerald-500 to-teal-600"
                            className="shadow-emerald-200/50"
                            change="Actual expenditure"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <StatCard
                            title="Remaining"
                            value={formatCurrency(stats?.remaining || 0).replace('UGX ', '')}
                            variant="gradient"
                            icon={<Target className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-indigo-500 to-purple-600"
                            className="shadow-indigo-200/50"
                            change="Available for spending"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <StatCard
                            title="Overall Usage"
                            value={`${stats?.usage || 0}%`}
                            variant="gradient"
                            icon={<PieChart className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
                            className="shadow-amber-200/50"
                            change="Budget utilization rate"
                        />
                    </motion.div>
                </div>

                {/* BUDGET TRACKING SECTION */}
                <div className="space-y-6">
                    {/* FILTERS & SEARCH */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 max-w-md w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search categories... (e.g. Infrastructure)"
                                    className="pl-11 h-10 bg-slate-50 border-slate-100 focus:bg-white focus:ring-emerald-500 transition-all rounded-xl text-sm font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Badge variant="outline" className="h-10 px-3 rounded-xl border-slate-200 bg-emerald-50 text-emerald-700 font-bold border-emerald-100 flex gap-2 cursor-default text-[10px]">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {onTrack} On Track
                                </Badge>
                                <Badge variant="outline" className="h-10 px-3 rounded-xl border-slate-200 bg-amber-50 text-amber-700 font-bold border-amber-100 flex gap-2 cursor-default text-[10px]">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {warning} Warning
                                </Badge>
                                <Badge variant="outline" className="h-10 px-3 rounded-xl border-slate-200 bg-red-50 text-red-700 font-bold border-red-100 flex gap-2 cursor-default text-[10px]">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" /> {overspent} Critical
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    {/* BUDGET TABLE */}
                    <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/40 overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-emerald-50 border-b border-emerald-100">
                                    <TableRow className="hover:bg-emerald-50/50 border-none">
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px] pl-8">Category Name</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Budgeted (UGX)</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Spent (UGX)</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Remaining</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px] w-[200px]">Utilization</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Status</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px] text-right pr-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {enrichedBudgets.length > 0 ? enrichedBudgets.map((item, idx) => (
                                            <motion.tr
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group border-b border-slate-50 hover:bg-emerald-50/30 transition-colors"
                                            >
                                                <TableCell className="pl-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                                            {item.category.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{item.category}</p>
                                                            {item.notes && <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{item.notes}</p>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-600">{item.allocatedAmount.toLocaleString()}</TableCell>
                                                <TableCell className="font-bold text-slate-900">{item.spent.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "font-bold",
                                                        item.remaining < 0 ? "text-red-600" : "text-emerald-600"
                                                    )}>
                                                        {item.remaining.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-[10px] font-bold">
                                                            <span className="text-slate-400">{item.usage}% Used</span>
                                                            <span className={cn(
                                                                item.usage > 100 ? "text-red-500" :
                                                                    item.usage > 85 ? "text-amber-500" : "text-emerald-500"
                                                            )}>
                                                                {item.usage > 100 ? "Limit Exceeded" : "Healthy"}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(item.usage, 100)}%` }}
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-500",
                                                                    item.usage > 100 ? "bg-red-500" :
                                                                        item.usage > 90 ? "bg-amber-500" : "bg-emerald-500"
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-lg px-2.5 py-1 text-[10px] font-bold border",
                                                        item.status === 'On Track' ? "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm" :
                                                            item.status === 'Warning' ? "bg-amber-50 text-amber-700 border-amber-100 shadow-sm" :
                                                                item.status === 'Overspent' ? "bg-red-50 text-red-700 border-red-100 shadow-sm" :
                                                                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    )}>
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100/50">
                                                                <MoreHorizontal className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl p-2 w-48">
                                                            <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1.5">Manage Budget</DropdownMenuLabel>
                                                            <DropdownMenuItem className="rounded-lg focus:bg-emerald-50 focus:text-emerald-600 py-2.5 cursor-pointer" onClick={() => openEditModal(item)}>
                                                                <Edit2 className="mr-2 h-4 w-4" /> Edit Allocation
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="rounded-lg focus:bg-emerald-50 focus:text-emerald-600 py-2.5 cursor-pointer" onClick={() => openHistoryModal(item)}>
                                                                <History className="mr-2 h-4 w-4" /> Usage History
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                                            <DropdownMenuItem className="rounded-lg focus:bg-red-50 focus:text-red-600 py-2.5 cursor-pointer text-red-600" onClick={() => handleDeleteBudget(item)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Category
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </motion.tr>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-[400px] text-center">
                                                    <div className="flex flex-col items-center justify-center gap-4">
                                                        <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 ring-4 ring-white shadow-inner">
                                                            <Layers className="h-10 w-10" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-slate-900 font-bold text-lg">No Budget Allocations Found</p>
                                                            <p className="text-slate-400 text-sm max-w-[250px] mx-auto font-medium">Create budget categories to start monitoring your institutional spending patterns.</p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                            onClick={() => setIsCreateModalOpen(true)}
                                                        >
                                                            Define First Category
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* BOTTOM CTA: FORECASTING */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="border-none shadow-2xl shadow-slate-200 bg-slate-900 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none" />
                        <CardContent className="p-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                            <div className="flex items-start gap-8">
                                <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                    <BarChart3 className="h-8 w-8 text-emerald-400" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-white">Smart Budget Forecasting</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed max-w-xl font-medium">
                                        Leverage historical expense trends and enrollment projections to generate optimized budget forecasts for the next academic term.
                                        Identify potential savings and optimize resource allocation.
                                    </p>
                                </div>
                            </div>
                            <Button 
                                className="bg-emerald-600 hover:bg-emerald-500 text-white h-14 px-10 rounded-2xl font-bold shadow-xl shadow-emerald-900/40 border border-emerald-400/20 transition-all hover:scale-[1.05] whitespace-nowrap active:scale-[0.98]"
                                onClick={handleRunForecast}
                                disabled={isForecasting}
                            >
                                {isForecasting ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calculating...</>
                                ) : (
                                    <><Sparkles className="mr-2 h-5 w-5" /> Generate Smart Forecast <ArrowRight className="ml-2 h-5 w-5" /></>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* SMART FORECAST PREVIEW MODAL */}
            <Dialog open={isForecastModalOpen} onOpenChange={setIsForecastModalOpen}>
                <DialogContent className="sm:max-w-3xl rounded-3xl border-none shadow-2xl bg-white p-0 overflow-hidden ring-1 ring-slate-200">
                    <DialogHeader className="p-8 bg-slate-900 text-white relative">
                        <div className="absolute top-0 right-0 p-8 text-emerald-500/10 scale-[4] rotate-12 pointer-events-none">
                            <Sparkles className="h-10 w-10" />
                        </div>
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <Sparkles className="h-7 w-7 text-emerald-400" />
                            Smart Budget Forecast Preview
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium text-base">
                            Projected allocations for {academicYears.find(y => y.id.toString() === selectedYear)?.name} based on historical trends.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-8">
                        {/* Forecast Summary Indicators */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Total projected</p>
                                <p className="text-lg font-black text-emerald-900">
                                    {formatCurrency(forecastData.reduce((s, i) => s + i.suggestedAmount, 0))}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Categories</p>
                                <p className="text-lg font-black text-blue-900">{forecastData.length}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                                <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1">Confidence</p>
                                <p className="text-lg font-black text-purple-900">High (85%)</p>
                            </div>
                        </div>

                        {/* Adjustment Parameters (Simplified preview for now) */}
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h5 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-emerald-600" /> 
                                        Adjustment Multipliers
                                    </h5>
                                    <p className="text-xs text-slate-500 font-medium">Fine-tune the forecast based on external factors.</p>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold border-slate-200" onClick={() => {
                                    toast.info("Parameter fine-tuning is currently using recommended defaults.")
                                }}>
                                    Recommend Settings
                                </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8 pt-2">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Multiplier</Label>
                                        <Badge variant="outline" className="font-bold text-emerald-600 border-emerald-100 bg-emerald-50/50">x{forecastSettings.growthMultiplier}</Badge>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full cursor-not-allowed overflow-hidden">
                                        <div className="h-full w-full bg-emerald-500 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Buffer</Label>
                                        <Badge variant="outline" className="font-bold text-blue-600 border-blue-100 bg-blue-50/50">{forecastSettings.safetyBuffer}%</Badge>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full cursor-not-allowed overflow-hidden">
                                        <div className="h-full w-[10%] bg-blue-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Forecast List */}
                        <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="py-4 font-bold text-slate-900 uppercase tracking-widest text-[10px]">Category</TableHead>
                                        <TableHead className="py-4 font-bold text-slate-900 uppercase tracking-widest text-[10px]">Prev. Spent (UGX)</TableHead>
                                        <TableHead className="py-4 font-bold text-slate-900 uppercase tracking-widest text-[10px] text-right">Forecast (UGX)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {forecastData.map((item, idx) => (
                                        <TableRow key={idx} className="group hover:bg-emerald-50/30">
                                            <TableCell className="font-bold text-slate-900">{item.category}</TableCell>
                                            <TableCell className="font-medium text-slate-400 italic">
                                                {formatCurrency(item.previousAmount).replace('UGX ', '')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 text-emerald-600">
                                                    <span className="font-black text-lg">
                                                        {formatCurrency(item.suggestedAmount).replace('UGX ', '')}
                                                    </span>
                                                    <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 gap-4">
                        <Button variant="outline" className="h-14 rounded-2xl border-slate-200 font-bold px-8 shadow-sm" onClick={() => setIsForecastModalOpen(false)}>
                            Discard Projection
                        </Button>
                        <Button className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-xl shadow-emerald-500/20 px-10 text-white min-w-[200px]" onClick={handleApplyForecast}>
                            <ShieldCheck className="mr-2 h-5 w-5" /> Apply to Year
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CREATE BUDGET MODAL */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Plus className="h-6 w-6 text-emerald-600" /> New Budget Allocation
                        </DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            Define a new budget category and set it's allocation for the current academic year.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Category</Label>
                            <Input
                                id="category"
                                placeholder="e.g. Science Laboratory"
                                className="col-span-3 h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-emerald-500"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Allocated (UGX)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                className="col-span-3 h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-emerald-500"
                                value={formData.allocatedAmount}
                                onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="year" className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Fiscal Year</Label>
                            <Select
                                value={formData.academicYearId || selectedYear}
                                onValueChange={(val) => setFormData({ ...formData, academicYearId: val })}
                            >
                                <SelectTrigger className="col-span-3 h-12 rounded-xl border-slate-100 bg-slate-50">
                                    <SelectValue placeholder="Select Academic Year" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200">
                                    {academicYears.map(year => (
                                        <SelectItem key={year.id} value={year.id.toString()}>{year.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="notes" className="text-right mt-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Description</Label>
                            <Textarea
                                id="notes"
                                placeholder="Briefly describe the purpose of this budget..."
                                className="col-span-3 min-h-[100px] rounded-xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-emerald-500 resize-none"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-bold" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-500/20 px-8" onClick={handleCreateBudget}>Save Allocation</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EDIT BUDGET MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Edit2 className="h-6 w-6 text-indigo-600" /> Edit Allocation
                        </DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            Modify the allocated amount or description for {formData.category}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-category" className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Category</Label>
                            <Input
                                id="edit-category"
                                className="col-span-3 h-12 rounded-xl border-slate-100 bg-slate-50"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-amount" className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Allocation</Label>
                            <Input
                                id="edit-amount"
                                type="number"
                                className="col-span-3 h-12 rounded-xl border-slate-100 bg-slate-50"
                                value={formData.allocatedAmount}
                                onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="edit-notes" className="text-right mt-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Description</Label>
                            <Textarea
                                id="edit-notes"
                                className="col-span-3 min-h-[100px] rounded-xl border-slate-100 bg-slate-50 resize-none"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-bold" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20 px-8 text-white" onClick={handleUpdateBudget}>Update Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* USAGE HISTORY MODAL */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="sm:max-w-4xl rounded-2xl border-none shadow-2xl bg-white p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-slate-900 text-white">
                        <DialogTitle className="text-xl font-black flex items-center gap-3 italic uppercase tracking-tighter">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <History className="h-5 w-5" />
                            </div>
                            {currentBudget?.category} - Usage History
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium capitalize">
                            Track every transaction associated with this budget category.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6">
                        <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Date</TableHead>
                                        <TableHead className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Description</TableHead>
                                        <TableHead className="font-bold text-slate-900 uppercase tracking-widest text-[10px] text-right">Amount (UGX)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.filter(e => e.category === currentBudget?.category).length > 0 ? (
                                        expenses
                                            .filter(e => e.category === currentBudget?.category)
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map((exp, idx) => (
                                                <TableRow key={exp.id} className="hover:bg-slate-50 transition-colors">
                                                    <TableCell className="font-medium text-slate-600">{new Date(exp.date).toLocaleDateString()}</TableCell>
                                                    <TableCell className="font-bold text-slate-900">{exp.description || 'General Expense'}</TableCell>
                                                    <TableCell className="text-right font-black text-slate-900">{exp.amount.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-slate-400 font-medium italic">
                                                No expenses recorded for this category yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
                        <div className="flex justify-between items-center w-full">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Category Spent</span>
                                <span className="text-xl font-black text-slate-900">
                                    UGX {expenses.filter(e => e.category === currentBudget?.category).reduce((s, e) => s + e.amount, 0).toLocaleString()}
                                </span>
                            </div>
                            <Button variant="outline" className="rounded-xl border-slate-200 font-bold" onClick={() => setIsHistoryModalOpen(false)}>
                                Done
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}

