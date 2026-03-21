"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import {
    Search,
    Filter,
    Download,
    CheckCircle2,
    XCircle,
    BookOpen,
    Layers,
    Plus,
    Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { classActions, subjectActions, streamActions, allocationActions, academicYearActions, teacherActions } from "@/lib/electron"
import { toast } from "sonner"

interface AllocationData {
    id?: number
    subjectId: number
    streamId: number
    teacherId?: number
    academicYearId: number
}

interface RawClass {
    id: number
    name: string
}

interface RawStream {
    id: number
    name: string
    classId: number
}

interface RawSubject {
    id: number
    name: string
    code?: string
    category?: string
}

interface RawTeacher {
    id: number
    firstName: string
    lastName: string
}

interface AcademicYear {
    id: number
    year: string
    isCurrent: boolean
}

export default function AssignmentsMatrixPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [subjects, setSubjects] = useState<RawSubject[]>([])
    const [teachers, setTeachers] = useState<RawTeacher[]>([])
    const [allocations, setAllocations] = useState<AllocationData[]>([])
    const [currentYearId, setCurrentYearId] = useState<number | null>(null)
    const [matrix, setMatrix] = useState<boolean[][]>([])

    // Dialog state
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
    const [selectedCell, setSelectedCell] = useState<{ subjectId: number; streamId: number; subjectName: string; streamLabel: string } | null>(null)
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Get current academic year first
            const years = await academicYearActions.getAll() as any as AcademicYear[]
            const currentYear = years.find((y) => y.isCurrent) || years[0]

            if (!currentYear) {
                // If no year, just load basic data without allocations
                const [classData, streamData, subjectData, teacherData] = await Promise.all([
                    classActions.getAll() as Promise<RawClass[]>,
                    streamActions.getAll() as Promise<RawStream[]>,
                    subjectActions.getAll() as Promise<RawSubject[]>,
                    teacherActions.getAll() as Promise<RawTeacher[]>
                ])
                setClasses(classData)
                setStreams(streamData)
                setSubjects(subjectData)
                setTeachers(teacherData)
                setMatrix(subjectData.map(() => streamData.map(() => false)))
                setLoading(false)
                return
            }

            setCurrentYearId(currentYear.id)

            const [classData, streamData, subjectData, allocationData, teacherData] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                subjectActions.getAll() as Promise<RawSubject[]>,
                allocationActions.getByYear(currentYear.id) as Promise<AllocationData[]>,
                teacherActions.getAll() as Promise<RawTeacher[]>
            ])

            setClasses(classData)
            setStreams(streamData)
            setSubjects(subjectData)
            setAllocations(allocationData)
            setTeachers(teacherData)

            // Create a matrix showing which subjects are assigned to which streams
            const initialMatrix = subjectData.map((subject) =>
                streamData.map((stream) => {
                    return allocationData.some((a) =>
                        a.streamId === stream.id && a.subjectId === subject.id
                    )
                })
            )
            setMatrix(initialMatrix)
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load matrix data")
        } finally {
            setLoading(false)
        }
    }

    const handleCellClick = (subjectIndex: number, streamIndex: number) => {
        const subject = subjects[subjectIndex]
        const stream = streams[streamIndex]
        const cls = classes.find(c => c.id === stream.classId)
        const streamLabel = `${cls?.name || 'Unknown'} ${stream.name}`

        const isAssigned = matrix[subjectIndex]?.[streamIndex]

        if (isAssigned) {
            // Remove assignment
            handleRemoveAssignment(subject.id, stream.id, subjectIndex, streamIndex)
        } else {
            // Open dialog to assign with teacher selection
            setSelectedCell({
                subjectId: subject.id,
                streamId: stream.id,
                subjectName: subject.name,
                streamLabel
            })
            setSelectedTeacherId("")
            setIsAssignDialogOpen(true)
        }
    }

    const handleRemoveAssignment = async (subjectId: number, streamId: number, subjectIndex: number, streamIndex: number) => {
        if (!currentYearId) {
            toast.error("No academic year selected")
            return
        }

        try {
            await allocationActions.delete({
                subjectId,
                streamId,
                academicYearId: currentYearId
            })

            // Update local state
            const newMatrix = [...matrix]
            newMatrix[subjectIndex] = [...newMatrix[subjectIndex]]
            newMatrix[subjectIndex][streamIndex] = false
            setMatrix(newMatrix)

            // Update allocations
            setAllocations(prev => prev.filter(a =>
                !(a.subjectId === subjectId && a.streamId === streamId)
            ))

            toast.success("Subject unassigned successfully")
        } catch (error: unknown) {
            console.error("Failed to remove assignment:", error)
            toast.error("Failed to remove assignment")
        }
    }

    const handleAssignSubject = async () => {
        if (!selectedCell || !selectedTeacherId || !currentYearId) {
            toast.error("Please select a teacher")
            return
        }

        setIsSubmitting(true)
        try {
            await allocationActions.create({
                subjectId: selectedCell.subjectId,
                streamId: selectedCell.streamId,
                teacherId: parseInt(selectedTeacherId),
                academicYearId: currentYearId
            })

            // Update local matrix
            const subjectIndex = subjects.findIndex(s => s.id === selectedCell.subjectId)
            const streamIndex = streams.findIndex(s => s.id === selectedCell.streamId)

            if (subjectIndex !== -1 && streamIndex !== -1) {
                const newMatrix = [...matrix]
                newMatrix[subjectIndex] = [...newMatrix[subjectIndex]]
                newMatrix[subjectIndex][streamIndex] = true
                setMatrix(newMatrix)
            }

            // Update allocations
            setAllocations(prev => [...prev, {
                subjectId: selectedCell.subjectId,
                streamId: selectedCell.streamId,
                teacherId: parseInt(selectedTeacherId),
                academicYearId: currentYearId
            }])

            toast.success("Subject assigned successfully")
            setIsAssignDialogOpen(false)
            setSelectedCell(null)
            setSelectedTeacherId("")
        } catch (error) {
            console.error("Failed to assign subject:", error)
            toast.error("Failed to assign subject")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Create stream labels with class names
    const streamLabels = streams.map(stream => {
        const cls = classes.find(c => c.id === stream.classId)
        return `${cls?.name || 'Unknown'} ${stream.name}`
    })

    // Calculate assigned count per stream
    const getAssignedCountForStream = (streamIndex: number) => {
        return matrix.reduce((count, row) => count + (row[streamIndex] ? 1 : 0), 0)
    }

    const assignedCount = matrix.flat().filter(Boolean).length
    const unassignedCount = matrix.flat().filter(v => !v).length

    // Filter subjects based on search
    const filteredSubjectIndices = subjects
        .map((sub, idx) => ({ sub, idx }))
        .filter(({ sub }) =>
            sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (sub.code && sub.code.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .map(({ idx }) => idx)

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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title="Assignments Matrix"
                        description="Visualize and manage subject assignments across all classes."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Subjects", href: "/subjects" },
                            { label: "Matrix" },
                        ]}
                    />
                </div>

                {/* Legend & Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Cells</p>
                                <p className="text-2xl font-bold text-slate-900">{streams.length * subjects.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Assigned</p>
                                <p className="text-2xl font-bold text-slate-900">{assignedCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center ring-1 ring-red-100">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Unassigned</p>
                                <p className="text-2xl font-bold text-slate-900">{unassignedCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Matrix (9 Cols) */}
                    <div className="lg:col-span-9 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Filter subjects or classes..."
                                        className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-slate-200" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Not Assigned</span>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    {subjects.length > 0 && streams.length > 0 ? (
                                        <Table className="border-collapse">
                                            <TableHeader className="bg-emerald-600">
                                                <TableRow className="hover:bg-transparent border-emerald-500/30">
                                                    <TableHead className="w-[220px] font-bold text-white h-14 sticky left-0 bg-emerald-600 z-20 border-r border-emerald-500/30 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]">Subject \ Class</TableHead>
                                                    {streamLabels.map((label, idx) => (
                                                        <TableHead key={idx} className="text-center font-bold text-white min-w-[120px] border-r border-emerald-500/30">{label}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredSubjectIndices.map((sIdx, rIdx) => {
                                                    const sub = subjects[sIdx]
                                                    return (
                                                        <TableRow key={sub.id} className={cn(
                                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                                            rIdx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                                        )}>
                                                            <TableCell className={cn(
                                                                "font-bold text-slate-900 py-4 sticky left-0 z-10 border-r border-emerald-100/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]",
                                                                rIdx % 2 === 0 ? "bg-white group-hover:bg-emerald-50" : "bg-emerald-50/30 group-hover:bg-emerald-50"
                                                            )}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                                                        <BookOpen className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm">{sub.name}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] text-slate-400 font-mono">{sub.code || 'N/A'}</span>
                                                                            <Badge variant="secondary" className={cn(
                                                                                "px-1.5 py-0 text-[9px] rounded-md font-bold",
                                                                                (sub.category || 'General') === 'Core' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-teal-50 text-teal-700 border-teal-100"
                                                                            )}>
                                                                                {sub.category || 'General'}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            {streams.map((stream, cIdx) => (
                                                                <TableCell key={`${sub.id}-${cIdx}`} className="text-center border-r border-emerald-100/50">
                                                                    <div className="flex justify-center">
                                                                        {matrix[sIdx]?.[cIdx] ? (
                                                                            <div
                                                                                onClick={() => handleCellClick(sIdx, cIdx)}
                                                                                className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100 shadow-sm transition-transform hover:scale-125 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:ring-red-100"
                                                                                title="Click to unassign"
                                                                            >
                                                                                <CheckCircle2 className="h-4 w-4" />
                                                                            </div>
                                                                        ) : (
                                                                            <div
                                                                                onClick={() => handleCellClick(sIdx, cIdx)}
                                                                                className="h-8 w-8 rounded-full bg-slate-50 text-slate-200 flex items-center justify-center border-2 border-dashed border-slate-200 transition-all hover:border-emerald-400 hover:text-emerald-400 cursor-pointer hover:bg-emerald-50"
                                                                                title="Click to assign"
                                                                            >
                                                                                <Plus className="h-3.5 w-3.5" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <Layers className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                            <p className="font-medium">No data available.</p>
                                            <p className="text-sm text-slate-400 mt-1">Add subjects and classes first.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Class Summary (3 Cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                            <CardHeader className="border-b border-slate-100 p-6">
                                <CardTitle className="text-lg font-bold text-slate-900">Class Summary</CardTitle>
                                <CardDescription>Subjects per class.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {streamLabels.map((label, idx) => (
                                    <div key={idx} className="flex items-center justify-between group cursor-pointer">
                                        <span className="text-sm font-medium text-slate-600 group-hover:text-emerald-600 transition-colors">{label}</span>
                                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-bold">
                                            {getAssignedCountForStream(idx)} / {subjects.length}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-emerald-50/50 border border-emerald-100/50">
                            <CardContent className="p-6">
                                <h4 className="text-sm font-bold text-emerald-900 mb-2">Pro Tip</h4>
                                <p className="text-xs text-emerald-700 leading-relaxed">
                                    Click on an empty cell to assign a subject to a class with a teacher. Click on an assigned cell to remove the assignment.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Assign Subject Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Assign Subject</DialogTitle>
                        <DialogDescription>
                            Assign <strong>{selectedCell?.subjectName}</strong> to <strong>{selectedCell?.streamLabel}</strong>. Select the teacher who will teach this subject.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="teacher">Teacher *</Label>
                            <Select
                                value={selectedTeacherId}
                                onValueChange={setSelectedTeacherId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                            {teacher.firstName} {teacher.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAssignSubject} disabled={isSubmitting || !selectedTeacherId} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Assign Subject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

