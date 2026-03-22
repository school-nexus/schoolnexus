"use client"
export const runtime = 'edge';

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Award, BookOpen, Briefcase, Calendar, CheckCircle2, Download, FileText, Loader2, Mail, MapPin, MoreHorizontal, Pencil, Phone, Search, Trash2, Upload, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { teacherActions, subjectActions, academicYearActions, allocationActions, streamActions, classActions, fileActions } from "@/lib/electron"
import { toast } from "sonner"
import Link from "next/link"
import { useConfirm } from "@/components/providers/confirm-provider"
interface RawTeacher {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    qualification?: string;
    subjectId?: number;
    subject?: string;
    subjects?: string;
    gender?: string;
    dob?: string;
    status?: string;
    phone?: string;
    address?: string;
    experience?: number;
    photoUrl?: string;
    joinDate?: string;
}

interface RawSubject {
    id: number;
    name: string;
}

interface Allocations {
    id: number;
    teacherId: number;
    streamId: number;
    subjectId: number;
}

interface Stream {
    id: number;
    name: string;
    classId: number;
}

interface Class {
    id: number;
    name: string;
}

interface TeacherDoc {
    id: number;
    name: string;
    date: string;
    size: string;
    type: string;
    path: string;
}

interface Teacher {
    id: number
    teacherId: string
    name: string
    firstName: string
    lastName: string
    qualification: string
    subject: string
    gender: string
    dob: string
    status: string
    image: string
    email: string
    phone: string
    address: string
    stats: { classes: number; students: number; rating: number }
    experience: string
    joinDate: string
    classes: { name: string; stream: string; subject: string; time: string }[]
    documents: { id: number; name: string; date: string; size: string; type: string; path: string }[]
}

