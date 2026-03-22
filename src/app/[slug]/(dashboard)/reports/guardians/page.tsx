"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    Filter,
    Download,
    Users,
    Phone,
    Mail,
    MoreHorizontal,
    FileSpreadsheet,
    UserCircle,
    Loader2
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { guardianActions } from "@/lib/electron"
import { toast } from "sonner"
import { reportUtils } from "@/lib/report-utils"

interface Guardian {
    id: number
    fullName: string
    relationship: string
    phone: string | null
    email: string | null
    occupation: string | null
    studentName: string | null
}

export default function GuardianReportsPage() {
    const [guardians, setGuardians] = useState<Guardian[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRelationship, setSelectedRelationship] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 20

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const data = await guardianActions.getAll() as Guardian[]
            setGuardians(data)
        } catch (error: unknown) {
            console.error("Failed to fetch guardians:", error)
            toast.error("Failed to load guardian data")
        } finally {
            setLoading(false)
        }
    }

    const filteredGuardians = guardians.filter(g => {
        const matchesSearch =
            g.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.phone?.includes(searchQuery) ||
            g.studentName?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesRelationship = selectedRelationship === "all" || g.relationship === selectedRelationship

        return matchesSearch && matchesRelationship
    })

    const totalPages = Math.ceil(filteredGuardians.length / ITEMS_PER_PAGE)
    const currentGuardians = filteredGuardians.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const relationshipCounts = guardians.reduce((acc: Record<string, number>, g) => {
        acc[g.relationship] = (acc[g.relationship] || 0) + 1
        return acc
    }, {})

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
                        title="Guardian Reports"
                        description="View and manage parent/guardian contact information and relationships."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Reports", href: "/reports" },
                            { label: "Guardians" },
                        ]}
                    />
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-11 rounded-xl shadow-sm"
                            onClick={() => reportUtils.exportToExcel({
                                filename: "Guardian_Report",
                                columns: [
                                    { header: "Full Name", dataKey: "fullName" },
                                    { header: "Relationship", dataKey: "relationship" },
                                    { header: "Phone", dataKey: "phone" },
                                    { header: "Email", dataKey: "email" },
                                    { header: "Occupation", dataKey: "occupation" },
                                ],
                                data: filteredGuardians as unknown as Record<string, unknown>[]
                            })}
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02]"
                            onClick={() => reportUtils.exportToPDF({
                                title: "Guardian Information Report",
                                subtitle: `Generated for ${filteredGuardians.length} guardians`,
                                filename: "Guardian_Report",
                                columns: [
                                    { header: "Full Name", dataKey: "fullName" },
                                    { header: "Relationship", dataKey: "relationship" },
                                    { header: "Phone", dataKey: "phone" },
                                    { header: "Email", dataKey: "email" },
                                ],
                                data: filteredGuardians as unknown as Record<string, unknown>[]
                            })}
                        >
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                </div>

                {/* Quick Stats Removed as requested */}

                {/* Filter Section */}
                <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/90 backdrop-blur-xl ring-1 ring-slate-200/50 mb-6">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, student, email..."
                                className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 justify-between">
                                        <div className="flex items-center">
                                            <Filter className="mr-2 h-4 w-4 text-emerald-500" />
                                            <span>Relationship: {selectedRelationship === "all" ? "All" : selectedRelationship}</span>
                                        </div>
                                        <MoreHorizontal className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 rounded-xl">
                                    <DropdownMenuItem onClick={() => setSelectedRelationship("all")}>All Relationships</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setSelectedRelationship("Father")}>Father</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedRelationship("Mother")}>Mother</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedRelationship("Guardian")}>Guardian</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedRelationship("Other")}>Other</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex items-center justify-end text-sm text-slate-500">
                            Showing {currentGuardians.length} of {filteredGuardians.length} guardians
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="font-bold text-white h-14 border-r border-emerald-500/30">Guardian</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Relationship</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Student</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Contact Info</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Occupation</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentGuardians.length > 0 ? currentGuardians.map((guardian, idx) => (
                                        <TableRow key={guardian.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">{guardian.fullName}</TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                    guardian.relationship === 'Father' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                        guardian.relationship === 'Mother' ? "bg-pink-50 text-pink-700 border-pink-100" :
                                                            "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                )}>
                                                    {guardian.relationship}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-sm text-slate-600">{guardian.studentName || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 border-r border-emerald-100/50">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Phone className="h-3 w-3 text-slate-400" />
                                                        {guardian.phone || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        {guardian.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 border-r border-emerald-100/50">{guardian.occupation || 'N/A'}</TableCell>
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
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <Users className="mr-2 h-4 w-4 text-emerald-600" />
                                                            View Students
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <Mail className="mr-2 h-4 w-4 text-blue-600" />
                                                            Send Message
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer text-slate-600">
                                                            <UserCircle className="mr-2 h-4 w-4" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-400 border-emerald-100/50">
                                                No guardians found. Add student guardians to see them here.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-100 mt-6 font-sans">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                            <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredGuardians.length)}</span> of{" "}
                            <span className="font-medium">{filteredGuardians.length}</span> results
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg h-9"
                            >
                                Previous
                            </Button>
                            {[...Array(totalPages)].map((_, i) => (
                                <Button
                                    key={i + 1}
                                    variant={currentPage === i + 1 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={cn(
                                        "rounded-lg w-9 h-9 p-0",
                                        currentPage === i + 1 ? "bg-emerald-600 hover:bg-emerald-700" : ""
                                    )}
                                >
                                    {i + 1}
                                </Button>
                            )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg h-9"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

