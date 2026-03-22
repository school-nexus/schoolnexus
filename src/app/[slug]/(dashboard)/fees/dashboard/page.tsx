"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Download,
    DollarSign,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
    Calendar,
    FileSpreadsheet,
    Loader2,
    Eye,
    Receipt,
    CreditCard,
    Banknote,
    Smartphone,
    ArrowRight,
    Clock,
    User
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { feeActions, expenseActions, incomeActions, studentActions, dashboardActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getPaymentMethodInfo } from "@/lib/constants"

interface Student {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
}

interface Payment {
    id: number
    studentId: number
    amount: number
    date: string
    paymentMethod: string
    receiptNumber?: string
    feeStructureId?: number
}

interface DashboardStats {
    totalRevenue: number
    pendingFees: number
    totalExpenses: number
}

interface RawDebtor {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
    balance: number
}

interface RawProfile {
    currency: string
}

export default function FeesDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<Student[]>([])
    const [stats, setStats] = useState({
        totalCollected: 0,
        pendingFees: 0,
        recentPayments: [] as Payment[],
        totalExpenses: 0,
        netIncome: 0,
        todayPayments: 0,
        weekPayments: 0,
        topDebtors: [] as RawDebtor[]
    })
    const [profile, setProfile] = useState<RawProfile | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [payments, expenses, income, studentData, dashboardStats, topDebtors, profileData] = await Promise.all([
                feeActions.getAllPayments() as Promise<Payment[]>,
                expenseActions.getStats() as Promise<{ total: number }>,
                incomeActions.getStats() as Promise<{ total: number }>,
                studentActions.getAll() as Promise<Student[]>,
                dashboardActions.getStats() as Promise<DashboardStats>,
                dashboardActions.getTopDebtors() as Promise<RawDebtor[]>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])

            const totalCollected = dashboardStats.totalRevenue || 0

            // Calculate today's and this week's payments
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 7)

            const todayPayments = payments.filter((p) => {
                const paymentDate = new Date(p.date)
                paymentDate.setHours(0, 0, 0, 0)
                return paymentDate.getTime() === today.getTime()
            }).reduce((sum: number, p) => sum + p.amount, 0)

            const weekPayments = payments.filter((p) => {
                const paymentDate = new Date(p.date)
                return paymentDate >= weekAgo
            }).reduce((sum: number, p) => sum + p.amount, 0)

            setStudents(studentData)
            setStats({
                totalCollected,
                pendingFees: dashboardStats.pendingFees || 0,
                recentPayments: payments.slice(-8).reverse(), // Show most recent payments
                totalExpenses: dashboardStats.totalExpenses || expenses.total || 0,
                netIncome: totalCollected - (dashboardStats.totalExpenses || expenses.total || 0),
                todayPayments,
                weekPayments,
                topDebtors
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const getStudentName = (studentId: number) => {
        const student = students.find(s => s.id === studentId)
        return student ? `${student.firstName} ${student.lastName}` : `Student #${studentId}`
    }

    const getStudentAdmNo = (studentId: number) => {
        const student = students.find(s => s.id === studentId)
        return student?.admissionNumber || ''
    }

    const PaymentMethodBadge = ({ method }: { method: string }) => {
        const info = getPaymentMethodInfo(method)
        const Icon = info.icon

        return (
            <Badge variant="outline" className={cn("gap-1.5 py-1 px-2 font-semibold", info.color)}>
                <Icon className="h-3.5 w-3.5" />
                {info.label}
            </Badge>
        )
    }

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
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Fees Dashboard"
                    description="Overview of fee collection and financial status."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Fees", href: "/fees" },
                        { label: "Dashboard" },
                    ]}
                />

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/fees/receipts" className="block">
                        <StatCard
                            title="Total Collected"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats.totalCollected)}`}
                            variant="gradient"
                            icon={<DollarSign className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-emerald-500 to-emerald-600"
                            className="shadow-emerald-200/50"
                        />
                    </Link>
                    <StatCard
                        title="Net Income"
                        value={`${profile?.currency || 'UGX'} ${formatCurrency(stats.netIncome)}`}
                        variant="gradient"
                        icon={<TrendingUp className="h-6 w-6" />}
                        iconColor="bg-gradient-to-br from-blue-600 to-indigo-700"
                        className="shadow-blue-200/50"
                    />
                    <StatCard
                        title="Pending Fees"
                        value={`${profile?.currency || 'UGX'} ${formatCurrency(stats.pendingFees)}`}
                        variant="gradient"
                        icon={<PieChart className="h-6 w-6" />}
                        iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
                        className="shadow-amber-200/50"
                    />
                    <Link href="/fees/receipts?filter=today" className="block">
                        <StatCard
                            title="Today's Collection"
                            value={`${profile?.currency || 'UGX'} ${formatCurrency(stats.todayPayments)}`}
                            variant="gradient"
                            icon={<CreditCard className="h-6 w-6" />}
                            iconColor="bg-gradient-to-br from-teal-500 to-cyan-600"
                            className="shadow-teal-200/50"
                        />
                    </Link>
                </div>

                {/* Recent Payments & Top Debtors */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-emerald-600" />
                                    Recent Payments
                                </CardTitle>
                                <CardDescription>Latest fee payments received</CardDescription>
                            </div>
                            <Link href="/fees/receipts">
                                <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                    View All <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {stats.recentPayments.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.recentPayments.map((payment: Payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm text-slate-900">
                                                            {getStudentName(payment.studentId)}
                                                        </p>
                                                        <PaymentMethodBadge method={payment.paymentMethod} />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                                        <span className="font-mono">{getStudentAdmNo(payment.studentId)}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDate(payment.date)}
                                                        </span>
                                                        {payment.receiptNumber && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-emerald-600 font-bold">#{payment.receiptNumber}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-bold text-emerald-600 text-base">
                                                    {profile?.currency || 'UGX'} {formatCurrency(payment.amount)}
                                                </p>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/fees/receipts?id=${payment.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
                                                            title="View Receipt"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/fees?studentId=${payment.studentId}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700"
                                                            title="Collect Fees"
                                                        >
                                                            <Banknote className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium">No recent payments</p>
                                    <p className="text-sm mt-1">Record fee payments to see them here.</p>
                                    <Link href="/fees">
                                        <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                                            <Banknote className="mr-2 h-4 w-4" /> Collect Fees
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                                <TrendingDown className="h-5 w-5" />
                                Top Debtors
                            </CardTitle>
                            <CardDescription>Students with largest balances</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {stats.topDebtors.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.topDebtors.map((debtor) => (
                                        <div key={debtor.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs border border-amber-100">
                                                    {debtor.firstName[0]}{debtor.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                                                        {debtor.firstName} {debtor.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-mono">{debtor.admissionNumber}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-amber-600">
                                                    {formatCurrency(debtor.balance)}
                                                </p>
                                                <Link href={`/fees?studentId=${debtor.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] font-bold text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                                                        Collect
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <p className="text-sm">No outstanding balances</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/fees">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 hover:shadow-2xl transition-shadow cursor-pointer group">
                            <CardContent className="p-6 text-center">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100 mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Banknote className="h-7 w-7" />
                                </div>
                                <p className="font-bold text-slate-900">Record Payment</p>
                                <p className="text-sm text-slate-500 mt-1">Add a new fee payment</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/fees/reports">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 hover:shadow-2xl transition-shadow cursor-pointer group">
                            <CardContent className="p-6 text-center">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100 mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="h-7 w-7" />
                                </div>
                                <p className="font-bold text-slate-900">View Reports</p>
                                <p className="text-sm text-slate-500 mt-1">Detailed fee analytics</p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/fees/types">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 hover:shadow-2xl transition-shadow cursor-pointer group">
                            <CardContent className="p-6 text-center">
                                <div className="h-14 w-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-100 mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <PieChart className="h-7 w-7" />
                                </div>
                                <p className="font-bold text-slate-900">Fee Structure</p>
                                <p className="text-sm text-slate-500 mt-1">Manage fee types</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    )
}
