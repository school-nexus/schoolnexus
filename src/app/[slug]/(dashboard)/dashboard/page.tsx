"use client"
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, Calendar, BarChart3, ArrowUpRight, Loader2, Download, CheckCircle2, UserPlus, CreditCard } from 'lucide-react';
import { dashboardActions, setupActions, userActions } from '@/lib/electron';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import { StatCard } from '@/components/dashboard/stat-card';
import { SetupWizard, SetupWizardData } from '@/components/setup-wizard/setup-wizard';
import { getRoleStats, UserRole } from '@/lib/role-utils';

interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalRevenue: number;
}

interface PerformanceData {
    subject: string;
    score: number;
}

interface RevenueTrend {
    month: string;
    revenue: number;
}

interface Activity {
    type: string;
    action: string;
    name: string;
    time: string;
}

interface ChartsData {
    performanceData: PerformanceData[];
    revenueTrends: RevenueTrend[];
    activities: Activity[];
}

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartsData, setChartsData] = useState<ChartsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsSetup, setNeedsSetup] = useState(false);
    const [isCheckingSetup, setIsCheckingSetup] = useState(true);
    const [userRole, setUserRole] = useState<UserRole>('admin');

    useEffect(() => {
        const fetchRole = async () => {
            const user = await userActions.getCurrentUser();
            if (user?.role) setUserRole(user.role as UserRole);
        };
        fetchRole();
        checkSetupStatus();
    }, []);

    const checkSetupStatus = async () => {
        try {
            const hasSetup = await setupActions.hasCompletedSetup();
            if (!hasSetup) {
                setNeedsSetup(true);
            }
        } catch (error) {
            console.error("Failed to check setup status:", error);
        } finally {
            setIsCheckingSetup(false);
        }
    };

    useEffect(() => {
        if (!needsSetup) {
            fetchStats();
        }
    }, [needsSetup]);

    const handleSetupComplete = async (data: SetupWizardData) => {
        try {
            await setupActions.saveSetupData({
                schoolInfo: data.schoolInfo,
                adminInfo: data.adminInfo,
                systemSettings: {
                    academicYearName: data.academicYear.name,
                    academicYearStartDate: data.academicYear.startDate,
                    academicYearEndDate: data.academicYear.endDate,
                    academicTerms: data.academicYear.terms.length.toString()
                }
            });
            await userActions.create({
                fullName: data.adminInfo.fullName,
                username: data.adminInfo.username,
                password: data.adminInfo.password,
                email: data.adminInfo.email,
                role: "admin",
            });
            await setupActions.markSetupCompleted();
            setNeedsSetup(false);
            fetchStats();
            toast.success("Setup completed successfully!");
        } catch (error) {
            console.error("Setup failed:", error);
            toast.error("Setup failed. Please try again.");
            throw error;
        }
    };

    const fetchStats = async () => {
        try {
            const [data, charts] = await Promise.all([
                dashboardActions.getStats(),
                dashboardActions.getChartsData()
            ]);
            setStats(data);
            setChartsData(charts);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
            toast.error("Failed to load dashboard statistics");
            setStats({
                totalStudents: 0,
                totalTeachers: 0,
                totalClasses: 0,
                totalRevenue: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `UGX ${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `UGX ${(amount / 1000).toFixed(0)}K`;
        }
        return `UGX ${amount}`;
    };

    if (isCheckingSetup) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (needsSetup) {
        return (
            <div className="h-[calc(100vh-4rem)] overflow-auto">
                <SetupWizard onComplete={handleSetupComplete} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-2">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight capitalize">{userRole} Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-10 px-4 rounded-xl transition-all hover:scale-[1.02]">
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {getRoleStats(userRole, {
                    totalStudents: stats?.totalStudents || 0,
                    totalTeachers: stats?.totalTeachers || 0,
                    totalClasses: stats?.totalClasses || 0,
                    totalRevenue: formatCurrency(stats?.totalRevenue || 0),
                    // Add other potentially missing stats
                    pendingFees: formatCurrency(0),
                    totalExpenses: formatCurrency(0),
                    budgetVariance: "0%",
                    newRegistrations: 0,
                    attendance: "95%",
                    totalDocuments: 0,
                    avgPerformance: "72%"
                }).map((stat, idx) => (
                    <StatCard
                        key={idx}
                        title={stat.title}
                        value={stat.value as string | number}
                        icon={stat.icon}
                        iconColor={`bg-gradient-to-br from-${stat.color.split('-')[1]}-500 to-${stat.color.split('-')[1]}-600`}
                        trend={{ value: 0, isPositive: true }}
                        variant="solid"
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    Students Performance
                                </CardTitle>
                                <CardDescription className="text-xs mt-1 ml-10">Average marks per subject for active term</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-medium">
                                View Analysis <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[280px] w-full">
                            {chartsData?.performanceData && chartsData.performanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartsData.performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="subject"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={32}>
                                            {chartsData.performanceData.map((entry: PerformanceData, index: number) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#34d399'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    <BarChart3 className="h-8 w-8 text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">No performance data available</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card >

                <Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4 border-b border-gray-50 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    Fee Collection
                                </CardTitle>
                                <CardDescription className="text-xs mt-1 ml-10">Monthly revenue trends for {new Date().getFullYear()}</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-medium">
                                View Revenue <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[280px] w-full">
                            {chartsData?.revenueTrends && chartsData.revenueTrends.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartsData.revenueTrends}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            tickFormatter={(value) => `UGX ${value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : (value / 1000).toFixed(0) + 'K'}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                            }}
                                            formatter={(value: number) => [`UGX ${value.toLocaleString()}`, 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    <TrendingUp className="h-8 w-8 text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">No revenue data available</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div >

            {/* Recent Activity - Enhanced List */}
            < Card className="rounded-2xl shadow-sm border-gray-100 overflow-hidden" >
                <CardHeader className="pb-4 border-b border-gray-50 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold text-gray-900">Recent Activity</CardTitle>
                            <CardDescription className="text-xs mt-1">Latest updates across the system</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                            View All Activity
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-50">
                        {chartsData?.activities && chartsData.activities.length > 0 ? (
                            chartsData.activities.map((activity: Activity, index: number) => (
                                <div key={index} className="flex items-center gap-4 p-4 hover:bg-gray-50/80 transition-colors cursor-pointer group">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 border ${activity.type === 'student' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'
                                        }`}>
                                        {activity.type === 'student' ? (
                                            <UserPlus className={`h-5 w-5 text-blue-600`} />
                                        ) : (
                                            <CreditCard className={`h-5 w-5 text-emerald-600`} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{activity.action}</p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{activity.name}</p>
                                    </div>
                                    <div className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        {new Date(activity.time).toLocaleDateString() === new Date().toLocaleDateString()
                                            ? 'Today'
                                            : new Date(activity.time).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-500">No recent activities to show</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card >
        </div >
    );
}

