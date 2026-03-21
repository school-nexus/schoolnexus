"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Plus,
    Search,
    MoreHorizontal,
    Settings2,
    Layers,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    Filter,
    Download,
    Edit2,
    Trash2,
    Loader2,
    PieChart,
    BarChart3,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    ArrowRight,
    AlertTriangle,
    Tag,
    Hash,
    FileSpreadsheet
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, exportToCSV } from "@/lib/utils"
import {
    categoryActions,
    expenseActions,
    incomeActions
} from "@/lib/electron"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Category {
    id: number
    name: string
    type: string
    description: string | null
    usageCount?: number
    totalAmount?: number
}

interface Expense {
    id: number
    category: string
    categoryId?: number
    amount: number
}

interface Income {
    id: number
    category: string
    categoryId?: number
    amount: number
}

export default function AccountCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<string>("All")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        type: "Expense",
        description: ""
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [cats, expenses, income] = await Promise.all([
                categoryActions.getAll() as Promise<Category[]>,
                expenseActions.getAll() as Promise<Expense[]>,
                incomeActions.getAll() as Promise<Income[]>
            ])

            // Enhance categories with usage statistics
            const enhancedCats = cats.map(cat => {
                const relevantRecords = cat.type === "Expense"
                    ? expenses.filter((e) => e.categoryId === cat.id || e.category === cat.name)
                    : income.filter((i) => i.categoryId === cat.id || i.category === cat.name)

                return {
                    ...cat,
                    usageCount: relevantRecords.length,
                    totalAmount: relevantRecords.reduce((sum, r) => sum + r.amount, 0)
                }
            })

            setCategories(enhancedCats)
        } catch (error: unknown) {
            console.error("Failed to fetch categories:", error)
            toast.error("Failed to load category data")
        } finally {
            setLoading(false)
        }
    }

    const refreshData = async () => {
        try {
            const cats = await categoryActions.getAll() as Category[]
            // In a real app we'd also re-fetch expenses/income for usage, but for now we'll just update the list
            setCategories(cats)
        } catch (error: unknown) {
            console.error("Failed to refresh data:", error)
        }
    }

    const handleCreateCategory = async () => {
        if (!formData.name) {
            toast.error("Please enter a category name")
            return
        }

        try {
            await categoryActions.create({
                name: formData.name,
                type: formData.type.toLowerCase() as "income" | "expense",
                description: formData.description
            })
            toast.success("Category created successfully")
            setIsCreateModalOpen(false)
            setFormData({ name: "", type: "Expense", description: "" })
            fetchInitialData()
        } catch (error: unknown) {
            toast.error("Failed to create category")
        }
    }

    const handleUpdateCategory = async () => {
        if (!currentCategory || !formData.name) return

        try {
            await categoryActions.update({
                id: currentCategory.id,
                name: formData.name,
                type: formData.type.toLowerCase() as "income" | "expense",
                description: formData.description
            })
            toast.success("Category updated successfully")
            setIsEditModalOpen(false)
            fetchInitialData()
        } catch (error: unknown) {
            toast.error("Failed to update category")
        }
    }

    const handleDeleteCategory = async () => {
        if (!currentCategory) return

        try {
            await categoryActions.delete(currentCategory.id)
            toast.success("Category deleted")
            setIsDeleteModalOpen(false)
            fetchInitialData()
        } catch (error: unknown) {
            toast.error("Failed to delete category")
        }
    }

    const openEditModal = (cat: Category) => {
        setCurrentCategory(cat)
        setFormData({
            name: cat.name,
            type: cat.type,
            description: cat.description || ""
        })
        setIsEditModalOpen(true)
    }

    const openDeleteModal = (cat: Category) => {
        setCurrentCategory(cat)
        setIsDeleteModalOpen(true)
    }

    const handleExport = () => {
        const exportData = filteredCategories.map(c => ({
            Name: c.name,
            Type: c.type,
            Usage_Count: c.usageCount || 0,
            Total_Volume: c.totalAmount || 0,
            Description: c.description || 'N/A'
        }))
        exportToCSV(exportData, 'Financial_Categories_Report')
    }

    const filteredCategories = categories.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterType === "All" || c.type === filterType
        return matchesSearch && matchesFilter
    })

    const incomeCount = categories.filter(c => c.type === 'Income').length
    const expenseCount = categories.filter(c => c.type === 'Expense').length
    const totalUsage = categories.reduce((sum, c) => sum + (c.usageCount || 0), 0)

    const formatCurrency = (amount: number) => amount.toLocaleString()

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600 opacity-20" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse">Organizing categories...</p>
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
                <PageHeader
                    title="Financial Classification"
                    description="Manage categories for precise tracking of institutional income and expenditures."
                    breadcrumbs={[
                        { label: "Accounts", href: "/accounts/dashboard" },
                        { label: "Categories" },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-12 border-slate-200 bg-white hover:bg-emerald-50/50 hover:border-emerald-200 text-slate-600 font-bold shadow-xl shadow-emerald-500/5 transition-all hover:scale-[1.05] flex items-center gap-2 group rounded-xl px-5"
                                onClick={handleExport}
                            >
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600 transition-transform group-hover:-translate-y-1" /> Export CSV
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-12 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <Plus className="mr-2 h-5 w-5" /> New Category
                            </Button>
                        </div>
                    }
                />

                {/* OVERVIEW STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <StatCard
                            title="Total Unique"
                            value={categories.length.toString()}
                            variant="gradient"
                            icon={<Tag className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-blue-600 to-indigo-700"
                            className="shadow-blue-200/50"
                            change="Active classifications"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <StatCard
                            title="Income Types"
                            value={incomeCount.toString()}
                            variant="gradient"
                            icon={<TrendingUp className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-emerald-500 to-teal-600"
                            className="shadow-emerald-200/50"
                            change="Revenue sources"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <StatCard
                            title="Expense Types"
                            value={expenseCount.toString()}
                            variant="gradient"
                            icon={<TrendingDown className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-rose-500 to-pink-600"
                            className="shadow-rose-200/50"
                            change="Cost centers"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <StatCard
                            title="Total Transactions"
                            value={totalUsage.toString()}
                            variant="gradient"
                            icon={<Hash className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
                            className="shadow-amber-200/50"
                            change="Categorized records"
                        />
                    </motion.div>
                </div>

                {/* MANAGEMENT TABLE SECTION */}
                <div className="space-y-6">
                    {/* FILTERS & SEARCH */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 max-w-md w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Search by name or description..."
                                    className="pl-12 h-12 bg-slate-50/50 border-slate-100 focus:bg-white focus:ring-emerald-100 transition-all rounded-xl"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="flex bg-slate-100/80 p-1 rounded-xl h-12 items-center ring-1 ring-slate-200/50">
                                    {["All", "Income", "Expense"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type)}
                                            className={cn(
                                                "px-5 h-full rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                                                filterType === type
                                                    ? "bg-white text-emerald-600 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* CATEGORY TABLE */}
                    <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/40 overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-emerald-50 border-b border-emerald-100">
                                    <TableRow className="hover:bg-emerald-50/50 border-none">
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px] pl-8">Category Details</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Type</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Usage Count</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Total Volume</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px]">Description</TableHead>
                                        <TableHead className="py-5 font-bold text-emerald-900 uppercase tracking-widest text-[10px] text-right pr-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredCategories.length > 0 ? filteredCategories.map((cat, idx) => (
                                            <motion.tr
                                                key={cat.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group border-b border-slate-50 hover:bg-indigo-50/30 transition-colors"
                                            >
                                                <TableCell className="pl-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md text-white",
                                                            cat.type === 'Income' ? "bg-emerald-500" : "bg-red-500"
                                                        )}>
                                                            {cat.name.substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <p className="font-bold text-slate-900">{cat.name}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-lg px-2.5 py-1 text-[10px] font-bold border shadow-sm",
                                                        cat.type === 'Income' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                                    )}>
                                                        {cat.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-600">{cat.usageCount} records</TableCell>
                                                <TableCell className="font-bold text-slate-900">
                                                    {formatCurrency(cat.totalAmount || 0)} <span className="text-[10px] text-slate-400 font-medium">UGX</span>
                                                </TableCell>
                                                <TableCell className="max-w-[200px]">
                                                    <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{cat.description || "No description provided..."}</p>
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-100/50">
                                                                <MoreHorizontal className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl p-2 w-48">
                                                            <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1.5">Manage Category</DropdownMenuLabel>
                                                            <DropdownMenuItem className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 py-2.5 cursor-pointer" onClick={() => openEditModal(cat)}>
                                                                <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="rounded-lg focus:bg-indigo-50 focus:text-indigo-600 py-2.5 cursor-pointer">
                                                                <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                                            <DropdownMenuItem className="rounded-lg focus:bg-red-50 focus:text-red-600 py-2.5 cursor-pointer text-red-600" onClick={() => openDeleteModal(cat)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Category
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </motion.tr>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-[400px] text-center">
                                                    <div className="flex flex-col items-center justify-center gap-4">
                                                        <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 ring-4 ring-white shadow-inner animate-pulse">
                                                            <Layers className="h-10 w-10" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-slate-900 font-bold text-lg">No Matching Categories</p>
                                                            <p className="text-slate-400 text-sm max-w-[250px] mx-auto font-medium">Try adjusting your filters or search query to find the classification you're looking for.</p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                            onClick={() => {
                                                                setSearchQuery("")
                                                                setFilterType("All")
                                                            }}
                                                        >
                                                            Reset All Filters
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

                {/* BOTTOM CTA: AI SUGGESTIONS */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="border-none shadow-2xl shadow-indigo-100 bg-white overflow-hidden relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-indigo-50 to-transparent pointer-events-none" />
                        <CardContent className="p-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                            <div className="flex items-start gap-8">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform duration-500">
                                    <Settings2 className="h-8 w-8 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-slate-900">Consolidate Classifications</h4>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-medium">
                                        Having too many unique categories can fragment your financial reports.
                                        Our analysis suggests merging 4 similar income categories into "Donations & Grants" to improve tracking clarity.
                                    </p>
                                </div>
                            </div>
                            <Button className="bg-slate-900 hover:bg-black text-white h-14 px-10 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all hover:scale-[1.05] whitespace-nowrap active:scale-[0.98]">
                                Analyze & Merge <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div >

            {/* CREATE CATEGORY MODAL */}
            < Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} >
                <DialogContent className="sm:max-w-[450px] rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Plus className="h-6 w-6 text-indigo-600" /> New Classification
                        </DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            Create a new category for structural financial organization.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6 border-y border-slate-50 my-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cat-name" className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Name</Label>
                            <Input
                                id="cat-name"
                                placeholder="e.g. Science Laboratory"
                                className="col-span-3 h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-indigo-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cat-type" className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger className="col-span-3 h-12 rounded-xl border-slate-100 bg-slate-50">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200">
                                    <SelectItem value="Income">Income Category</SelectItem>
                                    <SelectItem value="Expense">Expense Category</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="cat-desc" className="text-right mt-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Description</Label>
                            <Textarea
                                id="cat-desc"
                                placeholder="Describe the purpose of this category..."
                                className="col-span-3 min-h-[100px] rounded-xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-indigo-500 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-bold" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20 px-8" onClick={handleCreateCategory}>Save Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* EDIT CATEGORY MODAL */}
            < Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen} >
                <DialogContent className="sm:max-w-[450px] rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Edit2 className="h-6 w-6 text-indigo-600" /> Edit Classification
                        </DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            Modify naming or metadata for this financial category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6 border-y border-slate-50 my-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Name</Label>
                            <Input
                                id="edit-name"
                                className="col-span-3 h-12 rounded-xl border-slate-100 bg-slate-50"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-type" className="text-right font-bold text-slate-400 uppercase tracking-widest text-[10px]">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger className="col-span-3 h-12 rounded-xl border-slate-100 bg-slate-50">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                    <SelectItem value="Income">Income Category</SelectItem>
                                    <SelectItem value="Expense">Expense Category</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="edit-desc" className="text-right mt-3 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Description</Label>
                            <Textarea
                                id="edit-desc"
                                className="col-span-3 min-h-[100px] rounded-xl border-slate-100 bg-slate-50 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-bold" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 px-8" onClick={handleUpdateCategory}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* DELETE CONFIRMATION MODAL */}
            < Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} >
                <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-red-100">
                    <DialogHeader>
                        <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 ring-1 ring-red-100">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">Delete Category?</DialogTitle>
                        <DialogDescription className="font-medium text-slate-500 pt-2">
                            This will permanently delete <strong>{currentCategory?.name}</strong>.
                            {currentCategory?.usageCount && currentCategory.usageCount > 0 && (
                                <span className="block mt-2 text-red-600">
                                    Warning: This category has {currentCategory.usageCount} associated transaction records.
                                    They will become uncategorized.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-3 pt-6">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 font-bold" onClick={() => setIsDeleteModalOpen(false)}>No, Keep</Button>
                        <Button className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20" onClick={handleDeleteCategory}>Yes, Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </motion.div >
    )
}

