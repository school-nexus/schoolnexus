"use client"

import { useState, useEffect, Suspense } from "react"
import { PageHeader } from "@/components/ui/page-header"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Plus,
    Search,
    MoreHorizontal,
    Settings2,
    Layers,
    CheckCircle2,
    XCircle,
    Info,
    Filter,
    Download,
    Loader2,
    Pencil,
    Trash2,
    Receipt
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
import { cn } from "@/lib/utils"
import { feeActions, classActions, termActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

interface FeeStructure {
    id: number
    name: string
    amount: number
    termId: number
    classId: number | null
    term?: {
        id: number
        name: string
    }
}

interface ClassItem {
    id: number
    name: string
}

interface TermItem {
    id: number
    name: string
    isActive: boolean
    academicYearId: number
}

interface RawProfile {
    currency: string
}

function FeeTypesPageContent() {
    const searchParams = useSearchParams()
    const classIdParam = searchParams.get("classId")

    const [feeTypes, setFeeTypes] = useState<FeeStructure[]>([])
    const [classes, setClasses] = useState<ClassItem[]>([])
    const [terms, setTerms] = useState<TermItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [profile, setProfile] = useState<RawProfile | null>(null)

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedFee, setSelectedFee] = useState<FeeStructure | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form states
    const [formName, setFormName] = useState("")
    const [formAmount, setFormAmount] = useState("")
    const [formTermId, setFormTermId] = useState("")
    const [formClassId, setFormClassId] = useState("")

    useEffect(() => {
        fetchData()
    }, [classIdParam])

    const fetchData = async () => {
        try {
            // Get active term first to get current academic year
            const activeTerm = await termActions.getActive()

            const [feeData, classData, termData, profileData] = await Promise.all([
                feeActions.getStructures() as Promise<FeeStructure[]>,
                classActions.getAll() as Promise<ClassItem[]>,
                activeTerm ? termActions.getByYear(activeTerm.academicYearId) as Promise<TermItem[]> : Promise.resolve([] as TermItem[]),
                schoolProfileActions.get() as Promise<RawProfile>
            ])

            let filteredFees = feeData
            if (classIdParam) {
                filteredFees = feeData.filter((f: FeeStructure) => f.classId === parseInt(classIdParam) || f.classId === null)
            }

            setFeeTypes(filteredFees)
            setClasses(classData)
            setTerms(termData)
            setProfile(profileData)
        } catch (error: unknown) {
            console.error("Failed to fetch fee types:", error)
            toast.error("Failed to load fee types")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormName("")
        setFormAmount("")
        setFormTermId("")
        setFormClassId("")
        setSelectedFee(null)
    }

    const openCreateDialog = () => {
        resetForm()
        // Pre-select active term
        const activeTerm = terms.find(t => t.isActive)
        if (activeTerm) setFormTermId(activeTerm.id.toString())
        setIsCreateOpen(true)
    }

    const openEditDialog = (fee: FeeStructure) => {
        setSelectedFee(fee)
        setFormName(fee.name)
        setFormAmount(fee.amount.toString())
        setFormTermId(fee.termId.toString())
        setFormClassId(fee.classId?.toString() || "all")
        setIsEditOpen(true)
    }

    const openDeleteDialog = (fee: FeeStructure) => {
        setSelectedFee(fee)
        setIsDeleteOpen(true)
    }

    const handleCreate = async () => {
        if (!formName.trim() || !formAmount || !formTermId) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSaving(true)
        try {
            await feeActions.createStructure({
                name: formName.trim(),
                amount: parseFloat(formAmount),
                termId: parseInt(formTermId),
                classId: formClassId && formClassId !== "all" ? parseInt(formClassId) : undefined
            })
            toast.success("Fee type created successfully")
            setIsCreateOpen(false)
            resetForm()
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to create fee type:", error)
            toast.error("Failed to create fee type")
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdate = async () => {
        if (!selectedFee || !formName.trim() || !formAmount || !formTermId) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSaving(true)
        try {
            await feeActions.updateStructure({
                id: selectedFee.id,
                name: formName.trim(),
                amount: parseFloat(formAmount),
                termId: parseInt(formTermId),
                classId: formClassId && formClassId !== "all" ? parseInt(formClassId) : undefined
            })
            toast.success("Fee type updated successfully")
            setIsEditOpen(false)
            resetForm()
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to update fee type:", error)
            toast.error("Failed to update fee type")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedFee) return

        setIsSaving(true)
        try {
            await feeActions.deleteStructure(selectedFee.id)
            toast.success("Fee type deleted successfully")
            setIsDeleteOpen(false)
            resetForm()
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to delete fee type:", error)
            toast.error("Failed to delete fee type")
        } finally {
            setIsSaving(false)
        }
    }

    const activeCount = feeTypes.length // All fee structures are active
    const formatCurrency = (amount: number) => `${amount.toLocaleString()} ${profile?.currency || 'UGX'}`

    const filteredTypes = feeTypes.filter(type =>
        type.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Fee Types"
                    description="Define and manage different categories of fees for your institution."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Fees Collection", href: "/fees/dashboard" },
                        { label: "Fee Types" },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 min-w-[300px]">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search fee types..."
                                    className="pl-11 h-11 bg-white border-slate-200 focus:bg-white transition-all rounded-xl shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 bg-white shadow-sm">
                                <Filter className="mr-2 h-4 w-4" /> Filters
                            </Button>
                            <Button onClick={openCreateDialog} className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-6 font-bold transition-all hover:scale-[1.02]">
                                <Plus className="mr-2 h-4 w-4" /> Add Fee Type
                            </Button>
                        </div>
                    }
                />
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="font-semibold text-white h-14 border-r border-emerald-500/30">Fee Name</TableHead>
                                        <TableHead className="font-semibold text-white border-r border-emerald-500/30">Term</TableHead>
                                        <TableHead className="font-semibold text-white border-r border-emerald-500/30">Amount ({profile?.currency || 'UGX'})</TableHead>
                                        <TableHead className="font-semibold text-white border-r border-emerald-500/30">Scope</TableHead>
                                        <TableHead className="text-right font-semibold text-white pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTypes.length > 0 ? filteredTypes.map((type, idx) => (
                                        <TableRow key={type.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="font-medium text-slate-900 py-4 border-r border-emerald-100/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                                        <Receipt className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold block">{type.name}</span>
                                                        <span className="text-[10px] text-slate-400 block mt-0.5">ID: {type.id}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-600 border-r border-emerald-100/50">{type.term?.name || 'Any Term'}</TableCell>
                                            <TableCell className="font-semibold text-slate-900 border-r border-emerald-100/50">{formatCurrency(type.amount)}</TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                    type.classId ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                )}>
                                                    {type.classId ? 'Class-Specific' : 'All Classes'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => openEditDialog(type)} className="cursor-pointer">
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit Type
                                                        </DropdownMenuItem>
                                                        <Link href={`/fees/assignments?feeStructureId=${type.id}`}>
                                                            <DropdownMenuItem className="cursor-pointer">
                                                                <Layers className="mr-2 h-4 w-4" /> View Assignments
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <DropdownMenuItem onClick={() => openDeleteDialog(type)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-slate-400 border-emerald-100/50">
                                                No fee types found. Create your first fee type to get started.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-emerald-600 text-white">
                    <CardContent className="p-6 flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Info className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold">Fee Structure Tip</h4>
                            <p className="text-emerald-100 text-sm leading-relaxed">
                                You can link fee types to specific classes or student groups in the &quot;Fee Assignments&quot; section.
                                Changes to a fee type will automatically update all pending invoices for that type.
                            </p>
                        </div>
                    </CardContent>
                </Card>


                {/* Create Fee Type Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl shadow-emerald-500/20 bg-white">
                        <DialogHeader className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                                <Layers className="h-5 w-5 text-emerald-100" />
                                Create Fee Type
                            </DialogTitle>
                            <DialogDescription className="text-emerald-100/80 mt-1">
                                Add a new fee structure to your institution.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 p-6">
                            <div className="grid gap-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Tuition Fee"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount ({profile?.currency || 'UGX'}) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="e.g. 500000"
                                    value={formAmount}
                                    onChange={(e) => setFormAmount(e.target.value)}
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Term *</Label>
                                <Select value={formTermId} onValueChange={setFormTermId}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select term" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {terms.map(term => (
                                            <SelectItem key={term.id} value={term.id.toString()}>
                                                {term.name} {term.isActive && "(Active)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Apply to Class (Optional)</Label>
                                <Select value={formClassId} onValueChange={setFormClassId}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {classes.map(cls => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>
                                                {cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 gap-3">
                            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="h-11 rounded-xl text-slate-500 hover:text-slate-700">Cancel</Button>
                            <Button onClick={handleCreate} disabled={isSaving} className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create Fee Type
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Fee Type Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl shadow-emerald-500/20 bg-white">
                        <DialogHeader className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                                <Pencil className="h-5 w-5 text-emerald-400" />
                                Edit Fee Type
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 mt-1">
                                Update the fee structure details.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 p-6">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Name *</Label>
                                <Input
                                    id="edit-name"
                                    placeholder="e.g. Tuition Fee"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount ({profile?.currency || 'UGX'}) *</Label>
                                <Input
                                    id="edit-amount"
                                    type="number"
                                    placeholder="e.g. 500000"
                                    value={formAmount}
                                    onChange={(e) => setFormAmount(e.target.value)}
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Term *</Label>
                                <Select value={formTermId} onValueChange={setFormTermId}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select term" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {terms.map(term => (
                                            <SelectItem key={term.id} value={term.id.toString()}>
                                                {term.name} {term.isActive && "(Active)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Apply to Class (Optional)</Label>
                                <Select value={formClassId} onValueChange={setFormClassId}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {classes.map(cls => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>
                                                {cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 gap-3">
                            <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="h-11 rounded-xl text-slate-500 hover:text-slate-700">Cancel</Button>
                            <Button onClick={handleUpdate} disabled={isSaving} className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                        <DialogHeader className="bg-gradient-to-br from-red-500 to-red-600 p-6 text-white">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                                <Trash2 className="h-5 w-5 text-red-100" />
                                Delete Fee Type
                            </DialogTitle>
                            <DialogDescription className="text-red-100/80 mt-1">
                                Are you sure you want to delete &quot;{selectedFee?.name}&quot;? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="p-6 gap-3">
                            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="h-11 rounded-xl text-slate-500 hover:text-slate-700">Cancel</Button>
                            <Button onClick={handleDelete} disabled={isSaving} className="h-11 px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Delete Fee Type
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

export default function FeeTypesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>}>
            <FeeTypesPageContent />
        </Suspense>
    )
}

