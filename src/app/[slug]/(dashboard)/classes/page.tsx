"use client"
export const runtime = 'edge';

import React, { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
    Plus,
    Search,
    MoreHorizontal,
    Users,
    GraduationCap,
    School,
    Download,
    Filter,
    ChevronRight,
    ChevronDown,
    BookOpen,
    Loader2,
    Trash2,
    Edit
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { classActions, streamActions, teacherActions, studentActions } from "@/lib/electron"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { useConfirm } from "@/components/providers/confirm-provider"

interface RawClass {
    id: number
    name: string
    code: string
    classTeacherId?: number
}

interface RawStream {
    id: number
    name: string
    classId: number
    roomNumber?: string
    teacherId?: number
}

interface RawTeacher {
    id: number
    firstName: string
    lastName: string
    photoUrl?: string
}

interface RawStudent {
    id: number
    firstName: string
    lastName: string
    streamId: number | null
}

interface GroupedClass extends RawClass {
    streams: (RawStream & {
        studentCount: number
        teacher?: RawTeacher
    })[]
    totalStudents: number
}

export default function ClassListPage() {
    const { confirm } = useConfirm()
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [teachers, setTeachers] = useState<RawTeacher[]>([])
    const [students, setStudents] = useState<RawStudent[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    // Expand States
    const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set())

    // Add/Edit States
    const [isAddClassOpen, setIsAddClassOpen] = useState(false)
    const [isAddStreamOpen, setIsAddStreamOpen] = useState(false)
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
    const [newClassName, setNewClassName] = useState("")
    const [newClassLevel, setNewClassLevel] = useState("")
    const [newStreamName, setNewStreamName] = useState("")
    const [newStreamRoom, setNewStreamRoom] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Edit States
    const [editClassId, setEditClassId] = useState<number | null>(null)
    const [editClassName, setEditClassName] = useState("")
    const [editClassCode, setEditClassCode] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [classesData, streamsData, teachersData, studentsData] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                teacherActions.getAll() as Promise<RawTeacher[]>,
                studentActions.getAll() as Promise<RawStudent[]>
            ])
            setClasses(classesData)
            setStreams(streamsData)
            setTeachers(teachersData)
            setStudents(studentsData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load class data")
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (classId: number) => {
        const newExpanded = new Set(expandedClasses)
        if (newExpanded.has(classId)) {
            newExpanded.delete(classId)
        } else {
            newExpanded.add(classId)
        }
        setExpandedClasses(newExpanded)
    }

    const handleDeleteClass = async (classId: number) => {
        if (await confirm({
            title: "Delete Class",
            description: "Are you sure you want to delete this class? This action cannot be undone.",
            confirmText: "Delete Class",
            variant: "destructive"
        })) {
            setIsDeleting(true)
            try {
                await classActions.delete(classId)
                toast.success("Class deleted successfully")
                fetchData()
            } catch (error: unknown) {
                console.error("Failed to delete class:", error)
                const errorMessage = error instanceof Error ? error.message : "Failed to delete class"
                const displayMessage = errorMessage.replace(/Error invoking remote method 'delete-class': Error: /, '')
                toast.error(displayMessage)
            } finally {
                setIsDeleting(false)
            }
        }
    }

    const handleDeleteStream = async (streamId: number) => {
        if (await confirm({
            title: "Delete Stream",
            description: "Are you sure you want to delete this stream? This action cannot be undone.",
            confirmText: "Delete Stream",
            variant: "destructive"
        })) {
            setIsDeleting(true)
            try {
                await streamActions.delete(streamId)
                toast.success("Stream deleted successfully")
                fetchData()
            } catch (error: unknown) {
                console.error("Failed to delete stream:", error)
                const errorMessage = error instanceof Error ? error.message : "Failed to delete stream"
                const displayMessage = errorMessage.replace(/Error invoking remote method 'delete-stream': Error: /, '')
                toast.error(displayMessage)
            } finally {
                setIsDeleting(false)
            }
        }
    }

    const handleAddClass = async () => {
        if (!newClassName || !newClassLevel) {
            toast.error("Please fill in all fields")
            return
        }
        setIsSubmitting(true)
        try {
            await classActions.update({ name: newClassName, code: newClassLevel })
            toast.success("Class created successfully")
            setIsAddClassOpen(false)
            setNewClassName("")
            setNewClassLevel("")
            fetchData()
        } catch (error) {
            console.error("Failed to create class:", error)
            toast.error("Failed to create class")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddStream = async () => {
        if (!selectedClassId || !newStreamName) {
            toast.error("Please fill in all fields")
            return
        }
        setIsSubmitting(true)
        try {
            await streamActions.update({
                classId: selectedClassId,
                name: newStreamName,
                roomNumber: newStreamRoom
            })
            toast.success("Stream created successfully")
            setIsAddStreamOpen(false)
            setNewStreamName("")
            setNewStreamRoom("")
            // Keep selectedClassId to allow adding multiple streams or reset? Resetting is safer.
            setSelectedClassId(null)
            fetchData()
        } catch (error) {
            console.error("Failed to create stream:", error)
            toast.error("Failed to create stream")
        } finally {
            setIsSubmitting(false)
        }
    }

    const openAddStream = (classId: number) => {
        setSelectedClassId(classId)
        setIsAddStreamOpen(true)
    }

    const openEditClass = (cls: RawClass) => {
        setEditClassId(cls.id)
        setEditClassName(cls.name)
        setEditClassCode(cls.code)
    }

    const handleEditClass = async () => {
        if (!editClassId || !editClassName || !editClassCode) {
            toast.error("Please fill in all fields")
            return
        }
        setIsSubmitting(true)
        try {
            await classActions.update({
                id: editClassId,
                name: editClassName,
                code: editClassCode
            })
            toast.success("Class updated successfully")
            setEditClassId(null)
            setEditClassName("")
            setEditClassCode("")
            fetchData()
        } catch (error) {
            console.error("Failed to update class:", error)
            toast.error("Failed to update class")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Group Data
    const groupedClasses: GroupedClass[] = classes.map(cls => {
        const classStreams = streams.filter(s => s.classId === cls.id)
        const totalStudents = students.filter(s => classStreams.some(st => st.id === s.streamId)).length

        return {
            ...cls,
            streams: classStreams.map(stream => {
                const streamStudentCount = students.filter(s => s.streamId === stream.id).length
                const teacherId = stream.teacherId || cls.classTeacherId
                const teacher = teachers.find(t => t.id === teacherId)
                return {
                    ...stream,
                    studentCount: streamStudentCount,
                    teacher
                }
            }),
            totalStudents
        }
    }).filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.streams.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
                <PageHeader
                    title="Class Management"
                    description="Manage classes, streams, and teacher assignments."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Classes", href: "/classes" },
                        { label: "List" },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-11 rounded-xl shadow-sm">
                                <Download className="mr-2 h-4 w-4" /> Export
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02]"
                                onClick={() => setIsAddClassOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Class
                            </Button>
                        </div>
                    }
                />
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search classes or streams..."
                            className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="border-collapse">
                            <TableHeader className="bg-emerald-600">
                                <TableRow className="hover:bg-transparent border-emerald-500/30">
                                    <TableHead className="w-[50px] border-r border-emerald-500/30"></TableHead>
                                    <TableHead className="w-[200px] font-bold text-white h-12 border-r border-emerald-500/30">Class Name</TableHead>
                                    <TableHead className="font-bold text-white border-r border-emerald-500/30">Class Code</TableHead>
                                    <TableHead className="font-bold text-white border-r border-emerald-500/30">Streams</TableHead>
                                    <TableHead className="font-bold text-white border-r border-emerald-500/30">Total Students</TableHead>
                                    <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedClasses.length > 0 ? groupedClasses.map((cls, idx) => (
                                    <React.Fragment key={cls.id}>
                                        <TableRow className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Button variant="ghost" size="sm" onClick={() => toggleExpand(cls.id)}>
                                                    {expandedClasses.has(cls.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                                        <BookOpen className="h-5 w-5" />
                                                    </div>
                                                    {cls.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 px-2.5 py-0.5 rounded-lg font-medium">
                                                    {cls.code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-600 border-r border-emerald-100/50">
                                                {cls.streams.length} Streams
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-600 border-r border-emerald-100/50">
                                                {cls.totalStudents} Students
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
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => openAddStream(cls.id)}>
                                                            <Plus className="mr-2 h-4 w-4" /> Add Stream
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => openEditClass(cls)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Class
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            onClick={() => handleDeleteClass(cls.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Class
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                        {expandedClasses.has(cls.id) && (
                                            <TableRow className="bg-emerald-50/20">
                                                <TableCell colSpan={6} className="p-4">
                                                    <div className="rounded-xl border border-emerald-100 bg-white overflow-hidden shadow-sm">
                                                        <Table className="border-collapse">
                                                            <TableHeader className="bg-emerald-500">
                                                                <TableRow className="hover:bg-transparent border-emerald-400/30">
                                                                    <TableHead className="pl-6 font-bold text-white h-10 border-r border-emerald-400/30">Stream Name</TableHead>
                                                                    <TableHead className="font-bold text-white border-r border-emerald-400/30">Room</TableHead>
                                                                    <TableHead className="font-bold text-white border-r border-emerald-400/30">Teacher</TableHead>
                                                                    <TableHead className="font-bold text-white border-r border-emerald-400/30">Students</TableHead>
                                                                    <TableHead className="text-right pr-6 font-bold text-white">Actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {cls.streams.length > 0 ? cls.streams.map((stream, sIdx) => (
                                                                    <TableRow key={stream.id} className={cn(
                                                                        "hover:bg-emerald-50 transition-colors border-emerald-100/50",
                                                                        sIdx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                                                    )}>
                                                                        <TableCell className="pl-6 font-medium border-r border-emerald-100/50">{stream.name}</TableCell>
                                                                        <TableCell className="border-r border-emerald-100/50">{stream.roomNumber || "N/A"}</TableCell>
                                                                        <TableCell className="border-r border-emerald-100/50">
                                                                            {stream.teacher ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    <Avatar className="h-6 w-6">
                                                                                        <AvatarImage src={stream.teacher.photoUrl} />
                                                                                        <AvatarFallback className="text-[10px]">{stream.teacher.firstName[0]}</AvatarFallback>
                                                                                    </Avatar>
                                                                                    <span className="text-sm">{stream.teacher.firstName} {stream.teacher.lastName}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-slate-400 text-sm italic">Not Assigned</span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="border-r border-emerald-100/50">{stream.studentCount}</TableCell>
                                                                        <TableCell className="text-right pr-6">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                                onClick={() => handleDeleteStream(stream.id)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )) : (
                                                                    <TableRow>
                                                                        <TableCell colSpan={5} className="text-center py-4 text-slate-400">
                                                                            No streams in this class. <Button variant="link" className="text-emerald-600 p-0 h-auto" onClick={() => openAddStream(cls.id)}>Add one</Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-400 border-emerald-100/50">No classes found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </div>


            {/* Add Class Dialog */}
            <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Class</DialogTitle>
                        <DialogDescription>Create a new class level (e.g., Primary One).</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Class Name</Label>
                            <Input
                                placeholder="e.g. Primary One"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Class Code</Label>
                            <Input
                                placeholder="e.g. P.1"
                                value={newClassLevel}
                                onChange={(e) => setNewClassLevel(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddClassOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleAddClass} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? "Creating..." : "Create Class"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Stream Dialog */}
            <Dialog open={isAddStreamOpen} onOpenChange={setIsAddStreamOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Stream</DialogTitle>
                        <DialogDescription>Add a stream to the selected class.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Stream Name</Label>
                            <Input
                                placeholder="e.g. Blue, Red, A"
                                value={newStreamName}
                                onChange={(e) => setNewStreamName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Room Number</Label>
                            <Input
                                placeholder="e.g. Block A - 1B"
                                value={newStreamRoom}
                                onChange={(e) => setNewStreamRoom(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddStreamOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleAddStream} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? "Creating..." : "Create Stream"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Class Dialog */}
            <Dialog open={!!editClassId} onOpenChange={(open) => !open && setEditClassId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Class</DialogTitle>
                        <DialogDescription>Update the class name and code.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Class Name</Label>
                            <Input
                                placeholder="e.g. Primary One"
                                value={editClassName}
                                onChange={(e) => setEditClassName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Class Code</Label>
                            <Input
                                placeholder="e.g. P.1"
                                value={editClassCode}
                                onChange={(e) => setEditClassCode(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditClassId(null)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleEditClass} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

