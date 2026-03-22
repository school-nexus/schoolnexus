"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Download,
    FileSpreadsheet,
    BarChart3,
    TrendingUp,
    Users,
    BookOpen,
    Award,
    Loader2,
    Filter,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { classActions, streamActions, marksActions, examActions, studentActions, reportActions, termActions, subjectActions } from "@/lib/electron"
import { toast } from "sonner"
import { reportUtils } from "@/lib/report-utils"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend, LineChart, Line
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface Class {
    id: number
    name: string
}

interface Stream {
    id: number
    name: string
    classId: number
}

interface Subject {
    id: number
    name: string
}

interface Term {
    id: number
    name: string
    status: string
}

interface PerformanceStats {
    averageScore: number
    passRate: number
    totalStudents: number
}

interface SubjectPerformance {
    subject: string
    average: number
}

interface GradeDistribution {
    name: string
    value: number
}

interface PassFailStat {
    name: string
    value: number
    fill: string
}

interface TermTrend {
    term: string
    average: number
}

interface StreamPerformance {
    stream: string
    average: number
}

interface StudentRanking {
    id: number
    name: string
    average: number
}

interface AnalyticsData {
    subjectPerformance: SubjectPerformance[]
    gradeDistribution: GradeDistribution[]
    passFailStats: PassFailStat[]
    termTrends: TermTrend[]
    streamPerformance: StreamPerformance[]
    topStudents: StudentRanking[]
    bottomStudents: StudentRanking[]
}

