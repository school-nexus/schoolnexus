"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { ArrowRight, Award, BookOpen, Download, Filter, Layers, Library, Loader2, MoreHorizontal, Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { subjectActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"

interface Subject {
    id: number
    name: string
    code: string
    category: string
    isOptional: boolean
}

export default function SubjectListPage() {
    const { confirm } = useConfirm()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        category: "Core",
        isOptional: false
    })

    useEffect(() => {
        fetchSubjects()
    }, [])

    const fetchSubjects = async () => {
        setLoading(true)
        try {
            const data = await subjectActions.getAll() as Subject[]
            setSubjects(data)
        } catch (error: unknown) {
            console.error("Failed to fetch subjects:", error)
            toast.error("Failed to load subjects")
        } finally {
            setLoading(false)
        }
    }

    const handleAddSubject = async () => {
        if (!formData.name.trim() || !formData.code.trim()) {
            toast.error("Please fill in all required fields")
            return
        }
        setIsSubmitting(true)
        try {
            await subjectActions.create(formData)
            toast.success("Subject added successfully")
            setIsAddDialogOpen(false)
            resetForm()
            fetchSubjects()
        } catch (error: unknown) {
            console.error("Failed to add subject:", error)
            toast.error("Failed to add subject")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditSubject = async () => {
        if (!selectedSubject) return
        if (!formData.name.trim() || !formData.code.trim()) {
            toast.error("Please fill in all required fields")
            return
        }
        setIsSubmitting(true)
        try {
            await subjectActions.update({ id: selectedSubject.id, ...formData })
            toast.success("Subject updated successfully")
            setIsEditDialogOpen(false)
            setSelectedSubject(null)
            resetForm()
            fetchSubjects()
        } catch (error: unknown) {
            console.error("Failed to update subject:", error)
            toast.error("Failed to update subject")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteSubject = async (subject: Subject) => {
        if (await confirm({
            title: "Delete Subject",
            description: `Are you sure you want to delete "${subject.name}"? This action cannot be undone.`,
            confirmText: "Delete Subject",
            variant: "destructive"
        })) {
            setIsSubmitting(true)
            try {
                await subjectActions.delete(subject.id)
                toast.success("Subject deleted successfully")
                fetchSubjects()
            } catch (error: unknown) {
                console.error("Failed to delete subject:", error)
                toast.error("Failed to delete subject")
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    const openEditDialog = (subject: Subject) => {
        setSelectedSubject(subject)
        setFormData({
            name: subject.name,
            code: subject.code,
            category: subject.category || "Core",
            isOptional: subject.isOptional || false
        })
        setIsEditDialogOpen(true)
    }


    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            category: "Core",
            isOptional: false
        })
    }

    const filteredSubjects = subjects.map(sub => ({
        ...sub,
        category: sub.category || 'General'
    })).filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const coreCount = filteredSubjects.filter(s => s.category === 'Core').length
    const electiveCount = filteredSubjects.filter(s => s.category !== 'Core').length
    const corePercentage = filteredSubjects.length > 0 ? Math.round((coreCount / filteredSubjects.length) * 100) : 0
    const electivePercentage = filteredSubjects.length > 0 ? 100 - corePercentage : 0

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
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Subject List"
                    description="Manage curriculum subjects, codes, and departments."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Subjects", href: "/subjects" },
                        { label: "List" },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[200px] max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search subjects..."
                                    className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                                <Filter className="mr-2 h-4 w-4" /> Filters
                            </Button>
                            <Button
                                onClick={() => {
                                    resetForm()
                                    setIsAddDialogOpen(true)
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02]"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Subject
                            </Button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">

                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table className="border-collapse">
                                        <TableHeader className="bg-emerald-600">
                                            <TableRow className="hover:bg-transparent border-emerald-500/30">
                                                <TableHead className="font-bold text-white h-12 border-r border-emerald-500/30">Subject Name</TableHead>
                                                <TableHead className="font-bold text-white border-r border-emerald-500/30">Code</TableHead>
                                                <TableHead className="font-bold text-white border-r border-emerald-500/30">Type</TableHead>
                                                <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSubjects.length > 0 ? filteredSubjects.map((sub, idx) => (
                                                <TableRow key={sub.id} className={cn(
                                                    "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                                    idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                                )}>
                                                    <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100 group-hover:scale-110 transition-transform">
                                                                <BookOpen className="h-4 w-4" />
                                                            </div>
                                                            {sub.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-r border-emerald-100/50">
                                                        <code className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-mono text-xs font-bold border border-slate-200">
                                                            {sub.code}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell className="border-r border-emerald-100/50">
                                                        <Badge variant="secondary" className={cn(
                                                            "px-2.5 py-0.5 rounded-lg font-medium",
                                                            sub.category === 'Core' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-teal-50 text-teal-700 border-teal-100"
                                                        )}>
                                                            {sub.category}
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
                                                                    onClick={() => openEditDialog(sub)}
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit Subject
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                    onClick={() => handleDeleteSubject(sub)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-slate-400 border-emerald-100/50">No subjects found.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Insights (4 Cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                            <CardHeader className="border-b border-slate-100 p-6">
                                <CardTitle className="text-lg font-bold text-slate-900">Subject Insights</CardTitle>
                                <CardDescription>Curriculum distribution overview.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                            <span className="text-sm font-medium text-slate-600">Core Subjects</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{corePercentage}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-emerald-500" style={{ width: `${corePercentage}%` }} />
                                        <div className="h-full bg-teal-500" style={{ width: `${electivePercentage}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-teal-500" />
                                            <span className="text-sm font-medium text-slate-600">Elective Subjects</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{electivePercentage}%</span>
                                    </div>
                                </div>


                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Award className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-100 font-medium">Top Performing</p>
                                        <p className="text-lg font-bold">Mathematics</p>
                                    </div>
                                </div>
                                <p className="text-xs text-emerald-50/80 leading-relaxed">
                                    Mathematics has the highest student engagement score this term. View detailed performance reports in the analytics section.
                                </p>
                                <Button variant="link" className="text-white p-0 h-auto mt-4 font-bold text-xs hover:no-underline group">
                                    View Analytics <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div >
            </div >

            {/* Add Subject Dialog */}
            < Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Subject</DialogTitle>
                        <DialogDescription>
                            Create a new subject for the curriculum.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Subject Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Mathematics"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="code">Subject Code *</Label>
                            <Input
                                id="code"
                                placeholder="e.g., MATH"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Core">Core</SelectItem>
                                    <SelectItem value="Elective">Elective</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="optional">Optional Subject</Label>
                            <Switch
                                id="optional"
                                checked={formData.isOptional}
                                onCheckedChange={(checked) => setFormData({ ...formData, isOptional: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddSubject} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Add Subject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Edit Subject Dialog */}
            < Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Subject</DialogTitle>
                        <DialogDescription>
                            Update subject details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Subject Name *</Label>
                            <Input
                                id="edit-name"
                                placeholder="e.g., Mathematics"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-code">Subject Code *</Label>
                            <Input
                                id="edit-code"
                                placeholder="e.g., MATH"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Core">Core</SelectItem>
                                    <SelectItem value="Elective">Elective</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="edit-optional">Optional Subject</Label>
                            <Switch
                                id="edit-optional"
                                checked={formData.isOptional}
                                onCheckedChange={(checked) => setFormData({ ...formData, isOptional: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditSubject} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

        </div >
    )
}

