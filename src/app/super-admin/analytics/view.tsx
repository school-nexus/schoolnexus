"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, Users, School, Activity, ShieldCheck, Loader2 } from 'lucide-react';
import { invokeIPC } from "@/lib/electron";

export default function AnalyticsView() {
    const [stats, setStats] = useState({ totalSchools: 0, activeUsers: 0, systemStatus: 'Healthy' })
    const [planStats, setPlanStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        setLoading(true)
        try {
            const [platformStats, usageStats] = await Promise.all([
                invokeIPC<any>('get-platform-stats'),
                invokeIPC<any[]>('get-plan-usage-stats')
            ])
            if (platformStats) setStats(platformStats)
            if (usageStats) setPlanStats(usageStats)
        } catch (error) {
            console.error("Failed to fetch analytics:", error)
        } finally {
            setLoading(false)
        }
    }

    const totalRevenue = planStats.reduce((sum, plan) => sum + (plan.price * plan.count), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Platform Analytics</h1>
                    <p className="text-slate-500 font-medium">Global KPIs covering acquisition, active users, and revenue.</p>
                </div>
                <Button className="font-bold rounded-xl flex items-center gap-2" variant="outline" disabled={loading}>
                    <Download className="w-4 h-4" /> Export Report
                </Button>
            </div>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                    <p className="font-medium animate-pulse">Aggregating platform metrics...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-indigo-100 font-bold mb-1 uppercase tracking-wider text-xs">Total MRR</p>
                                        <h3 className="text-3xl font-black">UGX {(totalRevenue / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                                    </div>
                                    <div className="p-3 bg-white/20 rounded-xl"><Activity className="w-6 h-6 text-white" /></div>
                                </div>
                                <div className="mt-4 text-sm font-medium text-indigo-100 flex items-center gap-2">
                                    <span className="text-emerald-300 font-bold">+12%</span> vs last month
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-xs">Total Institutions</p>
                                        <h3 className="text-3xl font-black text-slate-900">{stats.totalSchools}</h3>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-xl"><School className="w-6 h-6 text-blue-600" /></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-xs">Active Users</p>
                                        <h3 className="text-3xl font-black text-slate-900">{stats.activeUsers}</h3>
                                    </div>
                                    <div className="p-3 bg-fuchsia-100 rounded-xl"><Users className="w-6 h-6 text-fuchsia-600" /></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-xs">System Health</p>
                                        <h3 className="text-2xl mt-1 font-black text-slate-900">{stats.systemStatus}</h3>
                                    </div>
                                    <div className="p-3 bg-emerald-100 rounded-xl"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-lg font-black text-slate-900">Subscription Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {planStats.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 font-medium">No active subscriptions to display.</div>
                                ) : (
                                    <div className="space-y-6 mt-4">
                                        {planStats.map(plan => {
                                            const percentage = stats.totalSchools > 0 ? (plan.count / stats.totalSchools) * 100 : 0;
                                            return (
                                                <div key={plan.name}>
                                                    <div className="flex justify-between text-sm font-bold mb-2">
                                                        <span className="text-slate-700">{plan.name}</span>
                                                        <span className="text-slate-500">{plan.count} schools ({percentage.toFixed(0)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div 
                                                            className={`h-3 rounded-full ${plan.name.includes('Pro') ? 'bg-fuchsia-500' : 'bg-blue-500'}`} 
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-lg font-black text-slate-900">Revenue by Plan (Termly)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {planStats.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 font-medium">No revenue to display.</div>
                                ) : (
                                    <div className="space-y-6 mt-4">
                                        {planStats.map(plan => {
                                            const planRev = plan.price * plan.count;
                                            const percentage = totalRevenue > 0 ? (planRev / totalRevenue) * 100 : 0;
                                            return (
                                                <div key={plan.name}>
                                                    <div className="flex justify-between text-sm font-bold mb-2">
                                                        <span className="text-slate-700">{plan.name}</span>
                                                        <span className="text-emerald-600">UGX {planRev.toLocaleString()}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div 
                                                            className={`h-3 rounded-full bg-emerald-500`} 
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
