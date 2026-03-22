"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Calendar,
    Plus,
    History,
    Clock,
    MoreHorizontal,
    ArrowRight,
    AlertCircle,
    CalendarDays,
    Settings2,
    Loader2,
    X
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { academicYearActions, termActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"
import { useApp } from "@/context/AppContext"

interface AcademicYear {
    id: number
    name: string
    startDate: string
    endDate: string
    isActive: boolean
    status: string | null
}

interface Term {
    id: number
    name: string
    startDate: string
    endDate: string
    isActive: boolean
    academicYearId: number
}

export default function AcademicYearsPage() {
    const { confirm } = useConfirm()
    const {
        setActiveYear: setGlobalActiveYear,
        setActiveTerm: setGlobalActiveTerm,
        refreshContext
    } = useApp()
    const [years, setYears] = useState<AcademicYear[]>([])
    const [terms, setTerms] = useState<Term[]>([])
    const [loading, setLoading] = useState(true)
    const [activeYear, setActiveYear] = useState<AcademicYear | null>(null)

    // Dialog States
    const [isYearDialogOpen, setIsYearDialogOpen] = useState(false)
    const [isTermDialogOpen, setIsTermDialogOpen] = useState(false)
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
    const [editingTerm, setEditingTerm] = useState<Term | null>(null)

    // Form States
    const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '' })
    const [termForm, setTermForm] = useState({ name: '', startDate: '', endDate: '' })

    useEffect(() => {
        fetchYears()
    }, [])

    const fetchYears = async () => {
        setLoading(true)
        try {
            const data = await academicYearActions.getAll() as AcademicYear[]
            setYears(data)
            const active = data.find(y => y.isActive)
            if (active) {
                setActiveYear(active)
                fetchTerms(active.id)
            }
        } catch (error: unknown) {
            console.error("Failed to fetch years:", error)
            toast.error("Failed to load academic years")
        } finally {
            setLoading(false)
        }
    }

    const fetchTerms = async (yearId: number) => {
        try {
            const data = await termActions.getByYear(yearId) as Term[]
            setTerms(data)
        } catch (error: unknown) {
            console.error("Failed to fetch terms:", error)
            toast.error("Failed to load terms")
        }
    }

    const handleSetActive = async (id: number) => {
        if (await confirm({
            title: "Set Active Academic Year",
            description: "Are you sure you want to set this academic year as active? This will deactivate the current active year.",
            confirmText: "Set Active",
            variant: "default"
        })) {
            try {
                await setGlobalActiveYear(id)
                toast.success("Active academic year updated")
                fetchYears()
            } catch (error: unknown) {
                console.error("Failed to set active year:", error)
                toast.error("Failed to update active year")
            }
        }
    }

    const handleSetActiveTerm = async (id: number) => {
        try {
            await setGlobalActiveTerm(id)
            toast.success("Active term updated")
            if (activeYear) fetchTerms(activeYear.id)
        } catch (error: unknown) {
            console.error("Failed to set active term:", error)
            toast.error("Failed to update active term")
        }
    }

    const handleSaveYear = async () => {
        try {
            const data = editingYear ? { ...yearForm, id: editingYear.id } : yearForm
            await academicYearActions.update(data)
            toast.success(editingYear ? "Year updated" : "Year created")
            setIsYearDialogOpen(false)
            fetchYears()
            refreshContext()
        } catch (error: unknown) {
            console.error("Failed to save year:", error)
            toast.error("Failed to save academic year")
        }
    }

    const handleSaveTerm = async () => {
        if (!activeYear) return
        try {
            const data = editingTerm
                ? { ...termForm, id: editingTerm.id }
                : { ...termForm, academicYearId: activeYear.id }
            await termActions.update(data)
            toast.success(editingTerm ? "Term updated" : "Term created")
            setIsTermDialogOpen(false)
            fetchTerms(activeYear.id)
            refreshContext()
        } catch (error: unknown) {
            console.error("Failed to save term:", error)
            toast.error("Failed to save term")
        }
    }

    const openYearDialog = (year?: AcademicYear) => {
        if (year) {
            setEditingYear(year)
            setYearForm({ name: year.name, startDate: year.startDate, endDate: year.endDate })
        } else {
            setEditingYear(null)
            setYearForm({ name: '', startDate: '', endDate: '' })
        }
        setIsYearDialogOpen(true)
    }

    const openTermDialog = (term?: Term) => {
        if (term) {
            setEditingTerm(term)
            setTermForm({ name: term.name, startDate: term.startDate, endDate: term.endDate })
        } else {
            setEditingTerm(null)
            setTermForm({ name: '', startDate: '', endDate: '' })
        }
        setIsTermDialogOpen(true)
    }

    const handleArchive = async (id: number) => {
        if (await confirm({
            title: "Archive Academic Year",
            description: "Are you sure you want to archive this academic year? This will mark it as Archived and deactivate it. You should only do this if the session is complete.",
            confirmText: "Archive Session",
            variant: "destructive"
        })) {
            try {
                await academicYearActions.archive(id)
                toast.success("Academic year archived successfully")
                fetchYears()
            } catch (error: unknown) {
                console.error("Failed to archive year:", error)
                const message = error instanceof Error ? error.message : "Failed to archive academic year"
                toast.error(message)
            }
        }
    }

    const handleDeleteTerm = async (id: number) => {
        if (await confirm({
            title: "Delete Academic Term",
            description: "Are you sure you want to delete this term? This action will fail if there are any exams, attendance, or financial records linked to this term.",
            confirmText: "Delete Term",
            variant: "destructive"
        })) {
            try {
                await termActions.delete(id)
                toast.success("Term deleted successfully")
                if (activeYear) fetchTerms(activeYear.id)
            } catch (error: unknown) {
                console.error("Failed to delete term:", error)
                const message = error instanceof Error ? error.message : "Failed to delete term. Ensure there are no linked records."
                toast.error(message)
            }
        }
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-8">
                <PageHeader
                    title="Academic Years & Terms"
                    description="Define academic sessions, terms, and holiday periods for your institution."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Settings", href: "/settings" },
                        { label: "Academic Years" },
                    ]}
                    actions={
                        <Button
                            onClick={() => openYearDialog()}
                            className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                        >
                            <Plus className="mr-2 h-4 w-4" /> New Academic Year
                        </Button>
                    }
                />

                {/* Active Year & Term Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-200/40 bg-slate-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CalendarDays className="h-32 w-32" />
                        </div>
                        <CardContent className="p-8 space-y-6 relative z-10">
                            <div className="space-y-1">
                                <Badge className="bg-amber-500 text-white border-none rounded-lg px-2 py-0.5 text-[10px] font-bold">CURRENT SESSION</Badge>
                                <h3 className="text-3xl font-black">{activeYear ? `${activeYear.name} Academic Year` : "No Active Year"}</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">Active Term</p>
                                        <p className="text-lg font-bold">{terms.find(t => t.isActive)?.name || "None"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">Session Duration</p>
                                        <p className="text-sm font-bold">{activeYear ? `${activeYear.startDate} to ${activeYear.endDate}` : "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 h-11 rounded-xl font-bold shadow-lg">
                                Term Settings <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader className="border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Term Breakdown</CardTitle>
                                <CardDescription>Schedule for the current academic year.</CardDescription>
                            </div>
                            <Button
                                onClick={() => openTermDialog()}
                                variant="ghost"
                                size="sm"
                                className="text-amber-600 font-bold hover:bg-amber-50 rounded-lg"
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add Term
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="font-bold text-white h-12 border-r border-emerald-500/30">Term Name</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Start Date</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">End Date</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Status</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {terms.length > 0 ? terms.map((term, idx) => (
                                        <TableRow key={term.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">{term.name}</TableCell>
                                            <TableCell className="text-slate-600 font-medium border-r border-emerald-100/50">{term.startDate}</TableCell>
                                            <TableCell className="text-slate-600 font-medium border-r border-emerald-100/50">{term.endDate}</TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                    term.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                                                )}>
                                                    {term.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    {!term.isActive && (
                                                        <Button
                                                            onClick={() => handleSetActiveTerm(term.id)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-emerald-600 font-bold hover:bg-emerald-50 h-8 rounded-lg px-2 text-xs"
                                                        >
                                                            Set Active
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => openTermDialog(term)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                                                    >
                                                        <Settings2 className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteTerm(term.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-500"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-slate-400 border-emerald-100/50">No terms defined for this year.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Academic Year History */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <CardHeader className="border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                <History className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Session History</CardTitle>
                                <CardDescription>View and manage previous academic sessions.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table className="border-collapse">
                            <TableHeader className="bg-emerald-600">
                                <TableRow className="hover:bg-transparent border-emerald-500/30">
                                    <TableHead className="font-bold text-white h-14 border-r border-emerald-500/30">Academic Year</TableHead>
                                    <TableHead className="font-bold text-white border-r border-emerald-500/30">Duration</TableHead>
                                    <TableHead className="font-bold text-white border-r border-emerald-500/30">Status</TableHead>
                                    <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {years.length > 0 ? years.map((ay, idx) => (
                                    <TableRow key={ay.id} className={cn(
                                        "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                        idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                    )}>
                                        <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">
                                            <div className="flex flex-col">
                                                <span>{ay.name} Academic Year</span>
                                                <span className="text-[10px] text-slate-400 font-mono">ID: {ay.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 font-medium border-r border-emerald-100/50">
                                            {ay.startDate} <ArrowRight className="inline h-3 w-3 mx-1 text-slate-300" /> {ay.endDate}
                                        </TableCell>
                                        <TableCell className="border-r border-emerald-100/50">
                                            <Badge className={cn(
                                                "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                ay.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    ay.status === 'Archived' ? "bg-slate-100 text-slate-500 border-slate-200" :
                                                        "bg-amber-50 text-amber-700 border-amber-100"
                                            )}>
                                                {ay.isActive ? "Active" : ay.status || "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                    <DropdownMenuLabel>Session Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {!ay.isActive && (
                                                        <DropdownMenuItem onClick={() => handleSetActive(ay.id)} className="cursor-pointer">Set as Active</DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => openYearDialog(ay)}
                                                        className="cursor-pointer"
                                                    >
                                                        Edit Dates
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        onClick={() => handleArchive(ay.id)}
                                                    >
                                                        Archive
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-400 border-emerald-100/50">No academic years defined.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-amber-50 border border-amber-100 overflow-hidden">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-amber-900">Session Transition Warning</h4>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                Closing an academic year is an irreversible action. Ensure all marks are entered,
                                report cards are generated, and financial accounts are balanced before proceeding with the transition to a new session.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Academic Year Dialog */}
            <Dialog open={isYearDialogOpen} onOpenChange={setIsYearDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingYear ? 'Edit Academic Year' : 'New Academic Year'}</DialogTitle>
                        <DialogDescription>
                            Define the name and duration of the academic session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="year-name">Name (e.g., 2024)</Label>
                            <Input
                                id="year-name"
                                value={yearForm.name}
                                onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                                placeholder="2024"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="year-start">Start Date</Label>
                                <Input
                                    id="year-start"
                                    type="date"
                                    value={yearForm.startDate}
                                    onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="year-end">End Date</Label>
                                <Input
                                    id="year-end"
                                    type="date"
                                    value={yearForm.endDate}
                                    onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsYearDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveYear} className="bg-amber-600 hover:bg-amber-700 text-white">Save Year</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Term Dialog */}
            <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingTerm ? 'Edit Term' : 'New Term'}</DialogTitle>
                        <DialogDescription>
                            Schedule a term for {activeYear?.name || 'the current year'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="term-name">Term Name</Label>
                            <Input
                                id="term-name"
                                value={termForm.name}
                                onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                                placeholder="Term 1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="term-start">Start Date</Label>
                                <Input
                                    id="term-start"
                                    type="date"
                                    value={termForm.startDate}
                                    onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="term-end">End Date</Label>
                                <Input
                                    id="term-end"
                                    type="date"
                                    value={termForm.endDate}
                                    onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTermDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveTerm} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Term</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

