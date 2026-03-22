"use client"

export const runtime = 'edge';

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    MapPin,
    Phone,
    Mail,
    Calendar,
    Briefcase,
    Pencil,
    Clock,
    Loader2,
    AlertCircle
} from "lucide-react"
import { use, useEffect, useState } from "react"
import { teacherActions } from "@/lib/electron"
import { toast } from "sonner"

interface RawTeacher {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    teacherId?: string;
    role?: string;
    qualification?: string;
    experience?: number;
    joiningDate?: string;
    phone?: string;
    address?: string;
    status?: string;
    photoUrl?: string;
    subjects?: string;
}

export default function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [teacher, setTeacher] = useState<RawTeacher | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTeacher = async () => {
            try {
                const id = parseInt(resolvedParams.id)
                if (isNaN(id)) {
                    toast.error("Invalid teacher ID")
                    setLoading(false)
                    return
                }
                const data = await teacherActions.getById(id)
                setTeacher(data as any)
            } catch (error) {
                console.error("Failed to fetch teacher:", error)
                toast.error("Failed to load teacher profile")
            } finally {
                setLoading(false)
            }
        }
        fetchTeacher()
    }, [resolvedParams.id])

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    if (!teacher) {
        return (
            <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Teacher Not Found</h2>
                <p className="text-gray-500">The requested teacher profile could not be found.</p>
                <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <PageHeader
                title="Teacher Profile"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Teachers", href: "/teachers" },
                    { label: `${teacher.firstName} ${teacher.lastName}` },
                ]}
                actions={
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                }
            />

            {/* Profile Header Card */}
            <Card className="overflow-hidden border-none shadow-md bg-gradient-to-r from-teal-50 to-white">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                            <AvatarImage src={teacher.photoUrl || ""} alt={teacher.firstName} />
                            <AvatarFallback className="text-2xl bg-teal-100 text-teal-600 font-bold">
                                {teacher.firstName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{teacher.firstName} {teacher.lastName}</h2>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <span className="font-medium text-teal-600">{teacher.teacherId || "N/A"}</span>
                                        <span>•</span>
                                        <span>{teacher.role || "Teacher"}</span>
                                    </div>
                                </div>
                                <Badge className={`w-fit ${teacher.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-transparent`}>
                                    {teacher.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Briefcase className="h-4 w-4 text-gray-400" />
                                    <span>{teacher.qualification || "Not specified"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>{teacher.experience ? `${teacher.experience} Years` : "N/A"} Exp.</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>Joined: {teacher.joiningDate || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Tabs defaultValue="details" className="w-full mt-8">
                        <TabsList className="grid w-full grid-cols-3 max-w-[500px] h-12 bg-slate-100/40 p-1 rounded-xl ring-1 ring-slate-200/50 shadow-inner mb-8">
                            <TabsTrigger
                                value="details"
                                className="rounded-lg h-full transition-all duration-300 data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-slate-500"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="schedule"
                                className="rounded-lg h-full transition-all duration-300 data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-slate-500"
                            >
                                Schedule
                            </TabsTrigger>
                            <TabsTrigger
                                value="performance"
                                className="rounded-lg h-full transition-all duration-300 data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-slate-500"
                            >
                                Performance
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-base">Contact Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Phone className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <p className="text-sm text-gray-700">{teacher.phone || "N/A"}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Mail className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <p className="text-sm text-gray-700">{teacher.email || "N/A"}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <MapPin className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <p className="text-sm text-gray-700">{teacher.address || "N/A"}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-base">Teaching Assignments</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Subjects</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {teacher.subjects ? (JSON.parse(teacher.subjects) as string[]).map((subject: string) => (
                                                    <Badge key={subject} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                                        {subject}
                                                    </Badge>
                                                )) : <span className="text-sm text-gray-400">No subjects assigned</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Assigned Classes</h4>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-sm text-gray-400">Class assignments loading...</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="schedule" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="p-8 text-center text-gray-500">
                                    Timetable and class schedule will be displayed here soon.
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="performance" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="p-8 text-center text-gray-500">
                                    Teacher performance metrics and reviews will be displayed here.
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
