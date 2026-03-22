"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Zap, CheckCircle2, TrendingUp } from 'lucide-react';

export default function SubscriptionsView() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Subscription Plans</h1>
                    <p className="text-slate-500 font-medium">Manage and configure pricing models for all institutions.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2">
                    <Zap className="w-5 h-5" /> New Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { name: "Basic", price: "$99/mo", active: "5 Schools", color: "text-blue-600" },
                    { name: "Professional", price: "$249/mo", active: "6 Schools", color: "text-emerald-600" },
                    { name: "Enterprise", price: "Custom", active: "1 School", color: "text-purple-600" }
                ].map((plan, i) => (
                    <Card key={i} className="border-0 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">{plan.name} Plan</CardTitle>
                            <CreditCard className={`w-5 h-5 ${plan.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{plan.price}</div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 font-medium">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {plan.active}
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
                        <p className="text-slate-500 font-medium">Subscription revenue analytics and charts will appear here.</p>
                        <Button variant="outline" className="mt-4 font-bold rounded-xl">View Full Report</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
