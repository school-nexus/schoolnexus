"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { ArrowUpRight, Calendar, CheckCircle2, CreditCard, LayoutDashboard, Loader2, LogOut, Plus, SchoolIcon, Search, Settings, TrendingUp, Users, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { invokeIPC } from "@/lib/electron"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
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

export default function SuperAdminSubscriptions() {
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [plans, setPlans] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subsData, plansData] = await Promise.all([
                    invokeIPC<any[]>('get-all-schools'), // For now, we fetch schools and then their subs
                    invokeIPC<any[]>('get-subscription-plans')
                ]);
                
                // Enhance schools with subscription info
                const enhancedSubs = await Promise.all(subsData.map(async (school) => {
                    const sub = await invokeIPC<any>('get-school-subscription', school.id);
                    return { ...school, subscription: sub?.[0] };
                }));

                setSubscriptions(enhancedSubs);
                setPlans(plansData || [
                    { id: 1, name: "Basic", termlyPrice: 200000, annualPrice: 500000, studentLimit: 250 },
                    { id: 2, name: "Pro", termlyPrice: 500000, annualPrice: 1200000, studentLimit: -1 }
                ]);
            } catch (error) {
                console.error("Failed to fetch subscription data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [])

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar (Abstracted version) */}
            <div className="w-64 bg-slate-900 text-white flex flex-col p-6 gap-8">
                <div className="flex items-center gap-2">
                    <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-xl">SN</div>
                    <span className="font-bold text-lg tracking-tight">Super Admin</span>
                </div>
                
                <nav className="flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start gap-3 hover:bg-slate-800 text-slate-300">
                        <LayoutDashboard className="h-5 w-5" /> Dashboard
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 hover:bg-slate-800 text-slate-300">
                        <SchoolIcon className="h-5 w-5" /> Schools
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                        <CreditCard className="h-5 w-5" /> Subscriptions
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 hover:bg-slate-800 text-slate-300">
                        <Users className="h-5 w-5" /> Administrators
                    </Button>
                    <Button variant="ghost" className="justify-start gap-3 hover:bg-slate-800 text-slate-300">
                        <Settings className="h-5 w-5" /> Settings
                    </Button>
                </nav>

                <div className="mt-auto">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-500">
                        <LogOut className="h-5 w-5" /> Log Out
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Subscription Management</h1>
                            <p className="text-slate-500 mt-2">Manage billing cycles and school tiers</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="rounded-xl border-slate-200">Export Billing</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">Manage Plans</Button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                                        <h3 className="text-2xl font-bold text-slate-900">UGX 12.4M</h3>
                                    </div>
                                    <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                                    <ArrowUpRight className="h-3 w-3" /> +15% from last term
                                </div>
                            </CardContent>
                        </Card>
                        {/* Repeat for other stats... */}
                    </div>

                    {/* Table View */}
                    <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="border-b border-slate-50 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-slate-900">Active Subscriptions</CardTitle>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input placeholder="Search schools..." className="pl-10 h-10 w-64 rounded-xl bg-slate-50 border-slate-200" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-12 flex justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead className="px-8 font-bold">School Name</TableHead>
                                            <TableHead className="font-bold">Plan</TableHead>
                                            <TableHead className="font-bold">Cycle</TableHead>
                                            <TableHead className="font-bold">Status</TableHead>
                                            <TableHead className="font-bold">Renewal Date</TableHead>
                                            <TableHead className="text-right px-8 font-bold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subscriptions.map((school) => (
                                            <TableRow key={school.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="px-8 font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{school.name}</span>
                                                        <span className="text-xs text-slate-400">@{school.slug}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-md px-2 py-0.5",
                                                        school.subscription?.planId === 2 ? "bg-purple-100 text-purple-700 hover:bg-purple-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                                    )}>
                                                        {school.subscription?.planId === 2 ? "Pro" : "Basic"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="capitalize text-slate-600">{school.subscription?.billingCycle || 'Termly'}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Active
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-slate-400" />
                                                        {school.subscription?.endDate ? new Date(school.subscription.endDate).toLocaleDateString() : 'May 12, 2024'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-8">
                                                    <Button variant="ghost" size="sm" className="hover:bg-emerald-50 text-emerald-600">Upgrade</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
