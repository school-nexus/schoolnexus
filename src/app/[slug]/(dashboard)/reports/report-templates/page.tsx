'use client';
export const runtime = 'edge';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, CheckCircle2, ChevronRight, Download, Eye, FileText, Filter, GraduationCap, LayoutGrid, ListIcon, Loader2, MoreHorizontal, Printer, School, Search, Settings2, UserCheck, Users, X } from 'lucide-react';
;
import {
    termActions,
    classActions,
    streamActions,
    reportActions,
    schoolProfileActions
} from '@/lib/electron';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PrimaryReportTemplate } from '@/components/reports/primary-report-template';
import { ReportSettingsDialog, ReportSettings } from '@/components/reports/report-settings-dialog';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';

import { reportUtils, type SchoolProfile, type ReportData } from '@/lib/report-utils';

interface Term {
    id: number
    name: string
    year: string
    isActive: boolean
}

interface Class {
    id: number
    name: string
}

interface Stream {
    id: number
    name: string
    classId: number
}

export default function SimplifiedReportTemplatesPage() {
    // Data State
    const [terms, setTerms] = useState<Term[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [streams, setStreams] = useState<Stream[]>([])
    const [studentsData, setStudentsData] = useState<ReportData[]>([])
    const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null)

    // Selection State
    const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [previewStudentId, setPreviewStudentId] = useState<number | null>(null);

    // Settings
    const [settings, setSettings] = useState<ReportSettings>({
        showBot: true,
        showMid: true,
        showEot: true,
        showGrading: true,
        showFees: true,
        showNextTerm: true,
        showComments: true,
        showDob: true,
        showAttendance: true,
        showDivision: true,
        reportTitle: 'Termly Report Card',
        themeColor: 'emerald',
    });

    const printRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        async function init() {
            try {
                const [termsData, classesData, profile] = await Promise.all([
                    termActions.getAll() as Promise<Term[]>,
                    classActions.getAll() as Promise<Class[]>,
                    schoolProfileActions.get() as Promise<SchoolProfile>
                ])

                setTerms(termsData)
                setClasses(classesData)
                setSchoolProfile(profile)

                // Auto-select active term
                if (termsData.length > 0) {
                    const active = termsData.find(t => t.isActive) || termsData[0]
                    setSelectedTermId(active.id)
                }
            } catch (error: unknown) {
                console.error('Initalization error:', error)
                toast.error('Failed to load initial data')
            } finally {
                setLoading(false)
            }
        }
        init();
    }, []);

    // Load Streams
    useEffect(() => {
        if (selectedClassId) {
            streamActions.getAll(selectedClassId).then(data => setStreams(data as Stream[]))
            setSelectedStreamId(null)
        } else {
            setStreams([]);
        }
    }, [selectedClassId]);

    // Load Students/Reports
    useEffect(() => {
        if (selectedTermId && selectedClassId) {
            setFetchingStudents(true);
            reportActions.getTermlyReport({
                termId: selectedTermId,
                classId: selectedClassId,
                streamId: selectedStreamId || undefined
            }).then(data => {
                setStudentsData(data as unknown as ReportData[])
                setFetchingStudents(false)
            }).catch((err: unknown) => {
                console.error(err)
                toast.error('Failed to load student reports')
                setFetchingStudents(false)
            })
        } else {
            setStudentsData([]);
        }
    }, [selectedTermId, selectedClassId, selectedStreamId]);

    // Filtering
    const filteredStudents = useMemo(() => {
        return studentsData.filter(d =>
            `${d.student.firstName} ${d.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [studentsData, searchQuery]);

    // Printing
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'Student Report Cards',
    });

    const toggleSelectAll = () => {
        if (selectedStudentIds.length === filteredStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(filteredStudents.map(d => d.student.id));
        }
    };

    const selectedTermName = terms.find(t => t.id === selectedTermId)?.name || 'N/A';
    const selectedTermYear = terms.find(t => t.id === selectedTermId)?.year || new Date().getFullYear().toString();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading academic data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[120px] -z-10 -mr-40 -mt-20" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-teal-50/50 rounded-full blur-[150px] -z-10 -ml-60 -mb-60" />

            <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-200">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100">Academic Reports</Badge>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Report Templates</h1>
                        <p className="text-slate-500 text-base max-w-2xl font-medium">
                            Generate and manage professional academic report cards with real-time analytics.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ReportSettingsDialog settings={settings} onSettingsChange={setSettings} />
                        <Button
                            onClick={handlePrint}
                            disabled={selectedStudentIds.length === 0}
                            className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 gap-2 h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <Printer className="h-4 w-4" />
                            Print Batch ({selectedStudentIds.length})
                        </Button>
                    </div>
                </div>

                {/* Advanced Filter Console */}
                <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-visible rounded-3xl">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-emerald-500" /> Academic Term
                                </label>
                                <Select value={selectedTermId?.toString()} onValueChange={v => setSelectedTermId(parseInt(v))}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="Select Term" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        {terms.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()} className="rounded-lg py-3 focus:bg-emerald-50 focus:text-emerald-700">
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{t.name} ({t.year})</span>
                                                    {t.isActive && <Badge variant="outline" className="ml-2 bg-emerald-500 text-white border-0 text-[9px] h-4">Active</Badge>}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-emerald-500" /> Class Level
                                </label>
                                <Select value={selectedClassId?.toString()} onValueChange={v => setSelectedClassId(parseInt(v))}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()} className="rounded-lg py-3">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-emerald-500" /> Stream
                                </label>
                                <Select value={selectedStreamId?.toString() || 'all'} onValueChange={v => setSelectedStreamId(v === 'all' ? null : parseInt(v))}>
                                    <SelectTrigger className="bg-slate-50 border-0 h-12 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                        <SelectValue placeholder="All Streams" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="all" className="rounded-lg py-3">All Streams</SelectItem>
                                        {streams.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()} className="rounded-lg py-3">{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <Search className="h-4 w-4 text-emerald-500" /> Student Identity
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Search name or ID..."
                                        className="pl-12 bg-slate-50 border-0 h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                {/* Content Area */}
                {!selectedClassId ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-sm rounded-[40px] border-2 border-dashed border-slate-200"
                    >
                        <div className="h-28 w-28 rounded-full bg-emerald-50 flex items-center justify-center mb-6 shadow-inner ring-8 ring-emerald-50/50">
                            <Users className="h-12 w-12 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Ready to Generate?</h3>
                        <p className="text-slate-500 mt-4 text-center max-w-md text-base leading-relaxed">
                            To begin, please select a <span className="text-emerald-600 font-bold">Term</span> and <span className="text-emerald-600 font-bold">Class</span> from the management console above.
                        </p>
                    </motion.div>
                ) : fetchingStudents ? (
                    <div className="py-40 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <div className="h-20 w-20 border-4 border-emerald-100 border-t-emerald-600 animate-spin rounded-full shadow-lg shadow-emerald-100" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Users className="h-8 w-8 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Analyzing student database...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Control Strip */}
                        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-100">
                            <div className="flex items-center gap-6">
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all cursor-pointer select-none border",
                                        selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                                            ? "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-200"
                                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                                    )}
                                    onClick={toggleSelectAll}
                                >
                                    <div className={cn(
                                        "h-5 w-5 rounded-md flex items-center justify-center transition-all",
                                        selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                                            ? "bg-white"
                                            : "bg-white border-2 border-slate-300"
                                    )}>
                                        {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 && (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-black uppercase tracking-widest",
                                        selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                                            ? "text-white"
                                            : "text-slate-500"
                                    )}>Select All Members</span>
                                </div>

                                <div className="h-8 w-[1px] bg-slate-100" />

                                <p className="text-sm font-bold text-slate-400">
                                    Showing <span className="text-slate-900">{filteredStudents.length}</span> students in this cohort
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "h-9 px-4 rounded-xl transition-all",
                                        viewMode === 'grid' ? "bg-white text-emerald-600 shadow-md border-0 hover:bg-white" : "text-slate-400"
                                    )}
                                >
                                    <LayoutGrid className="h-4.5 w-4.5 mr-2" />
                                    <span className="font-bold text-xs uppercase tracking-tight">Grid</span>
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "h-9 px-4 rounded-xl transition-all",
                                        viewMode === 'list' ? "bg-white text-emerald-600 shadow-md border-0 hover:bg-white" : "text-slate-400"
                                    )}
                                >
                                    <ListIcon className="h-4.5 w-4.5 mr-2" />
                                    <span className="font-bold text-xs uppercase tracking-tight">List</span>
                                </Button>
                            </div>
                        </div>

                        {/* Student Portfolio View */}
                        <div className={cn(
                            "grid gap-6",
                            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                        )}>
                            <AnimatePresence mode="popLayout">
                                {filteredStudents.map((data) => (
                                    <motion.div
                                        layout
                                        key={data.student.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, ease: "circOut" }}
                                    >
                                        {viewMode === 'grid' ? (
                                            <Card
                                                className={cn(
                                                    "group relative transition-all duration-500 rounded-[32px] overflow-hidden border-0",
                                                    selectedStudentIds.includes(data.student.id)
                                                        ? "bg-emerald-600 shadow-2xl shadow-emerald-200 ring-offset-4 ring-4 ring-emerald-100"
                                                        : "bg-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-100/30 hover:-translate-y-1.5 ring-1 ring-slate-100"
                                                )}
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div
                                                            className={cn(
                                                                "h-20 w-20 rounded-[24px] flex items-center justify-center text-2xl font-black shadow-lg shadow-black/5 transition-transform group-hover:rotate-3",
                                                                selectedStudentIds.includes(data.student.id) ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
                                                            )}
                                                        >
                                                            {data.student.firstName[0]}{data.student.lastName[0]}
                                                        </div>

                                                        <div
                                                            className={cn(
                                                                "p-2.5 rounded-xl transition-all cursor-pointer",
                                                                selectedStudentIds.includes(data.student.id) ? "bg-white text-emerald-600" : "bg-slate-50 text-slate-400"
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const checked = !selectedStudentIds.includes(data.student.id);
                                                                setSelectedStudentIds(prev =>
                                                                    checked ? [...prev, data.student.id] : prev.filter(id => id !== data.student.id)
                                                                );
                                                            }}
                                                        >
                                                            <CheckCircle2 className={cn("h-5 w-5", selectedStudentIds.includes(data.student.id) ? "fill-emerald-600 text-emerald-600" : "")} />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <h4 className={cn(
                                                            "text-lg font-black leading-tight truncate uppercase tracking-tight",
                                                            selectedStudentIds.includes(data.student.id) ? "text-white" : "text-slate-900"
                                                        )}>
                                                            {data.student.firstName} {data.student.lastName}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-[9px] font-bold px-1.5 py-0 border-0 rounded-lg",
                                                                    selectedStudentIds.includes(data.student.id) ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                                                                )}
                                                            >
                                                                #{data.student.admissionNumber}
                                                            </Badge>
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest",
                                                                selectedStudentIds.includes(data.student.id) ? "text-emerald-100" : "text-emerald-600"
                                                            )}>
                                                                Avg: {data.performance.average}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 flex gap-2">
                                                        <Button
                                                            className={cn(
                                                                "flex-1 h-11 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all",
                                                                selectedStudentIds.includes(data.student.id)
                                                                    ? "bg-white text-emerald-600 hover:bg-emerald-50"
                                                                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                                                            )}
                                                            onClick={() => setPreviewStudentId(data.student.id)}
                                                        >
                                                            View Report
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "h-11 w-11 rounded-xl transition-all",
                                                                selectedStudentIds.includes(data.student.id)
                                                                    ? "bg-white/10 text-white hover:bg-white/20"
                                                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                                            )}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <div
                                                className={cn(
                                                    "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border",
                                                    selectedStudentIds.includes(data.student.id)
                                                        ? "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-100 text-white"
                                                        : "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={cn(
                                                            "p-2 rounded-xl transition-all cursor-pointer",
                                                            selectedStudentIds.includes(data.student.id) ? "bg-white text-emerald-600" : "bg-slate-50 text-slate-400"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const checked = !selectedStudentIds.includes(data.student.id);
                                                            setSelectedStudentIds(prev =>
                                                                checked ? [...prev, data.student.id] : prev.filter(id => id !== data.student.id)
                                                            );
                                                        }}
                                                    >
                                                        <CheckCircle2 className={cn("h-5 w-5", selectedStudentIds.includes(data.student.id) ? "fill-emerald-600 text-emerald-600" : "")} />
                                                    </div>

                                                    <div className={cn(
                                                        "h-12 w-12 rounded-xl flex items-center justify-center text-sm font-black shadow-sm",
                                                        selectedStudentIds.includes(data.student.id) ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
                                                    )}>
                                                        {data.student.firstName[0]}{data.student.lastName[0]}
                                                    </div>

                                                    <div>
                                                        <h4 className={cn(
                                                            "text-sm font-black uppercase tracking-tight",
                                                            selectedStudentIds.includes(data.student.id) ? "text-white" : "text-slate-900"
                                                        )}>
                                                            {data.student.firstName} {data.student.lastName}
                                                        </h4>
                                                        <p className={cn(
                                                            "text-[10px] font-bold uppercase tracking-widest",
                                                            selectedStudentIds.includes(data.student.id) ? "text-emerald-100" : "text-slate-400"
                                                        )}>
                                                            ID: {data.student.admissionNumber}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest mb-1",
                                                            selectedStudentIds.includes(data.student.id) ? "text-emerald-100" : "text-slate-400"
                                                        )}>Performance</p>
                                                        <Badge className={cn(
                                                            "font-black text-xs h-6 px-3 rounded-lg",
                                                            selectedStudentIds.includes(data.student.id) ? "bg-white text-emerald-600" : "bg-emerald-50 text-emerald-700"
                                                        )}>
                                                            {data.performance.average}%
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            className={cn(
                                                                "h-10 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px]",
                                                                selectedStudentIds.includes(data.student.id)
                                                                    ? "bg-white text-emerald-600 hover:bg-emerald-50"
                                                                    : "bg-slate-900 text-white hover:bg-slate-800"
                                                            )}
                                                            onClick={() => setPreviewStudentId(data.student.id)}
                                                        >
                                                            Preview
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "h-10 w-10 rounded-xl",
                                                                selectedStudentIds.includes(data.student.id)
                                                                    ? "text-white hover:bg-white/10"
                                                                    : "text-slate-400 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {filteredStudents.length === 0 && !fetchingStudents && (
                            <div className="py-32 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
                                <Search className="h-16 w-16 mx-auto text-slate-200 mb-6" />
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">No results matched</h3>
                                <p className="text-slate-400 mt-2 font-medium">Try refining your search or changing the filters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Float Action Bar (Selected Students Actions) */}
            <AnimatePresence>
                {selectedStudentIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-6"
                    >
                        <div className="bg-slate-900 text-white rounded-[28px] p-4 flex items-center justify-between shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/10 backdrop-blur-3xl">
                            <div className="flex items-center gap-4 pl-4">
                                <div className="p-2 bg-emerald-500 rounded-xl">
                                    <UserCheck className="h-5 w-5 text-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <h5 className="font-black text-sm uppercase tracking-wider">Cohort Actions</h5>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{selectedStudentIds.length} Students Selected</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-white bg-white/5 hover:bg-white/10 rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest"
                                    onClick={() => setSelectedStudentIds([])}
                                >
                                    Clear Selection
                                </Button>
                                <Button
                                    onClick={handlePrint}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Cohort
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal Enhancement */}
            <Dialog open={!!previewStudentId} onOpenChange={(open) => !open && setPreviewStudentId(null)}>
                <DialogContent className="max-w-[100vw] sm:max-w-fit max-h-[100vh] h-[95vh] p-0 flex flex-col bg-[#F1F5F9] border-0 rounded-none sm:rounded-[40px] overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 border-b bg-white/70 backdrop-blur-xl shrink-0 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-slate-900 rounded-2xl">
                                <Eye className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                                    Report Analysis Preview
                                </DialogTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Performance Summary</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mr-6">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-11 px-6 rounded-xl gap-2 bg-white border-slate-200 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50"
                                onClick={() => {
                                    toast.info("Preparing digital export...");
                                    handlePrint();
                                }}
                            >
                                <Printer className="h-4 w-4" /> Print Digital Copy
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPreviewStudentId(null)}
                                className="h-11 w-11 rounded-xl bg-slate-100/50 hover:bg-slate-200"
                            >
                                <X className="h-6 w-6 text-slate-900" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto bg-[#F1F5F9] p-12 flex justify-center custom-scrollbar">
                        <div className="shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] bg-white origin-top animate-in fade-in zoom-in-95 duration-500 rounded-sm">
                            {previewStudentId && (
                                <PrimaryReportTemplate
                                    data={studentsData.find(d => d.student.id === previewStudentId)}
                                    settings={settings}
                                    schoolInfo={schoolProfile || undefined}
                                    termName={selectedTermName}
                                    year={selectedTermYear}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden Print Container */}
            <div className="hidden">
                <div ref={printRef}>
                    {selectedStudentIds.length > 0 ? (
                        studentsData
                            .filter(d => selectedStudentIds.includes(d.student.id))
                            .map((data, index) => (
                                <div key={data.student.id} className={cn(index > 0 && "break-before-page")}>
                                    <PrimaryReportTemplate
                                        data={data}
                                        settings={settings}
                                        schoolInfo={schoolProfile || undefined}
                                        termName={selectedTermName}
                                        year={selectedTermYear}
                                    />
                                </div>
                            ))
                    ) : previewStudentId ? (
                        <PrimaryReportTemplate
                            data={studentsData.find(d => d.student.id === previewStudentId)}
                            settings={settings}
                            schoolInfo={schoolProfile || undefined}
                            termName={selectedTermName}
                            year={selectedTermYear}
                        />
                    ) : null}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                  @page { size: A4; margin: 0; }
                  .break-before-page { break-before: page; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #CBD5E1;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94A3B8;
                }
            `}</style>

        </div>
    );
}