function TeacherProfilesContent() {
    const { confirm } = useConfirm()
    const searchParams = useSearchParams()
    const teacherIdParam = searchParams.get('id')

    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
    const [filterStatus, setFilterStatus] = useState<string>("all")

    useEffect(() => {
        fetchData()
    }, [teacherIdParam])

    const fetchData = async () => {
        try {
            const [teacherData, subjectData, academicYears, streamsData, classesData] = await Promise.all([
                teacherActions.getAll() as Promise<RawTeacher[]>,
                subjectActions.getAll() as Promise<RawSubject[]>,
                academicYearActions.getAll() as Promise<{ id: number; isActive: boolean }[]>,
                streamActions.getAll() as Promise<Stream[]>,
                classActions.getAll() as Promise<Class[]>
            ])

            // Get active academic year
            const activeYear = academicYears.find((y) => y.isActive) || academicYears[academicYears.length - 1];
            let allocations: Allocations[] = [];
            if (activeYear) {
                allocations = await allocationActions.getByYear(activeYear.id);
            }

            const mappedTeachers: Teacher[] = await Promise.all(teacherData.map(async (t) => {
                // Parse subjects
                let subjectDisplay = "General";
                try {
                    if (t.subjects) {
                        const parsed = JSON.parse(t.subjects);
                        subjectDisplay = Array.isArray(parsed) ? parsed.join(", ") : parsed;
                    } else {
                        subjectDisplay = subjectData.find((s) => s.id === t.subjectId)?.name || t.subject || "General";
                    }
                } catch {
                    subjectDisplay = t.subject || "General";
                }

                // Get assigned classes
                const teacherAllocations = allocations.filter((a) => a.teacherId === t.id);
                const assignedClasses = teacherAllocations.map((a) => {
                    const stream = streamsData.find((s) => s.id === a.streamId);
                    const cls = stream ? classesData.find((c) => c.id === stream.classId) : null;
                    const subject = subjectData.find((s) => s.id === a.subjectId);

                    return {
                        name: cls ? cls.name : "Unknown Class",
                        stream: stream ? stream.name : "Unknown Stream",
                        subject: subject ? subject.name : "Unknown Subject",
                        time: "09:00 AM" // Placeholder as schedule is not yet implemented
                    };
                });

                // Get real stats and documents
                const [stats, documents] = await Promise.all([
                    teacherActions.getStats(t.id),
                    teacherActions.getDocuments(t.id) as Promise<TeacherDoc[]>
                ]);

                return {
                    id: t.id,
                    teacherId: `TCH-${t.id.toString().padStart(3, '0')}`,
                    name: `${t.firstName} ${t.lastName}`,
                    firstName: t.firstName,
                    lastName: t.lastName,
                    qualification: t.qualification || "N/A",
                    subject: subjectDisplay,
                    gender: t.gender || "N/A",
                    dob: t.dob || "N/A",
                    status: t.status || "Active",
                    image: fileActions.getUrl(t.photoUrl) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.firstName}`,
                    email: t.email || "N/A",
                    phone: t.phone || "N/A",
                    address: t.address || "N/A",
                    stats: {
                        classes: stats.classes,
                        students: stats.students,
                        rating: 4.5
                    },
                    experience: t.experience ? `${t.experience} Years` : "N/A",
                    joinDate: t.joinDate || "N/A",
                    classes: assignedClasses,
                    documents: documents.map((d) => ({
                        id: d.id,
                        name: d.name,
                        date: new Date(d.date).toLocaleDateString(),
                        size: d.size,
                        type: d.type,
                        path: d.path
                    }))
                };
            }));

            setTeachers(mappedTeachers)
        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load teacher profiles")
        } finally {
            setLoading(false)
        }
    }

    const handleTeacherSelect = (teacherId: string) => {
        const teacher = teachers.find(t => t.id.toString() === teacherId)
        if (teacher) {
            setSelectedTeacher(teacher)
        }
    }

    // Filter teachers based on status
    const filteredTeachers = teachers.filter(teacher => {
        if (filterStatus !== "all") {
            if (teacher.status?.toLowerCase() !== filterStatus.toLowerCase()) return false
        }
        // Also apply search query filter
        if (searchQuery) {
            const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                teacher.teacherId.toLowerCase().includes(searchQuery.toLowerCase())
            if (!matchesSearch) return false
        }
        return true
    })

    // Set initial selected teacher when data loads
    useEffect(() => {
        if (teachers.length > 0 && !selectedTeacher) {
            if (teacherIdParam) {
                const teacher = teachers.find(t => t.id.toString() === teacherIdParam)
                setSelectedTeacher(teacher || teachers[0])
            } else {
                setSelectedTeacher(teachers[0])
            }
        }
    }, [teachers, teacherIdParam, selectedTeacher])

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    if (teachers.length === 0) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 flex items-center justify-center">
                <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Teachers Found</h3>
                    <p className="text-slate-500">Add teachers to view their profiles here.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">

                {/* Search & Filter Bar - Floating Glass */}
                {/* Search & Filter Bar - Floating Glass */}
                <div className="sticky top-4 z-20 mx-auto max-w-4xl">
                    <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-visible rounded-3xl">
                        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder="Search by name or ID..."
                                    className="pl-12 bg-slate-50 border-0 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium placeholder:text-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Select value={selectedTeacher?.id.toString()} onValueChange={handleTeacherSelect}>
                                    <SelectTrigger className="w-full md:w-[200px] bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold text-slate-600">
                                        <SelectValue placeholder="Select Teacher" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        {filteredTeachers.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()} className="rounded-lg py-3">
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-full md:w-[150px] bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold text-slate-600">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg py-3">All Status</SelectItem>
                                        <SelectItem value="Active" className="rounded-lg py-3">Active</SelectItem>
                                        <SelectItem value="On Leave" className="rounded-lg py-3">On Leave</SelectItem>
                                        <SelectItem value="Inactive" className="rounded-lg py-3">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {selectedTeacher && (
                    <>
                        {/* Profile Header Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
                            {/* Header Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-slate-50 opacity-50" />
                            <div className="absolute top-0 right-0 p-12 opacity-5">
                                <Briefcase className="w-64 h-64 text-teal-900 transform rotate-12" />
                            </div>

                            <div className="relative p-8 md:p-10">
                                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                                        <div className="relative group">
                                            <div className="h-32 w-32 rounded-full ring-4 ring-white shadow-xl bg-white p-1 transition-transform transform group-hover:scale-105">
                                                <Avatar className="h-full w-full">
                                                    <AvatarImage src={selectedTeacher.image} />
                                                    <AvatarFallback className="text-4xl font-bold text-teal-600 bg-teal-50">{selectedTeacher.name[0]}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className={cn(
                                                "absolute bottom-2 right-2 h-7 w-7 rounded-full ring-4 ring-white shadow-md flex items-center justify-center",
                                                selectedTeacher.status === 'Active' ? "bg-emerald-500" :
                                                    selectedTeacher.status === 'On Leave' ? "bg-amber-500" : "bg-slate-400"
                                            )}>
                                                {selectedTeacher.status === 'Active' && <CheckCircle2 className="h-4 w-4 text-white" />}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{selectedTeacher.name}</h1>
                                                <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                                                    {selectedTeacher.teacherId}
                                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                    {selectedTeacher.qualification}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 justify-center md:justify-start pt-2">
                                                <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-100 px-3 py-1 rounded-full">
                                                    {selectedTeacher.subject} Teacher
                                                </Badge>
                                                <Badge variant="outline" className="border-slate-200 text-slate-600 px-3 py-1 rounded-full">
                                                    {selectedTeacher.experience} Exp.
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full md:w-auto">
                                        <div className="flex items-center gap-2 w-full">
                                            <Button asChild className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 rounded-xl h-11 px-6 transition-all hover:shadow-emerald-500/30 hover:scale-[1.02]">
                                                <Link href={`/teachers/add?id=${selectedTeacher.id}`}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                                                </Link>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                    <DropdownMenuItem>
                                                        <Download className="mr-2 h-4 w-4" /> Download Report
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                        onClick={async () => {
                                                            if (await confirm({
                                                                title: "Deactivate Teacher",
                                                                description: `Are you sure you want to deactivate ${selectedTeacher.name}?`,
                                                                confirmText: "Deactivate",
                                                                variant: "destructive"
                                                            })) {
                                                                try {
                                                                    await teacherActions.update({
                                                                        id: selectedTeacher.id,
                                                                        status: 'Inactive'
                                                                    });
                                                                    toast.success("Teacher deactivated");
                                                                    fetchData();
                                                                } catch (error) {
                                                                    console.error("Failed to deactivate teacher:", error);
                                                                    toast.error("Failed to deactivate teacher");
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <AlertCircle className="mr-2 h-4 w-4" /> Deactivate
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="w-full max-w-[800px] h-auto p-1.5 bg-slate-100/50 backdrop-blur-xl border border-slate-200/60 rounded-2xl gap-1 mb-8">
                                <TabsTrigger
                                    value="details"
                                    className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/40 transition-all duration-300"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="classes"
                                    className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/40 transition-all duration-300"
                                >
                                    Classes
                                </TabsTrigger>
                                <TabsTrigger
                                    value="schedule"
                                    className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/40 transition-all duration-300"
                                >
                                    Schedule
                                </TabsTrigger>
                                <TabsTrigger
                                    value="documents"
                                    className="flex-1 rounded-xl py-3 text-sm font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/40 transition-all duration-300"
                                >
                                    Documents
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                                {/* Key Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="border-emerald-100/60 shadow-xl shadow-emerald-100/40 bg-emerald-50/50 backdrop-blur-xl ring-1 ring-emerald-900/5 group hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
                                        <CardContent className="p-6 relative overflow-hidden flex items-center gap-4">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
                                                <BookOpen className="w-24 h-24 text-emerald-900" />
                                            </div>
                                            <div className="h-16 w-16 rounded-2xl bg-white/80 flex items-center justify-center text-emerald-600 shadow-sm ring-1 ring-emerald-100 z-10">
                                                <BookOpen className="h-8 w-8" />
                                            </div>
                                            <div className="z-10">
                                                <p className="text-sm text-emerald-600/80 font-bold uppercase tracking-widest mb-1">Classes</p>
                                                <p className="text-3xl font-black text-emerald-900 tracking-tight">{selectedTeacher.stats.classes}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-blue-100/60 shadow-xl shadow-blue-100/40 bg-blue-50/50 backdrop-blur-xl ring-1 ring-blue-900/5 group hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
                                        <CardContent className="p-6 relative overflow-hidden flex items-center gap-4">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                                <Users className="w-24 h-24 text-blue-900" />
                                            </div>
                                            <div className="h-16 w-16 rounded-2xl bg-white/80 flex items-center justify-center text-blue-600 shadow-sm ring-1 ring-blue-100 z-10">
                                                <Users className="h-8 w-8" />
                                            </div>
                                            <div className="z-10">
                                                <p className="text-sm text-blue-600/80 font-bold uppercase tracking-widest mb-1">Students</p>
                                                <p className="text-3xl font-black text-blue-900 tracking-tight">{selectedTeacher.stats.students}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-amber-100/60 shadow-xl shadow-amber-100/40 bg-amber-50/50 backdrop-blur-xl ring-1 ring-amber-900/5 group hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300">
                                        <CardContent className="p-6 relative overflow-hidden flex items-center gap-4">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
                                                <Award className="w-24 h-24 text-amber-900" />
                                            </div>
                                            <div className="h-16 w-16 rounded-2xl bg-white/80 flex items-center justify-center text-amber-600 shadow-sm ring-1 ring-amber-100 z-10">
                                                <Award className="h-8 w-8" />
                                            </div>
                                            <div className="z-10">
                                                <p className="text-sm text-amber-600/80 font-bold uppercase tracking-widest mb-1">Rating</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-3xl font-black text-amber-900 tracking-tight">{selectedTeacher.stats.rating}</p>
                                                    <span className="text-sm font-bold text-amber-700/60">/ 5.0</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Personal Info */}
                                    <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-transparent border-b border-emerald-100/50 pb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                    <div className="h-5 w-5 rounded-full bg-emerald-500" />
                                                </div>
                                                <CardTitle className="text-lg font-bold text-slate-800">Personal Information</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-8">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date of Birth</p>
                                                    <p className="text-slate-800 font-semibold text-lg">{selectedTeacher.dob}</p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gender</p>
                                                    <p className="text-slate-800 font-semibold text-lg">{selectedTeacher.gender}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</p>
                                                <div className="flex items-center gap-2 text-slate-800 font-medium text-base bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                                                    {selectedTeacher.address}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Contact Info */}
                                    <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
                                        <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-indigo-100/50 pb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <CardTitle className="text-lg font-bold text-slate-800">Contact Details</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-6">
                                            <div className="space-y-1.5">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                                <div className="flex items-center gap-3 text-slate-700 font-medium text-base bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                                                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                                        <Mail className="h-3.5 w-3.5 text-indigo-500" />
                                                    </div>
                                                    {selectedTeacher.email}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                                                <div className="flex items-center gap-3 text-slate-700 font-medium text-base bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                                                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                                        <Phone className="h-3.5 w-3.5 text-emerald-500" />
                                                    </div>
                                                    {selectedTeacher.phone}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="classes" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                                <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 pb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 shadow-sm">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold text-slate-800">Assigned Classes</CardTitle>
                                                <CardDescription className="font-medium text-slate-500">Classes currently taught by this teacher</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {selectedTeacher.classes.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedTeacher.classes.map((cls, index) => (
                                                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md hover:border-emerald-100 transition-all duration-300 group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-50 transition-colors">
                                                                <BookOpen className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{cls.name} <span className="text-slate-400">|</span> {cls.stream}</p>
                                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{cls.subject}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="bg-white group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-all">
                                                            {cls.time}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                                <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                                                    <BookOpen className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <p className="font-bold text-lg text-slate-600">No classes assigned</p>
                                                <p className="text-slate-400">This teacher has not been assigned to any classes yet.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="schedule" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                                <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 pb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold text-slate-800">Weekly Schedule</CardTitle>
                                                <CardDescription className="font-medium text-slate-500">Timetable for the current term</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-100 blur-xl rounded-full opacity-50"></div>
                                                <div className="h-24 w-24 rounded-3xl bg-white shadow-xl flex items-center justify-center relative z-10 ring-1 ring-indigo-50">
                                                    <Calendar className="h-12 w-12 text-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-black text-slate-900">Schedule Coming Soon</h3>
                                                <p className="text-slate-500 font-medium leading-relaxed">
                                                    We are currently working on the timetable integration. Check back later for the detailed weekly schedule.
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full font-bold">
                                                Feature In Progress
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="documents" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-100/50 rounded-2xl border border-slate-200/60 backdrop-blur-xl">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg text-slate-900">Teacher Documents</h3>
                                        <p className="text-sm font-medium text-slate-500">Manage official records and files</p>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file && selectedTeacher) {
                                                    try {
                                                        const path = await fileActions.save(file, 'teacher_documents', selectedTeacher.id);
                                                        await teacherActions.addDocument({
                                                            teacherId: selectedTeacher.id,
                                                            name: file.name,
                                                            type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
                                                            size: `${(file.size / 1024).toFixed(1)} KB`,
                                                            path: path
                                                        });
                                                        toast.success("Document uploaded successfully");
                                                        fetchData(); // Refresh data
                                                    } catch (error) {
                                                        console.error("Failed to upload document:", error);
                                                        toast.error("Failed to upload document");
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 rounded-xl h-11 px-6 transition-all hover:scale-105 active:scale-95"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" /> Upload New
                                        </Button>
                                    </div>
                                </div>

                                {selectedTeacher.documents.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {selectedTeacher.documents.map((doc, index) => (
                                            <Card key={index} className="group border-slate-200/60 shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 hover:border-emerald-200 bg-white/80 backdrop-blur-xl">
                                                <CardContent className="p-6 flex items-start gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 ring-1 ring-red-100 group-hover:scale-110 transition-transform duration-300">
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <p className="font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{doc.name}</p>
                                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded-md">{doc.type}</span>
                                                            <span>•</span>
                                                            <span>{doc.size}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-400">{doc.date}</p>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(fileActions.getUrl(doc.path));
                                                            }}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (await confirm({
                                                                    title: "Delete Document",
                                                                    description: "Are you sure you want to delete this document?",
                                                                    confirmText: "Delete",
                                                                    variant: "destructive"
                                                                })) {
                                                                    try {
                                                                        await teacherActions.deleteDocument(doc.id);
                                                                        if (doc.path) {
                                                                            await fileActions.delete(doc.path);
                                                                        }
                                                                        toast.success("Document deleted");
                                                                        fetchData();
                                                                    } catch (error) {
                                                                        console.error("Failed to delete document:", error);
                                                                        toast.error("Failed to delete document");
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200/60">
                                        <div className="h-20 w-20 rounded-full bg-slate-100/50 flex items-center justify-center mb-4">
                                            <FileText className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">No Documents Found</h3>
                                        <p className="text-slate-500 font-medium max-w-sm text-center">
                                            Upload official documents such as contracts, certificates, or ID copies here.
                                        </p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs >
                    </>
                )}
            </div >
        </div >
    )
}

export default function TeacherProfilesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>}>
            <TeacherProfilesContent />
        </Suspense>
    )
}

