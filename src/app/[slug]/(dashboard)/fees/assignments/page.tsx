"use client"

import { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Users,
    Plus,
    Loader2,
    Calendar,
    Banknote,
    Trash2,
    Wallet,
    GraduationCap,
    CheckCircle2,
    Save,
    RefreshCw,
    Target,
    Search,
    Filter,
    Eye,
    Edit,
    AlertCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
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
import { Input } from "@/components/ui/input"
import { 
    feeActions, 
    classActions, 
    streamActions, 
    studentActions, 
    termActions, 
    schoolProfileActions,
    groupActions,
    academicYearActions
} from "@/lib/electron"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { useConfirm } from "@/components/providers/confirm-provider"
import { motion, AnimatePresence } from "framer-motion"

interface RawFeeStructure {
    id: number
    name: string
    amount: number
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

interface RawStudent {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
    streamId?: number
    classId?: number
}

interface RawGroup {
    id: number
    name: string
    targetId?: number
}

interface RawAcademicYear {
    id: number
    name: string
    isActive: boolean
}

interface RawTerm {
    id: number
    name: string
    isActive: boolean
    academicYearId: number
}

type TargetType = 'class' | 'stream' | 'student' | 'group'

interface RawAssignment {
    id: number
    targetType: TargetType
    targetId: number
    feeId: number
    feeName: string
    amount: number
    className?: string
    studentName?: string
    groupName?: string
    streamName?: string
    academicYearName?: string
    termName?: string
    status?: string
    createdAt: string
}

interface RawProfile {
    currency: string
}

function FeeAssignmentsContent() {
    const { confirm } = useConfirm()
    const searchParams = useSearchParams()
    
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("assign")
    const [feeStructures, setFeeStructures] = useState<RawFeeStructure[]>([])
    const [classes, setClasses] = useState<RawClass[]>([])
    const [streams, setStreams] = useState<RawStream[]>([])
    const [students, setStudents] = useState<RawStudent[]>([])
    const [groups, setGroups] = useState<RawGroup[]>([])
    const [academicYears, setAcademicYears] = useState<RawAcademicYear[]>([])
    const [terms, setTerms] = useState<RawTerm[]>([])
    const [assignments, setAssignments] = useState<RawAssignment[]>([])
    const [assignmentsLoading, setAssignmentsLoading] = useState(false)
    const [profile, setProfile] = useState<RawProfile | null>(null)
    
    // Form states
    const [targetType, setTargetType] = useState<TargetType>("class")
    const [selectedFeeStructures, setSelectedFeeStructures] = useState<string[]>([])
    const [selectedTargets, setSelectedTargets] = useState<string[]>([])
    const [selectedAcademicYear, setSelectedAcademicYear] = useState("")
    const [selectedTerm, setSelectedTerm] = useState("")
    const [dueDate, setDueDate] = useState("")
    const [notes, setNotes] = useState("")
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [
                feeData, 
                classData, 
                streamData, 
                studentData, 
                groupData,
                academicYearData,
                termData,
                profileData,
                assignmentData
            ] = await Promise.all([
                feeActions.getStructures() as Promise<RawFeeStructure[]>,
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>,
                studentActions.getAll() as Promise<RawStudent[]>,
                groupActions.getAll() as Promise<RawGroup[]>,
                academicYearActions.getAll() as Promise<RawAcademicYear[]>,
                termActions.getAll() as Promise<RawTerm[]>,
                schoolProfileActions.get() as Promise<RawProfile>,
                (feeActions.getAssignments?.() || Promise.resolve([])) as Promise<RawAssignment[]>
            ])
            
            setFeeStructures(feeData || [])
            setClasses(classData || [])
            setStreams(streamData || [])
            setStudents(studentData || [])
            setGroups(groupData || [])
            setAcademicYears(academicYearData || [])
            setTerms(termData || [])
            setProfile(profileData)
            setAssignments(assignmentData || [])
            
            // Set defaults
            const activeYear = academicYearData?.find((y) => y.isActive)
            const activeTerm = termData?.find((t) => t.isActive)
            
            if (activeYear) setSelectedAcademicYear(activeYear.id.toString())
            if (activeTerm) setSelectedTerm(activeTerm.id.toString())
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchAssignments = async () => {
        try {
            setAssignmentsLoading(true);
            const filters: { academicYearId?: number; termId?: number; targetType?: TargetType } = {}
            if (selectedAcademicYear) filters.academicYearId = parseInt(selectedAcademicYear)
            if (selectedTerm) filters.termId = parseInt(selectedTerm)
            if (targetType) filters.targetType = targetType
            
            const data = await feeActions.getAssignments?.(filters) as RawAssignment[] || [];
            setAssignments(data);
        } catch (error: unknown) {
            console.error("Failed to fetch assignments:", error);
            toast.error("Failed to load assignments");
            setAssignments([]);
        } finally {
            setAssignmentsLoading(false);
        }
    };

    const toggleFeeStructure = (id: string) => {
        setSelectedFeeStructures(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        )
    }

    const toggleTarget = (id: string) => {
        setSelectedTargets(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        )
    }

    const handleCreateAssignments = async () => {
        if (selectedFeeStructures.length === 0) {
            toast.error("Please select at least one fee structure")
            return
        }

        if (selectedTargets.length === 0) {
            toast.error("Please select at least one target")
            return
        }

        if (!selectedAcademicYear || !selectedTerm) {
            toast.error("Please select academic year and term")
            return
        }

        setIsSaving(true)
        try {
            const result = await feeActions.bulkCreateAssignments?.({
                feeStructureIds: selectedFeeStructures.map(id => parseInt(id)),
                targetType,
                targetIds: selectedTargets.map(id => parseInt(id)),
                academicYearId: parseInt(selectedAcademicYear),
                termId: parseInt(selectedTerm),
                dueDate: dueDate || undefined,
                notes: notes || undefined
            })

            if (result?.success) {
                toast.success(`Successfully created ${result.created} fee assignments`)
                resetForm()
                fetchData()
                if (activeTab === "history") {
                    fetchAssignments()
                }
            } else {
                toast.error(result?.errors?.join(', ') || 'Failed to create assignments')
            }
        } catch (error: unknown) {
            console.error("Failed to create assignments:", error)
            toast.error("Failed to create fee assignments")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAssignment = async (id: number, assignment: RawAssignment) => {
        try {
            const confirmed = await confirm({
                title: "Delete Fee Assignment",
                description: `Are you sure you want to delete this fee assignment for "${assignment.feeName}"?`,
                confirmText: "Delete",
                variant: "destructive"
            });
            
            if (confirmed) {
                await feeActions.deleteAssignment?.(id)
                toast.success("Fee assignment deleted")
                fetchAssignments()
            }
        } catch (error: unknown) {
            console.error("Failed to delete assignment:", error)
            toast.error("Failed to delete assignment")
        }
    }

    const handleBulkDeleteAssignments = async (type: TargetType, targetId: number, targetName: string) => {
        try {
            const confirmed = await confirm({
                title: "Delete All Fee Assignments",
                description: `Are you sure you want to delete ALL fee assignments for ${targetType} "${targetName}"? This action cannot be undone.`,
                confirmText: "Delete All",
                variant: "destructive"
            });
            
            if (confirmed) {
                const result = await feeActions.bulkDeleteAssignments?.({
                    targetType: type,
                    targetId,
                    academicYearId: selectedAcademicYear ? parseInt(selectedAcademicYear) : undefined,
                    termId: selectedTerm ? parseInt(selectedTerm) : undefined
                });
                
                if (result?.success) {
                    toast.success(`Successfully deleted ${result.deletedCount} fee assignments`)
                    fetchAssignments()
                } else {
                    toast.error("Failed to delete assignments")
                }
            }
        } catch (error: unknown) {
            console.error("Failed to bulk delete assignments:", error)
            toast.error("Failed to delete assignments")
        }
    }

    const resetForm = () => {
        setSelectedFeeStructures([])
        setSelectedTargets([])
        setDueDate("")
        setNotes("")
        setSearchTerm("")
    }

    const totalSelectedAmount = useMemo(() => {
        return selectedFeeStructures.reduce((sum, feeId) => {
            const fee = feeStructures.find(f => f.id.toString() === feeId)
            return sum + (fee?.amount || 0)
        }, 0)
    }, [selectedFeeStructures, feeStructures])

    // Group assignments by class for display
    const groupedAssignments = useMemo(() => {
        const groups: { [key: string]: { targetType: TargetType; targetId: number; groupName: string; assignments: RawAssignment[] } } = {}
        
        assignments.forEach(assignment => {
            let groupKey = 'Ungrouped'
            let groupName = 'Ungrouped'
            
            if (assignment.targetType === 'class' && assignment.className) {
                groupKey = `class-${assignment.targetId}`
                groupName = assignment.className
            } else if (assignment.targetType === 'stream' && assignment.className) {
                groupKey = `class-${assignment.className}`
                groupName = assignment.className
            } else if (assignment.targetType === 'student' && assignment.studentName) {
                groupKey = `student-${assignment.targetId}`
                groupName = assignment.studentName
            } else if (assignment.targetType === 'group' && assignment.groupName) {
                groupKey = `group-${assignment.targetId}`
                groupName = assignment.groupName
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    targetType: assignment.targetType,
                    targetId: assignment.targetId,
                    groupName: groupName,
                    assignments: []
                }
            }
            
            groups[groupKey].assignments.push(assignment)
        })
        
        return Object.values(groups)
    }, [assignments])

    const applicableTargets = useMemo(() => {
        let targets: {
            id: string;
            name: string;
            type: TargetType;
            studentCount?: number;
            memberCount?: number;
            details?: string;
        }[] = []
        
        if (targetType === 'class') {
            targets = classes.map(cls => ({
                id: cls.id.toString(),
                name: cls.name,
                type: 'class',
                studentCount: students.filter(s => s.classId === cls.id).length
            }))
        } else if (targetType === 'stream') {
            targets = streams.map(stream => ({
                id: stream.id.toString(),
                name: `${classes.find(c => c.id === stream.classId)?.name} - ${stream.name}`,
                type: 'stream',
                studentCount: students.filter(s => s.streamId === stream.id).length
            }))
        } else if (targetType === 'student') {
            targets = students.map(student => ({
                id: student.id.toString(),
                name: `${student.firstName} ${student.lastName}`,
                type: 'student',
                details: student.admissionNumber
            }))
        } else if (targetType === 'group') {
            targets = groups.map((group) => ({
                id: (group.targetId || group.id).toString(),
                name: group.name,
                type: 'group',
                memberCount: 0 // Would need to fetch group members
            }))
        }
        
        if (searchTerm) {
            targets = targets.filter(target => 
                target.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        
        return targets
    }, [targetType, classes, streams, students, groups, searchTerm])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
                    <p className="text-sm font-medium text-slate-600 animate-pulse">Loading fee assignments...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 border-b border-emerald-500/20 shadow-xl">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                                <Banknote className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Fee Assignments</h1>
                                <p className="text-emerald-100 text-sm">Manage fee assignments with precision</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
                                onClick={fetchData}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab("assign")}
                            className={cn(
                                "px-6 py-4 text-sm font-medium border-b-2 transition-all",
                                activeTab === "assign"
                                    ? "text-emerald-600 border-emerald-600 bg-emerald-50/50"
                                    : "text-slate-600 border-transparent hover:text-slate-800 hover:bg-slate-50"
                            )}
                        >
                            <Plus className="inline h-4 w-4 mr-2" />
                            Create Assignments
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("history");
                                fetchAssignments();
                            }}
                            className={cn(
                                "px-6 py-4 text-sm font-medium border-b-2 transition-all",
                                activeTab === "history"
                                    ? "text-emerald-600 border-emerald-600 bg-emerald-50/50"
                                    : "text-slate-600 border-transparent hover:text-slate-800 hover:bg-slate-50"
                            )}
                        >
                            <Calendar className="inline h-4 w-4 mr-2" />
                            Assignment History
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    {activeTab === "assign" && (
                        <motion.div
                            key="assign"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                            {/* Configuration Panel */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Academic Year & Term */}
                                <Card className="bg-white border-slate-200/60 shadow-lg hover:shadow-xl transition-shadow">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-slate-900">
                                            <Calendar className="h-5 w-5 text-emerald-600" />
                                            Academic Period
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Academic Year</label>
                                            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                                                <SelectTrigger className="w-full h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500">
                                                    <SelectValue placeholder="Select academic year" />
                                                </SelectTrigger>
                                                <SelectContent className="border-slate-200 shadow-lg">
                                                    {academicYears.map(year => (
                                                        <SelectItem key={year.id} value={year.id.toString()}>
                                                            {year.name} {year.isActive && "(Active)"}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Term</label>
                                            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                                <SelectTrigger className="w-full h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500">
                                                    <SelectValue placeholder="Select term" />
                                                </SelectTrigger>
                                                <SelectContent className="border-slate-200 shadow-lg">
                                                    {terms.map(term => (
                                                        <SelectItem key={term.id} value={term.id.toString()}>
                                                            {term.name} {term.isActive && "(Active)"}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Target Type Selection */}
                                <Card className="bg-white border-slate-200/60 shadow-lg hover:shadow-xl transition-shadow">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-slate-900">
                                            <Target className="h-5 w-5 text-emerald-600" />
                                            Target Type
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-3">
                                            {([
                                                { type: 'class', icon: GraduationCap, label: 'Classes' },
                                                { type: 'stream', icon: Users, label: 'Streams' },
                                                { type: 'student', icon: Users, label: 'Students' },
                                                { type: 'group', icon: Users, label: 'Groups' }
                                            ] as const).map(({ type, icon: Icon, label }) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setTargetType(type as TargetType)}
                                                    className={cn(
                                                        "p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                                                        targetType === type
                                                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md"
                                                            : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                                    )}
                                                >
                                                    <Icon className="h-6 w-6 mb-2 mx-auto" />
                                                    <div className="text-sm font-semibold text-center">{label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Fee Structures Selection */}
                                <Card className="bg-white border-slate-200/60 shadow-lg hover:shadow-xl transition-shadow">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-900">
                                                <Banknote className="h-5 w-5 text-emerald-600" />
                                                Fee Structures
                                            </div>
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                                {selectedFeeStructures.length} selected
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Search fee structures..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {feeStructures.length > 0 ? (
                                                feeStructures.filter(fee => 
                                                    !searchTerm || fee.name.toLowerCase().includes(searchTerm.toLowerCase())
                                                ).map((fee) => {
                                                    const isSelected = selectedFeeStructures.includes(fee.id.toString())
                                                    return (
                                                        <button
                                                            key={fee.id}
                                                            onClick={() => toggleFeeStructure(fee.id.toString())}
                                                            className={cn(
                                                                "w-full text-left p-3 rounded-lg border transition-all duration-200 group",
                                                                isSelected
                                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                                                    : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                                            )}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{fee.name}</div>
                                                                    <div className="text-sm opacity-75">
                                                                        {formatCurrency(fee.amount, profile?.currency)}
                                                                    </div>
                                                                </div>
                                                                {isSelected && <CheckCircle2 className="h-5 w-5 ml-2 flex-shrink-0" />}
                                                            </div>
                                                        </button>
                                                    )
                                                })
                                            ) : (
                                                <div className="text-center py-8 text-slate-500">
                                                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p className="font-medium">No fee structures found</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Targets Selection */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="bg-white border-slate-200/60 shadow-lg hover:shadow-xl transition-shadow">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-900">
                                                <Target className="h-5 w-5 text-emerald-600" />
                                                Select {targetType.charAt(0).toUpperCase() + targetType.slice(1)} Targets
                                            </div>
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                                {selectedTargets.length} selected
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                                            {applicableTargets.map((target) => {
                                                const isSelected = selectedTargets.includes(target.id)
                                                return (
                                                    <button
                                                        key={target.id}
                                                        onClick={() => toggleTarget(target.id)}
                                                        className={cn(
                                                            "p-4 rounded-lg border transition-all duration-200 text-left group relative",
                                                            isSelected
                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                                                : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <div className="font-medium mb-1">{target.name}</div>
                                                            {target.studentCount && (
                                                                <div className="text-xs opacity-75">
                                                                    {target.studentCount} students
                                                                </div>
                                                            )}
                                                            {target.memberCount !== undefined && (
                                                                <div className="text-xs opacity-75">
                                                                    {target.memberCount} members
                                                                </div>
                                                            )}
                                                            {target.details && (
                                                                <div className="text-xs opacity-75">
                                                                    {target.details}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isSelected && (
                                                            <CheckCircle2 className="absolute top-2 right-2 h-4 w-4" />
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Assignment Details */}
                                <Card className="bg-white border-slate-200/60 shadow-lg hover:shadow-xl transition-shadow">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-2 text-slate-900">
                                            <Plus className="h-5 w-5 text-emerald-600" />
                                            Assignment Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Due Date (Optional)</label>
                                            <Input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="w-full h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-2 block">Notes (Optional)</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Add any notes about this assignment..."
                                                className="w-full min-h-[80px] p-3 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                                            />
                                        </div>
                                        
                                        {/* Summary */}
                                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60 rounded-xl p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-600">Total Amount</p>
                                                    <p className="text-2xl font-bold text-emerald-600">
                                                        {formatCurrency(totalSelectedAmount, profile?.currency)}
                                                    </p>
                                                </div>
                                                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                                                    <Banknote className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                                                <div>
                                                    <span className="font-medium">Fee Structures:</span> {selectedFeeStructures.length}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Targets:</span> {selectedTargets.length}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Total Assignments:</span> {selectedFeeStructures.length * selectedTargets.length}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleCreateAssignments}
                                            disabled={isSaving || selectedFeeStructures.length === 0 || selectedTargets.length === 0}
                                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                    Creating Assignments...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-5 w-5 mr-2" />
                                                    Create Fee Assignments
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "history" && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="bg-white border-slate-200/60 shadow-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-slate-900">
                                            <Calendar className="h-5 w-5 text-emerald-600" />
                                            Fee Assignment History
                                        </CardTitle>
                                        <Button 
                                            variant="outline" 
                                            onClick={fetchAssignments}
                                            disabled={assignmentsLoading}
                                            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                                        >
                                            {assignmentsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                            Refresh
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {assignmentsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                                        </div>
                                    ) : assignments.length > 0 ? (
                                        <div className="space-y-4">
                                            {groupedAssignments.map((group, groupIndex) => (
                                                <Card key={groupIndex} className="bg-white border-slate-200/60 shadow-md">
                                                    <CardHeader 
                                                        className="pb-3 cursor-pointer hover:bg-slate-50 transition-colors"
                                                        onClick={() => {
                                                            const element = document.getElementById(`group-${groupIndex}`)
                                                            if (element) {
                                                                element.classList.toggle('hidden')
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                                    {group.targetType === 'class' && <GraduationCap className="h-4 w-4 text-emerald-600" />}
                                                                    {group.targetType === 'stream' && <Users className="h-4 w-4 text-emerald-600" />}
                                                                    {group.targetType === 'student' && <Users className="h-4 w-4 text-emerald-600" />}
                                                                    {group.targetType === 'group' && <Users className="h-4 w-4 text-emerald-600" />}
                                                                </div>
                                                                <div>
                                                                    <CardTitle className="text-lg font-semibold text-slate-900">
                                                                        {group.groupName}
                                                                    </CardTitle>
                                                                    <p className="text-sm text-slate-500 capitalize">
                                                                        {group.targetType} • {group.assignments.length} assignment{group.assignments.length !== 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                                                    {group.assignments.reduce((sum: number, a) => sum + (a.amount || 0), 0).toLocaleString()}
                                                                </Badge>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleBulkDeleteAssignments(group.targetType, group.targetId, group.groupName)
                                                                    }}
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent id={`group-${groupIndex}`} className="pt-0">
                                                        <div className="overflow-x-auto">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-slate-50 border-b">
                                                                        <TableHead className="font-semibold text-slate-700">Fee Structure</TableHead>
                                                                        <TableHead className="font-semibold text-slate-700">Target</TableHead>
                                                                        <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                                                                        <TableHead className="font-semibold text-slate-700">Academic Year</TableHead>
                                                                        <TableHead className="font-semibold text-slate-700">Term</TableHead>
                                                                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                                        <TableHead className="font-semibold text-slate-700">Assigned Date</TableHead>
                                                                        <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {group.assignments.map((assignment: RawAssignment) => (
                                                                        <TableRow key={assignment.id} className="border-b hover:bg-slate-50">
                                                                            <TableCell className="p-4">
                                                                                <div className="font-medium text-slate-900">{assignment.feeName}</div>
                                                                                <div className="text-sm text-slate-500">
                                                                                    {formatCurrency(assignment.amount, profile?.currency)}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="p-4">
                                                                                <div className="font-medium text-slate-900">
                                                                                    {assignment.className || assignment.streamName || assignment.studentName || assignment.groupName || 'Unknown'}
                                                                                </div>
                                                                                <div className="text-sm text-slate-500 capitalize">{assignment.targetType}</div>
                                                                            </TableCell>
                                                                            <TableCell className="p-4">
                                                                                <div className="font-bold text-emerald-600">
                                                                                    {formatCurrency(assignment.amount, profile?.currency)}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="p-4 text-sm text-slate-600">
                                                                                {assignment.academicYearName || '-'}
                                                                            </TableCell>
                                                                            <TableCell className="p-4 text-sm text-slate-600">
                                                                                {assignment.termName || '-'}
                                                                            </TableCell>
                                                                            <TableCell className="p-4">
                                                                                <Badge variant={assignment.status === 'Active' ? 'default' : 'secondary'} 
                                                                                    className={assignment.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : ''}>
                                                                                    {assignment.status}
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="p-4 text-sm text-slate-500">
                                                                                {new Date(assignment.createdAt).toLocaleDateString()}
                                                                            </TableCell>
                                                                            <TableCell className="p-4 text-right">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleDeleteAssignment(assignment.id, assignment)}
                                                                                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p className="font-medium text-lg">No fee assignments found</p>
                                            <p className="text-sm opacity-75">Create your first fee assignment to see it here</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default function NewFeeAssignmentsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        }>
            <FeeAssignmentsContent />
        </Suspense>
    )
}
