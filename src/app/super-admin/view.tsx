"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { School, Users, ShieldCheck, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { useRouter } from "next/navigation"

export default function SuperAdminView() {
    const router = useRouter()
    const [stats, setStats] = useState({ totalSchools: 0, activeUsers: 0, systemStatus: 'Healthy' })
    const [recentSchools, setRecentSchools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const [platformStats, schools] = await Promise.all([
                    (window as any).electron.ipcRenderer.invoke('get-platform-stats'),
                    (window as any).electron.ipcRenderer.invoke('get-recent-schools')
                ]);
                if (platformStats) setStats(platformStats);
                if (schools) setRecentSchools(schools);
            } catch (error) {
                console.error("Failed to fetch super admin data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [])
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Platform Overview</h1>
                    <p className="text-slate-500 font-medium">Manage all schools and system settings from one place.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Register New School
                </Button>
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

            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
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
        </div>
    )
}
