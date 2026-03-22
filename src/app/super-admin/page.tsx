"use client"
export const runtime = 'edge';

import { useEffect, useState } from "react"
import { 
    LayoutDashboard, 
    School, 
    Users, 
    Settings, 
    Plus, 
    Search,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { invokeIPC } from "@/lib/electron"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"

import { CreateSchoolModal } from "@/components/super-admin/create-school-modal"

export default function SuperAdminDashboard() {
    const [schools, setSchools] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const router = useRouter()

    const fetchSchools = async () => {
        setIsLoading(true);
        try {
            const data = await invokeIPC<any[]>('get-all-schools');
            if (data) setSchools(data);
        } catch (error) {
            console.error("Failed to fetch schools:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, [])

    const handleCreateSchool = () => {
        setIsModalOpen(true);
    };

    const handleCreateSuccess = (slug?: string) => {
        setIsModalOpen(false);
        if (slug) {
            router.push(`/${slug}/setup`);
        } else {
            fetchSchools();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-slate-300 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">SN</div>
                    <span className="font-bold text-white tracking-tight">Super Admin</span>
                </div>
                
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl flex items-center gap-3 font-bold border border-emerald-500/20">
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </div>
                    <div className="hover:bg-slate-800 p-3 rounded-xl flex items-center gap-3 font-medium transition-colors cursor-pointer">
                        <School className="h-5 w-5" />
                        Schools
                    </div>
                    <div className="hover:bg-slate-800 p-3 rounded-xl flex items-center gap-3 font-medium transition-colors cursor-pointer">
                        <Users className="h-5 w-5" />
                        Administrators
                    </div>
                    <div className="hover:bg-slate-800 p-3 rounded-xl flex items-center gap-3 font-medium transition-colors cursor-pointer">
                        <Settings className="h-5 w-5" />
                        Settings
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
                    <h1 className="font-bold text-slate-900 text-lg">Platform Overview</h1>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" className="rounded-xl border-slate-200">
                            Log Out
                        </Button>
                    </div>
                </header>

                <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: "Total Schools", value: "24", icon: School, color: "text-blue-500", bg: "bg-blue-50" },
                            { label: "Active Students", value: "14,500", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
                            { label: "Active Revenue", value: "$45,200", icon: LayoutDashboard, color: "text-purple-500", bg: "bg-purple-50" },
                            { label: "System Uptime", value: "99.9%", icon: CheckCircle2, color: "text-orange-500", bg: "bg-orange-50" },
                        ].map((stat, idx) => (
                            <Card key={idx} className="p-6 rounded-3xl border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                                        <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                                    </div>
                                    <div className={cn("p-2 rounded-xl", stat.bg)}>
                                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Schools Table */}
                    <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="font-bold text-slate-900">Manage Schools</h2>
                                <p className="text-xs text-slate-500">View and manage all tenant schools on the platform</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input placeholder="Search schools..." className="pl-10 h-10 w-64 rounded-xl bg-slate-50 border-slate-200" />
                                </div>
                                <Button 
                                    onClick={handleCreateSchool}
                                    className="bg-emerald-500 hover:bg-emerald-600 rounded-xl gap-2 font-bold"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add School
                                </Button>
                            </div>
                        </div>

                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-700">School Name</TableHead>
                                    <TableHead className="font-bold text-slate-700">Slug / Subdomain</TableHead>
                                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                                    <TableHead className="font-bold text-slate-700">Created</TableHead>
                                    <TableHead className="font-bold text-slate-700">Students</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                            Loading schools...
                                        </TableCell>
                                    </TableRow>
                                ) : schools.map((school) => (
                                    <TableRow key={school.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-bold text-slate-900">{school.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <code className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 w-fit">
                                                    /{school.slug}
                                                </code>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {school.slug}.schoolnexuspro.pages.dev
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={school.status === 'Active' ? 'default' : 'secondary'} 
                                                className={cn(
                                                    "rounded-full px-3 py-0.5 font-bold text-[10px]",
                                                    school.status === 'Active' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : 
                                                    school.status === 'Pending Setup' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                                                    "bg-slate-100 text-slate-600"
                                                )}>
                                                {school.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs">{new Date(school.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium text-slate-700">{school.students || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                                <MoreVertical className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </main>
            </div>

            <CreateSchoolModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={handleCreateSuccess} 
            />
        </div>
    )
}
