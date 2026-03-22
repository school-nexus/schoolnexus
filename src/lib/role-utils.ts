"use client"

import { BookOpen, Calendar, ClipboardList, CreditCard, DollarSign, FileText, GraduationCap, TrendingUp, Users } from 'lucide-react';
;

export type UserRole = 'admin' | 'bursar' | 'secretary' | 'teacher';

export interface RoleStats {
    totalRevenue?: string | number;
    pendingFees?: string | number;
    totalExpenses?: string | number;
    budgetVariance?: string;
    totalClasses?: number;
    totalStudents?: number;
    totalTeachers?: number;
    avgPerformance?: string;
    attendance?: string;
    newRegistrations?: number;
    totalDocuments?: number;
}

export const getRoleStats = (role: UserRole, stats: RoleStats) => {
    switch (role) {
        case 'bursar':
            return [
                { title: "Total Revenue", value: stats.totalRevenue, icon: DollarSign, color: "bg-emerald-500" },
                { title: "Pending Fees", value: stats.pendingFees || "0", icon: CreditCard, color: "bg-amber-500" },
                { title: "Total Expenses", value: stats.totalExpenses || "0", icon: TrendingUp, color: "bg-rose-500" },
                { title: "Budget Var", value: stats.budgetVariance || "0%", icon: ClipboardList, color: "bg-blue-500" },
            ];
        case 'teacher':
            return [
                { title: "My Classes", value: stats.totalClasses || 0, icon: BookOpen, color: "bg-blue-500" },
                { title: "Total Students", value: stats.totalStudents || 0, icon: GraduationCap, color: "bg-emerald-500" },
                { title: "Avg Performance", value: stats.avgPerformance || "0%", icon: ClipboardList, color: "bg-amber-500" },
                { title: "Attendance", value: stats.attendance || "0%", icon: Calendar, color: "bg-purple-500" },
            ];
        case 'secretary':
            return [
                { title: "Total Students", value: stats.totalStudents || 0, icon: GraduationCap, color: "bg-blue-500" },
                { title: "Registrations", value: stats.newRegistrations || 0, icon: Users, color: "bg-emerald-500" },
                { title: "Daily Attendance", value: stats.attendance || "0%", icon: Calendar, color: "bg-rose-500" },
                { title: "Documents", value: stats.totalDocuments || 0, icon: FileText, color: "bg-amber-500" },
            ];
        default: // admin
            return [
                { title: "Total Students", value: stats.totalStudents || 0, icon: GraduationCap, color: "bg-emerald-500" },
                { title: "Total Teachers", value: stats.totalTeachers || 0, icon: Users, color: "bg-blue-500" },
                { title: "Total Classes", value: stats.totalClasses || 0, icon: BookOpen, color: "bg-amber-500" },
                { title: "Total Revenue", value: stats.totalRevenue || 0, icon: DollarSign, color: "bg-teal-500" },
            ];
    }
};
