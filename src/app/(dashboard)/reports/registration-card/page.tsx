"use client"

import React, { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Search, Loader2, Printer, SearchX, Users,
    Filter, GraduationCap, CheckCircle2, LayoutGrid, List
} from "lucide-react"
import { studentActions, schoolProfileActions, classActions, streamActions } from "@/lib/electron"
import { toast } from "sonner"
import { RegistrationCardTemplate } from "@/components/reports/registration-card-template"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { type Student, type SchoolProfile } from "@/lib/report-utils"

interface Class {
    id: number
    name: string
}

interface Stream {
    id: number
    name: string
    classId: number
}

export default function RegistrationCardPage() {
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [allStudents, setAllStudents] = useState<Student[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [streams, setStreams] = useState<Stream[]>([])
    const [selectedStream, setSelectedStream] = useState<string>("all")
    const [profile, setProfile] = useState<SchoolProfile | null>(null)
    const [viewMode, setViewMode] = useState<"preview" | "grid">("preview")
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const [studentsData, classesData, streamsData, profileData] = await Promise.all([
                studentActions.getAll() as Promise<any[]>,
                classActions.getAll() as Promise<Class[]>,
                streamActions.getAll() as Promise<Stream[]>,
                schoolProfileActions.get() as Promise<SchoolProfile>
            ])
            setAllStudents(studentsData as unknown as Student[])
            setClasses(classesData)
            setStreams(streamsData)
            setProfile(profileData)
        } catch (error: unknown) {
            console.error("Failed to fetch initial data:", error)
            toast.error("Failed to load required data")
        } finally {
            setLoading(false)
        }
    }

    const filteredStudents = allStudents.filter(s => {
        const matchesStream = selectedStream === "all" || (s as any).streamId === parseInt(selectedStream)
        const matchesSearch = !searchQuery ||
            s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStream && matchesSearch
    })

    const handlePrintSingle = () => {
        const printContent = document.getElementById("registration-card-container")
        if (printContent) {
            const originalContent = document.body.innerHTML
            document.body.innerHTML = printContent.outerHTML
            window.print()
            document.body.innerHTML = originalContent
            window.location.reload()
        } else {
            toast.error("Nothing to print")
        }
    }

    const handlePrintBulk = () => {
        if (filteredStudents.length === 0) {
            toast.error("No students to print")
            return
        }

        const printContainer = document.createElement("div")
        printContainer.id = "bulk-print-container"

        // Hide from current view but visible to print
        printContainer.style.display = "none"
        document.body.appendChild(printContainer)

        // We can't easily use React components outside the tree for printing 
        // without a separate portal or a hidden div.
        // Let's use a hidden div that we populate.

        toast.info(`Preparing ${filteredStudents.length} cards for printing...`)

        // For simplicity in this environment, we'll suggest using the browser's 
        // print functionality on a filtered grid view if bulk print is complex.
        // But let's try a simpler approach: Open a new window and render cards there.

        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            toast.error("Pop-up blocked. Please allow pop-ups to print.")
            return
        }

        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(s => s.outerHTML)
            .join('')

        printWindow.document.write(`
            <html>
                <head>
                    <title>Bulk Student Registration Cards</title>
                    ${styles}
                    <style>
                        @media print {
                            .card-break { page-break-after: always; }
                            body { margin: 0; padding: 0; }
                        }
                        .print-wrapper { 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            gap: 20px; 
                            padding: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="print-wrapper">
                        <div id="print-root"></div>
                    </div>
                </body>
            </html>
        `)

        // Unfortunately we can't easily render React into another window's document.
        // A better way is to show a "Print View" in the current window.
        printWindow.close()

        // Let's switch to a dedicated print mode in the current UI
        window.print()
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative font-sans p-6 md:p-8">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <PageHeader
                        title="Registration Cards"
                        description="Manage, preview and print professional student identity documents."
                    />

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("preview")}
                                className={cn("rounded-lg px-4 gap-2", viewMode === "preview" && "bg-slate-900 text-white hover:bg-slate-800")}
                            >
                                <LayoutGrid className="h-4 w-4" /> Preview
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className={cn("rounded-lg px-4 gap-2", viewMode === "grid" && "bg-slate-900 text-white hover:bg-slate-800")}
                            >
                                <List className="h-4 w-4" /> Selection List
                            </Button>
                        </div>

                        <Button
                            onClick={() => window.print()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 h-11 px-6 rounded-xl font-bold gap-2"
                        >
                            <Printer className="h-5 w-5" /> Print Current View
                        </Button>
                    </div>
                </div>

                {/* Control Panel */}
                <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-visible rounded-3xl">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5 text-emerald-500" /> Filter by Stream
                                </label>
                                <Select value={selectedStream} onValueChange={setSelectedStream}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="All Streams" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="all">All Streams</SelectItem>
                                        {streams.map(s => {
                                            const cls = classes.find(c => c.id === s.classId)
                                            return (
                                                <SelectItem key={s.id} value={s.id.toString()}>
                                                    {cls?.name} {s.name}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                    <Search className="h-3.5 w-3.5 text-emerald-500" /> Quick Student Search
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Search by name, ID or admission number..."
                                        className="pl-12 bg-slate-50 border-0 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {viewMode === "preview" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Selector Sidebar */}
                        <div className="lg:col-span-4 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Results ({filteredStudents.length})</h3>
                            {filteredStudents.map((student) => (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group",
                                        selectedStudent?.id === student.id
                                            ? "bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-200 text-white"
                                            : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-900"
                                    )}
                                >
                                    <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center font-black text-sm shadow-inner",
                                        selectedStudent?.id === student.id ? "bg-white/20" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                                    )}>
                                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate">{student.firstName} {student.lastName}</p>
                                        <p className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest",
                                            selectedStudent?.id === student.id ? "text-emerald-100" : "text-slate-400"
                                        )}>
                                            {student.admissionNumber || "No ID"} &bull; {student.gender}
                                        </p>
                                    </div>
                                    {selectedStudent?.id === student.id && <CheckCircle2 className="h-5 w-5 text-white" />}
                                </button>
                            ))}

                            {filteredStudents.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <SearchX className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold text-sm">No matches found</p>
                                </div>
                            )}
                        </div>

                        {/* Preview Area */}
                        <div className="lg:col-span-8">
                            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-2xl shadow-slate-200/50 p-12 flex flex-col items-center sticky top-8">
                                {selectedStudent ? (
                                    <div className="w-full space-y-8 animate-in fade-in zoom-in duration-300">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                    <LayoutGrid className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">Standard Registration Card</h3>
                                            </div>
                                            <Badge className="bg-emerald-50 text-emerald-700 border-none font-black px-3 py-1">LIVE PREVIEW</Badge>
                                        </div>

                                        <div className="overflow-x-auto w-full flex justify-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100 ring-1 ring-slate-100">
                                            <div id="registration-card-container">
                                                <RegistrationCardTemplate student={selectedStudent} schoolProfile={profile} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 pt-4">
                                            <Button
                                                onClick={handlePrintSingle}
                                                className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-bold gap-2 shadow-xl shadow-slate-200"
                                            >
                                                <Printer className="h-5 w-5" /> Print Current Card
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => window.print()}
                                                className="h-12 rounded-xl border-slate-200 font-bold"
                                            >
                                                Export as PDF
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center py-20 space-y-4 h-full">
                                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
                                            <GraduationCap className="h-10 w-10 text-slate-200" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 uppercase">Select a Scholar</h3>
                                            <p className="text-slate-400 text-sm max-w-xs font-medium">Choose a student from the list to preview and generate their official registration card.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                        {filteredStudents.map(student => (
                            <Card key={student.id} className="border-0 shadow-xl shadow-slate-200/40 bg-white group hover:scale-[1.02] transition-all cursor-pointer rounded-3xl overflow-hidden ring-1 ring-slate-200/50">
                                <CardContent className="p-0">
                                    <div className="p-6 flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-lg text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{student.firstName} {student.lastName}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.admissionNumber || "No ID"}</p>
                                                <Badge variant="outline" className="mt-2 text-[9px] font-black border-slate-200 text-slate-500">{student.gender}</Badge>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedStudent(student);
                                                setViewMode("preview");
                                            }}
                                            className="h-10 w-10 rounded-xl hover:bg-emerald-50 text-emerald-600"
                                        >
                                            <Printer className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center group-hover:bg-emerald-50/50 transition-colors">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5" /> {(student as any).stream?.name || student.streamName || "No Stream"}
                                        </p>
                                        <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Print Specific Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body * { visibility: hidden; }
                    #registration-card-container, #registration-card-container * {
                        visibility: visible;
                    }
                    #registration-card-container {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    nav, button, .no-print { display: none !important; }
                }
            `}</style>
        </div>
    )
}
