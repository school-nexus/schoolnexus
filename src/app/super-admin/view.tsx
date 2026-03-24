"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { School, Users, ShieldCheck, Plus, ExternalLink, Loader2, Check, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from "next/navigation"
import { invokeIPC } from "@/lib/electron";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function SuperAdminView() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const activeTab = searchParams.get('tab') || 'schools'
    const [stats, setStats] = useState({ totalSchools: 0, activeUsers: 0, systemStatus: 'Healthy' })
    const [recentSchools, setRecentSchools] = useState<any[]>([])
    const [registrationRequests, setRegistrationRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)
    const [registerLoading, setRegisterLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        status: 'Active'
    })

    const refreshData = async () => {
        setLoading(true);
        try {
            const [platformStats, schools, requests] = await Promise.all([
                invokeIPC<any>('get-platform-stats'),
                invokeIPC<any[]>('get-recent-schools'),
                invokeIPC<any[]>('get-registration-requests')
            ]);
            if (platformStats) setStats(platformStats);
            if (schools) setRecentSchools(schools);
            if (requests) setRegistrationRequests(requests);
        } catch (error) {
            console.error("Failed to fetch super admin data:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleApproveRequest = async (schoolId: number) => {
        try {
            await invokeIPC('update-registration-status', { schoolId, status: 'Active' });
            toast.success("School registration approved!");
            refreshData();
        } catch (error) {
            toast.error("Failed to approve school.");
        }
    }

    const handleRejectRequest = async (schoolId: number) => {
        try {
            await invokeIPC('update-registration-status', { schoolId, status: 'Rejected' });
            toast.success("School registration rejected!");
            refreshData();
        } catch (error) {
            toast.error("Failed to reject school.");
        }
    }

    useEffect(() => {
        refreshData();
    }, [])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterLoading(true);
        try {
            await invokeIPC('create-school', formData);
            toast.success("School registered successfully!");
            setIsRegisterOpen(false);
            setFormData({ name: '', slug: '', status: 'Active' });
            refreshData();
        } catch (error) {
            toast.error("Failed to register school.");
            console.error(error);
        } finally {
            setRegisterLoading(false);
        }
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Platform Overview</h1>
                    <p className="text-slate-500 font-medium">Manage all schools and system settings from one place.</p>
                </div>
                
                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Register New School
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-black text-xl">Register New Institution</DialogTitle>
                            <DialogDescription className="font-medium">
                                Create a new school shell. You'll be able to configure detailed profiles later.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleRegister} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="font-bold">School Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="e.g. Green Valley High" 
                                    className="rounded-xl border-slate-200"
                                    value={formData.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
                                        setFormData({ ...formData, name, slug });
                                    }}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug" className="font-bold">URL Slug (unique)</Label>
                                <div className="relative">
                                    <Input 
                                        id="slug" 
                                        placeholder="green-valley" 
                                        className="rounded-xl border-slate-200 pl-8"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        required
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">/</span>
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button 
                                    type="submit" 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl w-full h-12"
                                    disabled={registerLoading}
                                >
                                    {registerLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Complete Registration"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Schools", value: stats.totalSchools.toString(), icon: School, color: "text-blue-600", bg: "bg-blue-100" },
                    { label: "Active Users", value: stats.activeUsers.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
                    { label: "System Status", value: stats.systemStatus, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-100" }
                ].map((stat, i) => (
                    <Card key={i} className="border-0 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-200" /> : stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {activeTab === 'requests' ? (
                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-black text-slate-900">Registration Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">School Name</th>
                                        <th className="px-6 py-4">Slug</th>
                                        <th className="px-6 py-4">Request Date</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
                                                Loading pending requests...
                                            </td>
                                        </tr>
                                    ) : registrationRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                                <div className="bg-slate-50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                                    <Check className="w-8 h-8 text-emerald-400" />
                                                </div>
                                                No pending registration requests.
                                            </td>
                                        </tr>
                                    ) : (
                                        registrationRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">{req.name}</td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.slug}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold"
                                                        onClick={() => handleApproveRequest(req.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="text-red-600 hover:text-red-700 font-bold border-red-200"
                                                        onClick={() => handleRejectRequest(req.id)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-black text-slate-900">Recent Schools</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">School Name</th>
                                        <th className="px-6 py-4">Slug</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
                                                Loading school registry...
                                            </td>
                                        </tr>
                                    ) : recentSchools.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                                No institutions registered yet.
                                            </td>
                                        </tr>
                                    ) : recentSchools.map((school, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900">{school.name}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                                <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{school.slug}</code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${school.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {school.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    className="text-emerald-600 font-bold hover:bg-emerald-50 flex items-center justify-end w-full gap-2"
                                                    onClick={() => window.open(`/${school.slug}`, '_blank')}
                                                >
                                                    Dashboard <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
