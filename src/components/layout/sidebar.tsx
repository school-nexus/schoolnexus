'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Archive, BarChart3, Bell, BookOpen, Calendar, CalendarDays, ChevronRight, ClipboardList, CreditCard, Database, DollarSign, FileSpreadsheet, FileText, GraduationCap, HardDrive, LayoutDashboard, List, PanelLeftClose, PanelLeftOpen, Receipt, School, Settings, Shield, TrendingUp, Upload, UserCircle, UserPlus, Users, Wallet } from 'lucide-react';
;
import { schoolProfileActions, userActions, fileActions } from '@/lib/electron';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'bursar', 'secretary', 'teacher'] },
    {
        name: 'Students',
        icon: Users,
        roles: ['admin', 'secretary', 'teacher'],
        submenu: [
            { name: 'Add Student', href: '/students/add', icon: UserPlus },
            { name: 'Student List', href: '/students', icon: List },
            { name: 'Profiles', href: '/students/profiles', icon: UserCircle },
            { name: 'Promotion Wizard', href: '/students/promotion', icon: TrendingUp },
            { name: 'Bulk Import', href: '/students/import', icon: Upload },
            { name: 'Archived Students', href: '/students/archived', icon: Archive },
        ]
    },
    {
        name: 'Teachers',
        icon: GraduationCap,
        roles: ['admin', 'secretary'],
        submenu: [
            { name: 'Add Teacher', href: '/teachers/add', icon: UserPlus },
            { name: 'Teacher List', href: '/teachers', icon: List },
            { name: 'Teacher Profiles', href: '/teachers/profiles', icon: UserCircle },
        ]
    },
    {
        name: 'Classes',
        icon: BookOpen,
        roles: ['admin', 'teacher'],
        submenu: [
            { name: 'Class List', href: '/classes', icon: List },
            { name: 'Class Teachers', href: '/classes/assignments', icon: Users },
        ]
    },
    {
        name: 'Subjects',
        icon: FileText,
        roles: ['admin', 'teacher'],
        submenu: [
            { name: 'Subject List', href: '/subjects', icon: List },
            { name: 'Assignments Matrix', href: '/subjects/matrix', icon: ClipboardList },
        ]
    },
    {
        name: 'Attendance',
        icon: Calendar,
        roles: ['admin', 'secretary', 'teacher'],
        submenu: [
            { name: 'Daily Attendance', href: '/attendance/daily', icon: CalendarDays },
            { name: 'Exam Attendance', href: '/attendance/exam', icon: FileText },
            { name: 'Attendance Records', href: '/attendance/records', icon: List },
        ]
    },
    {
        name: 'Fees Collection',
        icon: DollarSign,
        roles: ['admin', 'bursar'],
        submenu: [
            { name: 'Dashboard', href: '/fees/dashboard', icon: LayoutDashboard },
            { name: 'Collect Fees', href: '/fees', icon: Wallet },
            { name: 'Payments', href: '/fees/payments', icon: CreditCard },
            { name: 'Fee Types', href: '/fees/types', icon: List },
            { name: 'Fee Assignments', href: '/fees/assignments', icon: ClipboardList },
            { name: 'Reports', href: '/fees/reports', icon: FileSpreadsheet },
            { name: 'Invoices', href: '/fees/invoices', icon: FileText },
            { name: 'Receipts', href: '/fees/receipts', icon: Receipt },
            { name: 'Student Groups', href: '/fees/groups', icon: Users },
        ]
    },
    {
        name: 'Examinations',
        icon: FileText,
        roles: ['admin', 'teacher'],
        submenu: [
            { name: 'Exam List', href: '/exams', icon: List },
            { name: 'Exam Types', href: '/exams/types', icon: FileText },
            { name: 'Schedule', href: '/exams/schedule', icon: Calendar },
            { name: 'Grading System', href: '/exams/grading', icon: BarChart3 },
            { name: 'Mark Entry', href: '/exams/marks', icon: ClipboardList },
            { name: 'Marksheets', href: '/exams/marksheets', icon: FileSpreadsheet },
        ]
    },
    {
        name: 'Reports & Certificates',
        icon: BarChart3,
        roles: ['admin', 'secretary', 'teacher'],
        submenu: [
            { name: 'Student Info Reports', href: '/reports/students', icon: Users },
            { name: 'Guardian Reports', href: '/reports/guardians', icon: UserCircle },
            { name: 'Class Performance', href: '/reports/performance', icon: TrendingUp },
            { name: 'Teacher Reports', href: '/reports/teachers', icon: GraduationCap },
            { name: 'Report Cards', href: '/reports/report-templates', icon: FileSpreadsheet },
            { name: 'Registration Card', href: '/reports/registration-card', icon: FileText },
            { name: 'Examination Card', href: '/reports/examination-card', icon: FileText },
            { name: "Visitor's Card", href: '/reports/visitors-card', icon: FileText },
        ]
    },
    {
        name: 'Accounts',
        icon: Wallet,
        roles: ['admin', 'bursar'],
        submenu: [
            { name: 'Dashboard', href: '/accounts/dashboard', icon: LayoutDashboard },
            { name: 'Expenses', href: '/accounts/expenses', icon: Receipt },
            { name: 'Income', href: '/accounts/income', icon: TrendingUp },
            { name: 'Payroll', href: '/accounts/payroll', icon: CreditCard },
            { name: 'Budget', href: '/accounts/budget', icon: Wallet },
            { name: 'Categories & Sources', href: '/accounts/categories', icon: List },
        ]
    },
    {
        name: 'Settings',
        icon: Settings,
        roles: ['admin'],
        submenu: [
            { name: 'General Settings', href: '/settings/general', icon: Settings },
            { name: 'School Profile', href: '/settings/profile', icon: School },
            { name: 'Academic Years', href: '/settings/years', icon: CalendarDays },
            { name: 'User Roles', href: '/settings/roles', icon: Shield },
            { name: 'Backup & Restore', href: '/settings/backup', icon: HardDrive },
        ]
    },
];