export default function PerformanceReportsPage() {
    const [classes, setClasses] = useState<Class[]>([])
    const [streams, setStreams] = useState<Stream[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [terms, setTerms] = useState<Term[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    // Filters
    const [selectedClass, setSelectedClass] = useState("")
    const [selectedStream, setSelectedStream] = useState("all")
    const [selectedSubject, setSelectedSubject] = useState("all")
    const [selectedTerm, setSelectedTerm] = useState("")

    // Data
    const [stats, setStats] = useState<PerformanceStats>({
        averageScore: 0,
        passRate: 0,
        totalStudents: 0
    })
    const [performanceData, setPerformanceData] = useState<AnalyticsData>({
        subjectPerformance: [],
        gradeDistribution: [],
        passFailStats: [],
        termTrends: [],
        streamPerformance: [],
        topStudents: [],
        bottomStudents: []
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [classesData, streamsData, subjectsData, termsData] = await Promise.all([
                classActions.getAll() as Promise<Class[]>,
                streamActions.getAll() as Promise<Stream[]>,
                subjectActions.getAll() as Promise<Subject[]>,
                termActions.getAll() as Promise<Term[]>
            ])
            setClasses(classesData)
            setStreams(streamsData)
            setClasses(classesData)
            setStreams(streamsData)
            setSubjects(subjectsData)
            setTerms(termsData)

            const active = termsData.find((t) => t.status === 'Active')
            if (active) setSelectedTerm(active.id.toString())

        } catch (error: unknown) {
            console.error("Failed to fetch dimensions:", error)
            toast.error("Failed to load filter options")
        } finally {
            setLoading(false)
        }
    }

    const handleGenerate = async () => {
        if (!selectedClass || !selectedTerm) return
        setGenerating(true)
        try {
            const filters = {
                classId: parseInt(selectedClass),
                termId: parseInt(selectedTerm),
                streamId: selectedStream && selectedStream !== "all" ? parseInt(selectedStream) : undefined,
                subjectId: selectedSubject && selectedSubject !== "all" ? parseInt(selectedSubject) : undefined
            }

            const [performanceStats, analyticsData] = await Promise.all([
                reportActions.getClassPerformance(filters) as Promise<PerformanceStats>,
                reportActions.getPerformanceAnalytics(filters) as Promise<AnalyticsData>
            ])

            setStats(performanceStats)
            setPerformanceData(analyticsData)
            toast.success("Report generated successfully")
        } catch (error: unknown) {
            console.error("Failed to generate report:", error)
            toast.error("Failed to generate performance report")
        } finally {
            setGenerating(false)
        }
    }

    const filteredStreams = streams.filter(s => s.classId.toString() === selectedClass)
    const activeTerm = terms.find(t => t.id.toString() === selectedTerm)

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading Analytics Dashboard...</p>
                </div>
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
                        title="Performance Reports"
                        description="Analyze academic performance across classes, streams, and subjects."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Reports", href: "/reports" },
                            { label: "Performance" },
                        ]}
                    />
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-11 rounded-xl shadow-sm"
                            onClick={async () => await reportUtils.exportToExcel({
                                filename: `Performance_Report_${classes.find(c => c.id.toString() === selectedClass)?.name || 'Class'}`,
                                columns: [
                                    { header: "Subject", dataKey: "subject" },
                                    { header: "Average Score", dataKey: "average" },
                                ],
                                data: performanceData.subjectPerformance as unknown as Record<string, unknown>[]
                            })}
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                        </Button>
                        <Button
                            className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 h-11 px-6 rounded-xl"
                            onClick={async () => await reportUtils.exportToPDF({
                                title: "Class Performance Analysis",
                                subtitle: `${classes.find(c => c.id.toString() === selectedClass)?.name || 'Class'} - ${activeTerm?.name || 'Term'}`,
                                filename: "Performance_Report",
                                columns: [
                                    { header: "Subject", dataKey: "subject" },
                                    { header: "Average Score", dataKey: "average" },
                                ],
                                data: performanceData.subjectPerformance as unknown as Record<string, unknown>[]
                            })}
                        >
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                </div>

                {/* Filter Section */}
                <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50 mb-6 font-sans">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5 font-sans">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Class</label>
                            <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setSelectedStream("all"); }}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent className="font-sans">
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 font-sans">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Stream (Optional)</label>
                            <Select value={selectedStream} onValueChange={setSelectedStream} disabled={!selectedClass}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue placeholder="All Streams" />
                                </SelectTrigger>
                                <SelectContent className="font-sans">
                                    <SelectItem value="all">All Streams</SelectItem>
                                    {filteredStreams.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 font-sans">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Term</label>
                            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                    <SelectValue placeholder="Select Term" />
                                </SelectTrigger>
                                <SelectContent className="font-sans">
                                    {terms.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end font-sans">
                            <Button
                                onClick={handleGenerate}
                                disabled={generating || !selectedClass}
                                className="w-full h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold"
                            >
                                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                                Generate Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                                    <Award className="h-6 w-6 text-teal-600" />
                                </div>
                                <Badge className="bg-teal-50 text-teal-700 border-teal-100">Term Average</Badge>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-bold text-slate-900">{stats.averageScore}%</h3>
                                <p className="text-slate-500 text-sm">Mean score for class</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">Pass Rate</Badge>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-bold text-slate-900">{stats.passRate}%</h3>
                                <p className="text-slate-500 text-sm">Students above 50%</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <Badge className="bg-blue-50 text-blue-700 border-blue-100">Cohort Size</Badge>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-3xl font-bold text-slate-900">{stats.totalStudents}</h3>
                                <p className="text-slate-500 text-sm">Active students</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subject Performance */}
                    <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-emerald-500" />
                                Subject Performance Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            {performanceData.subjectPerformance.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData.subjectPerformance}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="subject" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                                        />
                                        <Bar dataKey="average" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                                    No subject data available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stream Performance (if many streams) */}
                    {performanceData.streamPerformance.length > 0 && (
                        <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    Stream Comparison
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData.streamPerformance} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                        <YAxis dataKey="stream" type="category" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                                        />
                                        <Bar dataKey="average" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* 2. Grade Distribution (Pie Chart) */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-purple-600" />
                                <CardTitle className="text-lg">Grade Distribution</CardTitle>
                            </div>
                            <CardDescription>Breakdown of student grades</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                {performanceData.gradeDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={performanceData.gradeDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {performanceData.gradeDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <PieChartIcon className="h-12 w-12 mb-2 opacity-50" />
                                        <p>No data available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Pass/Fail Rate (Donut Chart) */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-emerald-600" />
                                <CardTitle className="text-lg">Pass vs Fail Rate</CardTitle>
                            </div>
                            <CardDescription>Overall performance summary</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                {performanceData.passFailStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={performanceData.passFailStats}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {performanceData.passFailStats.map((entry: PassFailStat, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Award className="h-12 w-12 mb-2 opacity-50" />
                                        <p>No data available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Term Trends (Line Chart) */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <LineChartIcon className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-lg">Performance Trends</CardTitle>
                            </div>
                            <CardDescription>Average class performance across terms</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                {performanceData.termTrends.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={performanceData.termTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Line type="monotone" dataKey="average" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <LineChartIcon className="h-12 w-12 mb-2 opacity-50" />
                                        <p>No trend data available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Rankings section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Students */}
                    <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Top Performing Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-emerald-50/50">
                                        <TableHead className="font-bold">Student Name</TableHead>
                                        <TableHead className="text-right font-bold">Average Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {performanceData.topStudents.length > 0 ? performanceData.topStudents.map((student: StudentRanking, idx) => (
                                    <TableRow key={student.id} className="hover:bg-emerald-50/30">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                                    {idx + 1}
                                                </span>
                                                {student.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600">{student.average}%</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-8 text-slate-400 italic">No rankings available</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Bottom Students */}
                <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Students Needing Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-red-50/50">
                                    <TableHead className="font-bold">Student Name</TableHead>
                                    <TableHead className="text-right font-bold">Average Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {performanceData.bottomStudents.length > 0 ? performanceData.bottomStudents.map((student: StudentRanking) => (
                                    <TableRow key={student.id} className="hover:bg-red-50/30">
                                        <TableCell className="font-medium text-slate-700">{student.name}</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">{student.average}%</TableCell>
                                    </TableRow>
                                )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-slate-400 italic">No data available</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
