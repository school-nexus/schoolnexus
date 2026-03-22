export const runtime = 'edge';
"use client"

import { useState, useEffect } from "react"
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
    FileText,
    BarChart3,
    Calendar,
    Loader2
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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { examActions } from "@/lib/electron"
import { toast } from "sonner"
import { ExamType } from "@/lib/types"



export default function ExamTypesPage() {
    const [examTypes, setExamTypes] = useState<ExamType[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newType, setNewType] = useState({
        name: "",
        shortCode: "",
        weightage: "100"
    })

    // Edit and Delete States
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editingType, setEditingType] = useState<ExamType | null>(null)
    const [editForm, setEditForm] = useState({
        name: "",
        shortCode: "",
        weightage: ""
    })

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deletingType, setDeletingType] = useState<ExamType | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const data = await examActions.getTypes()
            setExamTypes(data)
        } catch (error: unknown) {
            console.error("Failed to fetch exam types:", error)
            toast.error("Failed to load exam types")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateType = async () => {
        if (!newType.name || !newType.shortCode) {
            toast.error("Please fill in name and short code")
            return
        }

        setIsSaving(true)
        try {
            await examActions.createType({
                name: newType.name,
                shortCode: newType.shortCode,
                weightage: newType.weightage ? parseFloat(newType.weightage) : 100
            })
            toast.success("Exam type created successfully")
            setIsCreateDialogOpen(false)
            setNewType({ name: "", shortCode: "", weightage: "100" })
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to create exam type:", error)
            toast.error("Failed to create exam type")
        } finally {
            setIsSaving(false)
        }
    }

    const handleEditClick = (type: ExamType) => {
        setEditingType(type)
        setEditForm({
            name: type.name,
            shortCode: type.shortCode || "",
            weightage: type.weightage?.toString() || ""
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdateType = async () => {
        if (!editingType || !editForm.name || !editForm.shortCode) {
            toast.error("Please fill in name and short code")
            return
        }

        setIsSaving(true)
        try {
            await examActions.updateType({
                id: editingType.id,
                name: editForm.name,
                shortCode: editForm.shortCode,
                weightage: editForm.weightage ? parseFloat(editForm.weightage) : 0
            })
            toast.success("Exam type updated successfully")
            setIsEditDialogOpen(false)
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to update exam type:", error)
            toast.error(error instanceof Error ? error.message : "Failed to update exam type")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteClick = (type: ExamType) => {
        setDeletingType(type)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingType) return

        setIsSaving(true)
        try {
            await examActions.deleteType(deletingType.id)
            toast.success("Exam type deleted successfully")
            setIsDeleteDialogOpen(false)
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to delete exam type:", error)
            toast.error(error instanceof Error ? error.message : "Failed to delete exam type")
        } finally {
            setIsSaving(false)
        }
    }

    const totalWeightage = examTypes.reduce((sum, t) => sum + (t.weightage || 0), 0)

    const filteredTypes = examTypes.filter(type =>
        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (type.shortCode && (type.shortCode && type.shortCode.toLowerCase().includes(searchQuery.toLowerCase())))
    )

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title="Exam Types"
                        description="Define and manage different categories of examinations and their weightage."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Examinations", href: "/exams" },
                            { label: "Exam Types" },
                        ]}
                    />
                    <div className="flex items-center gap-3">

                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02]">
                                    <Plus className="mr-2 h-4 w-4" /> Create Exam Type
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create Exam Type</DialogTitle>
                                    <DialogDescription>
                                        Add a new category of examination.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Type Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., End of Term"
                                            className="rounded-xl"
                                            value={newType.name}
                                            onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="code">Short Code</Label>
                                        <Input
                                            id="code"
                                            placeholder="e.g., E.O.T"
                                            className="rounded-xl"
                                            value={newType.shortCode}
                                            onChange={(e) => setNewType({ ...newType, shortCode: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="weight">Weightage (%)</Label>
                                        <Input
                                            id="weight"
                                            type="number"
                                            placeholder="100"
                                            className="rounded-xl"
                                            value={newType.weightage}
                                            onChange={(e) => setNewType({ ...newType, weightage: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl w-full"
                                        onClick={handleCreateType}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Create Type
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Search and Filter Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search exam types..."
                            className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                        <Filter className="mr-2 h-4 w-4" /> Filters
                    </Button>
                </div>

                {/* Table Card */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="font-bold text-white h-14 border-r border-emerald-500/30">Exam Name</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Short Code</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Weightage</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Status</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTypes.length > 0 ? filteredTypes.map((type, idx) => (
                                        <TableRow key={type.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">
                                                <div className="flex flex-col">
                                                    <span>{type.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">ET{type.id.toString().padStart(3, '0')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 rounded-lg">
                                                    {type.shortCode}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-emerald-600 border-r border-emerald-100/50">{type.weightage || 0}%</TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg px-2 py-0.5 text-[10px] font-bold">
                                                    Active
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
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => handleEditClick(type)}
                                                        >
                                                            Edit Type
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer">View Schedule</DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            onClick={() => handleDeleteClick(type)}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-slate-400 border-emerald-100/50">
                                                No exam types found. Create your first exam type to get started.
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
                            <h4 className="text-lg font-bold">Grading Tip</h4>
                            <p className="text-emerald-100 text-sm leading-relaxed">
                                Ensure the total weightage of all active exam types for a term adds up to 100% for accurate final grade calculation.
                                You can adjust weightage at any time, but it will trigger a recalculation of existing results.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Exam Type</DialogTitle>
                        <DialogDescription>
                            Update the details of this examination category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Type Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="e.g., End of Term"
                                className="rounded-xl"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-code">Short Code</Label>
                            <Input
                                id="edit-code"
                                placeholder="e.g., E.O.T"
                                className="rounded-xl"
                                value={editForm.shortCode}
                                onChange={(e) => setEditForm({ ...editForm, shortCode: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-weight">Weightage (%)</Label>
                            <Input
                                id="edit-weight"
                                type="number"
                                placeholder="100"
                                className="rounded-xl"
                                value={editForm.weightage}
                                onChange={(e) => setEditForm({ ...editForm, weightage: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl w-full"
                            onClick={handleUpdateType}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Exam Type</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-bold">"{deletingType?.name}"</span>?
                            This action cannot be undone and may fail if the type is linked to existing exams.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl flex-1 border-slate-200"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-xl flex-1 bg-red-600 hover:bg-red-700"
                            onClick={handleDeleteConfirm}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

