"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowDownRight, ArrowUpRight, BarChart3, Calendar, ChevronRight, CreditCard, Download, Loader2, PieChart, Plus, Receipt, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { expenseActions, incomeActions, feeActions, studentActions, teacherActions, payrollActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
}

interface Expense {
    id: number
    description: string
    amount: number
    category: string
    date: string
}

interface Income {
    id: number
    source: string | null
    amount: number
    date: string
    category: string
}

interface RawStudent {
    id: number
    firstName: string
    lastName: string
}

interface RawTeacher {
    id: number
    fullName: string
}

interface Payment {
    id: number
    amount: number
}

interface PayrollStats {
    monthlyTotal: number
    activeStaffCount: number
}

interface RawProfile {
    currency: string
    name: string
}

interface DashboardStats {
    totalIncome: number
    totalExpenses: number
    feeCollected: number
    netBalance: number
    studentCount: number
    teacherCount: number
    payrollTotal: number
    staffOnPayroll: number
    recentExpenses: Expense[]
    recentIncome: Income[]
}

export default function AccountsDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        totalIncome: 0,
        totalExpenses: 0,
        feeCollected: 0,
        netBalance: 0,
        studentCount: 0,
        teacherCount: 0,
        payrollTotal: 0,
        staffOnPayroll: 0,
        recentExpenses: [],
        recentIncome: [],
    })
    const [profile, setProfile] = useState<RawProfile | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [expenses, income, payments, students, teachers, payrollStats, profileData] = await Promise.all([
                expenseActions.getAll() as Promise<Expense[]>,
                incomeActions.getAll() as Promise<Income[]>,
                feeActions.getAllPayments() as Promise<Payment[]>,
                studentActions.getAll() as Promise<RawStudent[]>,
                teacherActions.getAll() as Promise<RawTeacher[]>,
                payrollActions.getStats() as Promise<PayrollStats>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])

            const totalExpenses = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0)
            const totalIncome = income.reduce((sum: number, i: Income) => sum + i.amount, 0)
            const feeCollected = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0)

            setStats({
                totalIncome: totalIncome + feeCollected,
                totalExpenses,
                feeCollected,
                netBalance: (totalIncome + feeCollected) - totalExpenses,
                studentCount: students.length,
                teacherCount: teachers.length,
                payrollTotal: payrollStats?.monthlyTotal || 0,
                staffOnPayroll: payrollStats?.activeStaffCount || 0,
                recentExpenses: expenses.slice(0, 5),
                recentIncome: income.slice(0, 5)
            })
            setProfile(profileData)
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => amount.toLocaleString()

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600 opacity-20" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse">Syncing financial data...</p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            Financial Dashboard
                        </h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Institutional Liquidity & Payroll Intelligence</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="h-10 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold px-4">
                            <Download className="mr-2 h-3.5 w-3.5" /> Export PDF
                        </Button>
                        <Link href="/accounts/expenses">
                            <Button className="h-10 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold px-4 shadow-lg active:scale-95 transition-all">
                                <Plus className="mr-2 h-3.5 w-3.5" /> Log Expenditure
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Hero Financial Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div variants={item} className="lg:col-span-2">
                        <div className="relative overflow-hidden group bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-[32px] p-8 text-white shadow-2xl shadow-emerald-900/20 ring-1 ring-white/10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10 shadow-xl">
                                            <Wallet className="h-6 w-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Institutional Net Position</p>
                                            <h2 className="text-sm font-bold text-slate-300">Verified Liquid Assets</h2>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-3 py-1 font-black text-[10px] tracking-wider">LIVE DATA</Badge>
                                </div>
                                <div className="mt-8 mb-4">
                                    <p className="text-5xl font-black tracking-tighter text-white">
                                        <span className="text-2xl text-emerald-500/50 mr-2">{profile?.currency || 'UGX'}</span>
                                        {formatCurrency(stats.netBalance)}
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fee Inflow</p>
                                        <p className="text-sm font-black text-white">{formatCurrency(stats.feeCollected)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Staff Payroll</p>
                                        <p className="text-sm font-black text-white text-rose-400">-{formatCurrency(stats.payrollTotal)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Other Income</p>
                                        <p className="text-sm font-black text-emerald-400">+{formatCurrency(stats.totalIncome - stats.feeCollected)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="space-y-6">
                        <StatCard
                            title="Total Revenue (All Channels)"
                            value={`${formatCurrency(stats.totalIncome)}`}
                            variant="gradient"
                            icon={<ArrowUpRight className="h-5 w-5" />}
                            iconColor="bg-emerald-500"
                            className="bg-white border-none shadow-xl shadow-slate-200/50"
                            trend={{ value: 12.5, isPositive: true }}
                        />
                        <StatCard
                            title="Operational Expenditures"
                            value={`${formatCurrency(stats.totalExpenses)}`}
                            variant="gradient"
                            icon={<ArrowDownRight className="h-5 w-5" />}
                            iconColor="bg-rose-500"
                            className="bg-white border-none shadow-xl shadow-slate-200/50"
                            trend={{ value: 4.2, isPositive: false }}
                        />
                    </div>
                </div>

                {/* Secondary Stats: Fees & Payroll */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Payroll Insight */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <StatCard
                            title="Monthly Payroll Commitment"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats.payrollTotal)}`}
                            variant="gradient"
                            icon={<CreditCard className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
                            className="shadow-amber-200/50"
                            change={`For ${stats.staffOnPayroll} Staff Members`}
                        />
                    </motion.div>

                    {/* Fee Collection Insight */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <StatCard
                            title="Total Termly Fees Collected"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats.feeCollected)}`}
                            variant="gradient"
                            icon={<Receipt className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-teal-500 to-cyan-600"
                            className="shadow-teal-200/50"
                            change={`From ${stats.studentCount} Students`}
                        />
                    </motion.div>
                </div>

                {/* Ledger Snapshots */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Revenue Snapshot */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white ring-1 ring-slate-200/50 overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100/80 p-5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                                            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </div>
                                            Revenue Ledger
                                        </CardTitle>
                                        <CardDescription className="text-[11px] font-medium text-slate-400">Latest 5 non-fee income records</CardDescription>
                                    </div>
                                    <Link href="/accounts/income">
                                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold rounded-lg text-[10px] uppercase tracking-wider px-2 h-8">View All</Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-50">
                                    {stats.recentIncome.length > 0 ? (
                                        stats.recentIncome.map((item: Income, idx: number) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + (idx * 0.1) }}
                                                className="flex items-center justify-between p-4 hover:bg-emerald-50/50 transition-colors cursor-pointer group border-b border-slate-50 last:border-none"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                                        {(item.source || 'IN').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                                                            {item.source || 'Standard Revenue'}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-emerald-600 tracking-tighter">+{profile?.currency || 'UGX'} {formatCurrency(item.amount)}</p>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase">Verified</span>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-20 flex flex-col items-center gap-3 opacity-30">
                                            <BarChart3 className="h-12 w-12 text-slate-300" />
                                            <p className="font-bold text-slate-400 text-sm tracking-widest uppercase">Null Records</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Expense Ledger Snapshot */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white ring-1 ring-slate-200/50 overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b border-slate-100/80 p-5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                                            <div className="h-7 w-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                                                <ArrowDownRight className="h-3.5 w-3.5" />
                                            </div>
                                            Expense Ledger
                                        </CardTitle>
                                        <CardDescription className="text-[11px] font-medium text-slate-400">Latest 5 operational expenditures</CardDescription>
                                    </div>
                                    <Link href="/accounts/expenses">
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold rounded-lg text-[10px] uppercase tracking-wider px-2 h-8">View All</Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-50">
                                    {stats.recentExpenses.length > 0 ? (
                                        stats.recentExpenses.map((item: Expense, idx: number) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + (idx * 0.1) }}
                                                className="flex items-center justify-between p-4 hover:bg-rose-50/50 transition-colors cursor-pointer group border-b border-slate-50 last:border-none"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                                        {(item.description || 'EX').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-rose-700 transition-colors leading-tight">
                                                            {item.description || 'General Expense'}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.category} • {item.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-rose-600 tracking-tighter">-{profile?.currency || 'UGX'} {formatCurrency(item.amount)}</p>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase">Audited</span>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-20 flex flex-col items-center gap-3 opacity-30">
                                            <BarChart3 className="h-12 w-12 text-slate-300" />
                                            <p className="font-bold text-slate-400 text-sm tracking-widest uppercase">Null Records</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}


