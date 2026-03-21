"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    Users,
    UserPlus,
    BookOpen,
    MoreHorizontal,
    Mail,
    Phone,
    GraduationCap,
    Filter,
    ArrowRight,
    CheckCircle2,
    Loader2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { classActions, streamActions, teacherActions } from "@/lib/electron"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

interface ClassTeacherAssignment {
    id: string
    class: string
    classId: number
    stream: string
    streamId: number
    teacher: {
        id: number
        name: string
        email: string
        subject: string
        image: string
    } | null
    assignedDate: string
    status: string
}

interface RawTeacher {
    id: number
    firstName: string
    lastName: string
    email?: string
    photoUrl?: string
    status?: string
    qualification?: string
}

interface RawClass {
    id: number
    name: string
    classTeacherId?: number
}

interface RawStream {
    id: number
    name: string
    classId: number
    teacherId?: number
    createdAt?: string
    updatedAt?: string
}

export default function ClassTeachersPage() {
    const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([])
    const [teachers, setTeachers] = useState<RawTeacher[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Assignment Dialog States
    const [isAssignOpen, setIsAssignOpen] = useState(false)
    const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null)
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [classes, streams, teachersList] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                teacherActions.getAll() as Promise<RawTeacher[]>
            ])

            setTeachers(teachersList)

            // Create assignments from streams with their class teachers
            const mappedAssignments: ClassTeacherAssignment[] = streams.map((stream) => {
                const classInfo = classes.find((c) => c.id === stream.classId)

                // Find teacher: Use stream teacher if available, otherwise class teacher
                const teacherId = stream.teacherId || classInfo?.classTeacherId
                const teacher = teacherId
                    ? teachersList.find((t) => t.id === teacherId)
                    : null

                return {
                    id: stream.id.toString(),
                    class: classInfo?.name || 'Unknown',
                    classId: stream.classId,
                    stream: stream.name,
                    streamId: stream.id,
                    teacher: teacher ? {
                        id: teacher.id,
                        name: `${teacher.firstName} ${teacher.lastName}`,
                        email: teacher.email || 'N/A',
                        subject: teacher.qualification || 'General',
                        image: teacher.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.firstName}`
                    } : null,
                    assignedDate: stream.updatedAt ? new Date(stream.updatedAt).toISOString().split('T')[0] : (stream.createdAt ? new Date(stream.createdAt).toISOString().split('T')[0] : 'N/A'),
                    status: teacher ? 'Assigned' : 'Unassigned'
                }
            })

            setAssignments(mappedAssignments)
        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load class assignments")
        } finally {
            setLoading(false)
        }
    }

    const openAssignDialog = (streamId: number, currentTeacherId?: number) => {
        setSelectedStreamId(streamId)
        setSelectedTeacherId(currentTeacherId ? currentTeacherId.toString() : "")
        setIsAssignOpen(true)
    }

    const handleAssignTeacher = async () => {
        if (!selectedStreamId) return
        setIsSubmitting(true)
        try {
            await streamActions.update({
                id: selectedStreamId,
                teacherId: selectedTeacherId ? parseInt(selectedTeacherId) : undefined
            })
            toast.success("Teacher assigned successfully")
            setIsAssignOpen(false)
            setSelectedStreamId(null)
            setSelectedTeacherId("")
            fetchData()
        } catch (error) {
            console.error("Failed to assign teacher:", error)
            toast.error("Failed to assign teacher")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRemoveAssignment = async (streamId: number) => {
        try {
            await streamActions.update({
                id: streamId,
                teacherId: undefined
            })
            toast.success("Assignment removed")
            fetchData()
        } catch (error) {
            console.error("Failed to remove assignment:", error)
            toast.error("Failed to remove assignment")
        }
    }

    const filteredAssignments = assignments.filter(item =>
        item.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.stream.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.teacher && item.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const assignedCount = assignments.filter(a => a.status === 'Assigned').length
    const unassignedCount = assignments.filter(a => a.status === 'Unassigned').length

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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title="Class Teachers"
                        description="Assign and manage teachers for each class and stream."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Classes", href: "/classes" },
                            { label: "Teachers" },
                        ]}
                    />
                    <Button
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02]"
                        onClick={() => {
                            if (assignments.length === 0) {
                                toast.info("No streams found. Please create classes and streams first.")
                                return
                            }
                            const unassigned = assignments.find(a => !a.teacher)
                            if (unassigned) {
                                openAssignDialog(unassigned.streamId)
                            } else {
                                toast.info("All streams have teachers assigned")
                            }
                        }}
                    >
                        <UserPlus className="mr-2 h-4 w-4" /> Assign Teacher
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Streams</p>
                                <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
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
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-100">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Unassigned</p>
                                <p className="text-2xl font-bold text-slate-900">{unassignedCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filter */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by class or teacher name..."
                                className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                                <Filter className="mr-2 h-4 w-4" /> Filters
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Assignments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssignments.length > 0 ? filteredAssignments.map((item) => (
                        <Card key={item.id} className="group border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-slate-200/60">
                            <CardHeader className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-slate-800">{item.class}</CardTitle>
                                            <CardDescription className="font-medium text-slate-500">Stream: {item.stream}</CardDescription>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl">
                                            <DropdownMenuItem className="cursor-pointer" onClick={() => openAssignDialog(item.streamId, item.teacher?.id)}>
                                                {item.teacher ? 'Change Teacher' : 'Assign Teacher'}
                                            </DropdownMenuItem>
                                            {item.teacher && (
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    onClick={() => handleRemoveAssignment(item.streamId)}
                                                >
                                                    Remove Assignment
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {item.teacher ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-14 w-14 border-4 border-white shadow-lg ring-1 ring-slate-100">
                                                <AvatarImage src={item.teacher.image} />
                                                <AvatarFallback className="bg-teal-50 text-teal-600 font-bold">
                                                    {item.teacher.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-slate-900 text-lg">{item.teacher.name}</p>
                                                <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                                                    <GraduationCap className="h-3.5 w-3.5" /> {item.teacher.subject}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                <Mail className="h-4 w-4 text-slate-400" /> {item.teacher.email}
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assigned On</span>
                                                <span className="text-sm font-bold text-slate-700">{item.assignedDate}</span>
                                            </div>
                                        </div>
                                        <Badge className="w-full justify-center py-1.5 bg-emerald-50 text-emerald-700 border-emerald-100 rounded-xl font-bold">
                                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Active Assignment
                                        </Badge>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                                        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
                                            <Users className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-400">No Teacher Assigned</p>
                                            <p className="text-xs text-slate-400 mt-1">Assign a teacher to manage this class.</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                                            onClick={() => openAssignDialog(item.streamId)}
                                        >
                                            Assign Now <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">No class streams found.</p>
                            <p className="text-sm text-slate-400 mt-1">Create classes and streams first.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Teacher Dialog */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Class Teacher</DialogTitle>
                        <DialogDescription>Select a teacher to assign to this class stream.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Teacher</Label>
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.filter((t) => !t.status || t.status === 'Active').map((t) => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            {t.firstName} {t.lastName} - {t.qualification || 'General'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleAssignTeacher} disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                            {isSubmitting ? "Assigning..." : "Assign Teacher"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