const menuVariants = {
    closed: { height: 0, opacity: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
    open: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1], staggerChildren: 0.05 } }
};

const submenuItemVariants = {
    closed: { opacity: 0, x: -10 },
    open: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }
};

const MotionDiv = motion.div as any;
const MotionSpan = motion.span as any;

export function Sidebar() {
    const pathname = usePathname();
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [logoPath, setLogoPath] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>('admin');

    useEffect(() => {
        const fetchUser = async () => {
            const user = await userActions.getCurrentUser();
            if (user?.role) setUserRole(user.role);
        };
        fetchUser();

        const fetchProfile = async () => {
            try {
                const profile = await schoolProfileActions.get();
                if (profile && profile.logo) {
                    setLogoPath(profile.logo);
                }
            } catch (error) {
                console.error("Failed to fetch school profile:", error);
            }
        };
        fetchProfile();
    }, []);

    const toggleMenu = (menuName: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuName) ? prev.filter(name => name !== menuName) : [...prev, menuName]
        );
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
        // Close all expanded menus when collapsing
        if (!isCollapsed) {
            setExpandedMenus([]);
        }
    };

    const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName);
    const isSubmenuActive = (submenu: any[]) => submenu.some(item => pathname === item.href);

    return (
        <MotionDiv
            animate={{ width: isCollapsed ? 64 : 240 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex h-full flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 border-r-2 border-green-500 shadow-xl"
        >
            <div className="flex h-12 items-center justify-between px-4 flex-shrink-0 border-b border-white/5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-7 w-7 rounded-lg bg-white shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                        {logoPath ? (
                            <img
                                src={fileActions.getUrl(logoPath)}
                                alt="Logo"
                                className="h-full w-full object-contain"
                            />
                        ) : (
                            <div className="h-full w-full rounded bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                <School className="h-3 w-3 text-white" />
                            </div>
                        )}
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <MotionDiv
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col min-w-0 overflow-hidden"
                            >
                                <span className="text-sm font-bold text-white truncate pl-2">School Nexus</span>
                                <span className="text-[9px] text-green-300 truncate pl-2 uppercase tracking-tighter">Management</span>
                            </MotionDiv>
                        )}
                    </AnimatePresence>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-md hover:bg-emerald-800 transition-colors text-green-300 hover:text-white"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? (
                        <PanelLeftOpen className="h-3.5 w-3.5" />
                    ) : (
                        <PanelLeftClose className="h-3.5 w-3.5" />
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/50 transition-colors">
                <nav className="space-y-0.5 px-2 py-3">
                    {navigation.filter(item => !item.roles || item.roles.includes(userRole)).map((item) => {
                        const hasSubmenu = 'submenu' in item;
                        const isExpanded = hasSubmenu && isMenuExpanded(item.name);
                        const isActive = !hasSubmenu && pathname === item.href;
                        const hasActiveSubmenu = hasSubmenu && isSubmenuActive(item.submenu || []);

                        return (
                            <div key={item.name}>
                                {hasSubmenu ? (
                                    <button
                                        onClick={() => !isCollapsed && toggleMenu(item.name)}
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-normal text-white transition-all duration-200',
                                            'hover:bg-emerald-800 hover:text-white hover:shadow-sm hover:scale-[1.02] border border-transparent hover:border-green-500/30',
                                            hasActiveSubmenu && 'bg-emerald-800 text-white shadow-inner border border-green-500/50'
                                        )}
                                        title={isCollapsed ? item.name : undefined}
                                    >
                                        <div className="flex items-center min-w-0 flex-1">
                                            <div className={cn(
                                                'flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 flex-shrink-0',
                                                hasActiveSubmenu ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-md shadow-green-500/40 border border-green-400' : 'bg-emerald-800/50 border border-green-500/20'
                                            )}>
                                                <item.icon className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                                            </div>
                                            <AnimatePresence>
                                                {!isCollapsed && (
                                                    <MotionSpan
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="text-sm truncate ml-2.5"
                                                    >
                                                        {item.name}
                                                    </MotionSpan>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        {!isCollapsed && (
                                            <MotionDiv animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}>
                                                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                                            </MotionDiv>
                                        )}
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href!}
                                        className={cn(
                                            'flex items-center rounded-lg px-3 py-2 text-sm font-normal transition-all duration-200 hover:scale-[1.02] border border-transparent',
                                            isActive ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/40 ring-1 ring-green-300/30 border border-green-400' : 'text-white hover:bg-emerald-800 hover:text-white hover:shadow-sm hover:border-green-500/30'
                                        )}
                                        title={isCollapsed ? item.name : undefined}
                                    >
                                        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 flex-shrink-0 border border-green-500/20', isActive ? 'bg-white/10 shadow-inner' : 'bg-emerald-800/50')}>
                                            <item.icon className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                                        </div>
                                        <AnimatePresence>
                                            {!isCollapsed && (
                                                <MotionSpan
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="text-sm truncate ml-2.5"
                                                >
                                                    {item.name}
                                                </MotionSpan>
                                            )}
                                        </AnimatePresence>
                                    </Link>
                                )}

                                {hasSubmenu && item.submenu && !isCollapsed && (
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <MotionDiv initial="closed" animate="open" exit="closed" variants={menuVariants} className="overflow-hidden">
                                                <div className="ml-3 space-y-0.5 border-l-2 border-slate-700/50 py-1.5 pl-2">
                                                    {item.submenu.map((subitem) => {
                                                        const isSubActive = pathname === subitem.href;
                                                        return (
                                                            <MotionDiv key={subitem.href} variants={submenuItemVariants}>
                                                                <Link
                                                                    href={subitem.href}
                                                                    className={cn(
                                                                        'flex items-center gap-2 rounded-md py-2 pl-2 pr-3 text-xs font-normal transition-all duration-200 hover:scale-[1.02] border border-transparent',
                                                                        isSubActive ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-white font-medium shadow-sm border-l-2 border-green-500 -ml-[2px] pl-[6px] border border-green-500/30' : 'text-white hover:bg-emerald-800/30 hover:text-white hover:border-l-2 hover:border-green-600 hover:-ml-[2px] hover:pl-[6px] hover:border-green-500/30'
                                                                    )}
                                                                >
                                                                    {subitem.icon && <subitem.icon className="h-3 w-3 flex-shrink-0" />}
                                                                    <span className="truncate">{subitem.name}</span>
                                                                </Link>
                                                            </MotionDiv>
                                                        );
                                                    })}
                                                </div>
                                            </MotionDiv>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <AnimatePresence>
                    {!isCollapsed && (
                        <MotionDiv
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-3 bg-emerald-800/50 backdrop-blur-sm"
                        >
                            <div className="text-[10px] text-green-400 text-center">v2.0.0 • 2026</div>
                        </MotionDiv>
                    )}
                </AnimatePresence>
            </div>
        </MotionDiv >
    );
}

