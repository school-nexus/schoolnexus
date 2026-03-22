"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Zap, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';

export default function SubscriptionsView() {
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchPlans() {
            try {
                const [allPlans, usageStats] = await Promise.all([
                    (window as any).electron.ipcRenderer.invoke('get-subscription-plans'),
                    (window as any).electron.ipcRenderer.invoke('get-plan-usage-stats')
                ]);

                if (usageStats) {
                    setPlans(usageStats);
                } else if (allPlans) {
                    setPlans(allPlans.map((p: any) => ({
                        name: p.name,
                        price: p.termlyPrice,
                        count: 0
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch subscription data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPlans();
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Subscription Plans</h1>
                    <p className="text-slate-500 font-medium">Manage and configure pricing models for all institutions.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2">
                    <Zap className="w-5 h-5" /> New Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <Card key={i} className="border-0 shadow-sm rounded-2xl overflow-hidden animate-pulse">
                            <CardContent className="p-8 h-32 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                            </CardContent>
                        </Card>
                    ))
                ) : plans.length === 0 ? (
                    <div className="col-span-3 p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium">
                        No subscription plans configured in the database.
                    </div>
                ) : plans.map((plan, i) => (
                    <Card key={i} className="border-0 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">{plan.name} Plan</CardTitle>
                            <CreditCard className={`w-5 h-5 ${i === 0 ? 'text-blue-600' : i === 1 ? 'text-emerald-600' : 'text-purple-600'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">
                                {typeof plan.price === 'number' ? `UGX ${plan.price.toLocaleString()}` : plan.price}
                                <span className="text-sm text-slate-400 font-bold ml-1">/term</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 font-medium">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {plan.count} {plan.count === 1 ? 'School' : 'Schools'} Active
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="text-lg font-black text-slate-900">Recent Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-10 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <TrendingUp className="w-16 h-16 text-emerald-300" />
                        <p className="text-slate-500 font-medium">Subscription revenue analytics and charts will be connected in the next phase.</p>
                        <Button variant="outline" className="mt-4 font-bold rounded-xl cursor-not-allowed opacity-50">View Full Report</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
