'use client';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

export const runtime = 'edge';

// 1. Platform Views (Root Level)
const LandingPage = dynamic(() => import('@/app/landing-page-content'), { ssr: false });
const LoginPage = dynamic(() => import('@/app/login/login-page-content').then(mod => mod.LoginPageContent), { ssr: false });
const SetupPage = dynamic(() => import('@/app/setup/setup-page-content').then(mod => mod.SetupPageContent), { ssr: false });
const SchoolLoginPage = dynamic(() => import('@/app/school-login/school-login-content'), { ssr: false });

// 2. Dashboard Views (Scoped)
const DashboardLayout = dynamic(() => import('@/components/layout/dashboard-layout').then(mod => mod.DashboardLayout), { ssr: false });

const viewMap: Record<string, any> = {
    'accounts/budget': dynamic(() => import('@/app/[slug]/(dashboard)/accounts/budget/view'), { ssr: false }),
    'accounts/categories': dynamic(() => import('@/app/[slug]/(dashboard)/accounts/categories/view'), { ssr: false }),
    'accounts/dashboard': dynamic(() => import('@/app/[slug]/(dashboard)/accounts/dashboard/view'), { ssr: false }),
    'accounts/expenses': dynamic(() => import('@/app/[slug]/(dashboard)/accounts/expenses/view'), { ssr: false }),
    'accounts/income': dynamic(() => import('@/app/[slug]/(dashboard)/accounts/income/view'), { ssr: false }),
    'accounts/payroll': dynamic(() => import('@/app/[slug]/(dashboard)/accounts/payroll/view'), { ssr: false }),
    'attendance/daily': dynamic(() => import('@/app/[slug]/(dashboard)/attendance/daily/view'), { ssr: false }),
    'attendance/exam': dynamic(() => import('@/app/[slug]/(dashboard)/attendance/exam/view'), { ssr: false }),
    'attendance/records': dynamic(() => import('@/app/[slug]/(dashboard)/attendance/records/view'), { ssr: false }),
    'classes/assignments': dynamic(() => import('@/app/[slug]/(dashboard)/classes/assignments/view'), { ssr: false }),
    'classes': dynamic(() => import('@/app/[slug]/(dashboard)/classes/view'), { ssr: false }),
    'dashboard': dynamic(() => import('@/app/[slug]/(dashboard)/dashboard/view'), { ssr: false }),
    'exams/grading': dynamic(() => import('@/app/[slug]/(dashboard)/exams/grading/view'), { ssr: false }),
    'exams/marks': dynamic(() => import('@/app/[slug]/(dashboard)/exams/marks/view'), { ssr: false }),
    'exams/marksheets': dynamic(() => import('@/app/[slug]/(dashboard)/exams/marksheets/view'), { ssr: false }),
    'exams/schedule': dynamic(() => import('@/app/[slug]/(dashboard)/exams/schedule/view'), { ssr: false }),
    'exams/types': dynamic(() => import('@/app/[slug]/(dashboard)/exams/types/view'), { ssr: false }),
    'exams': dynamic(() => import('@/app/[slug]/(dashboard)/exams/view'), { ssr: false }),
    'fees/assignments': dynamic(() => import('@/app/[slug]/(dashboard)/fees/assignments/view'), { ssr: false }),
    'fees/dashboard': dynamic(() => import('@/app/[slug]/(dashboard)/fees/dashboard/view'), { ssr: false }),
    'fees/groups': dynamic(() => import('@/app/[slug]/(dashboard)/fees/groups/view'), { ssr: false }),
    'fees/invoices/preview/[id]': dynamic(() => import('@/app/[slug]/(dashboard)/fees/invoices/preview/[id]/view'), { ssr: false }),
    'fees/invoices': dynamic(() => import('@/app/[slug]/(dashboard)/fees/invoices/view'), { ssr: false }),
    'fees/payments': dynamic(() => import('@/app/[slug]/(dashboard)/fees/payments/view'), { ssr: false }),
    'fees/receipts/preview/[id]': dynamic(() => import('@/app/[slug]/(dashboard)/fees/receipts/preview/[id]/view'), { ssr: false }),
    'fees/receipts': dynamic(() => import('@/app/[slug]/(dashboard)/fees/receipts/view'), { ssr: false }),
    'fees/reports': dynamic(() => import('@/app/[slug]/(dashboard)/fees/reports/view'), { ssr: false }),
    'fees/types': dynamic(() => import('@/app/[slug]/(dashboard)/fees/types/view'), { ssr: false }),
    'fees': dynamic(() => import('@/app/[slug]/(dashboard)/fees/view'), { ssr: false }),
    'reports/examination-card': dynamic(() => import('@/app/[slug]/(dashboard)/reports/examination-card/view'), { ssr: false }),
    'reports/guardians': dynamic(() => import('@/app/[slug]/(dashboard)/reports/guardians/view'), { ssr: false }),
    'reports/individual': dynamic(() => import('@/app/[slug]/(dashboard)/reports/individual/view'), { ssr: false }),
    'reports/performance': dynamic(() => import('@/app/[slug]/(dashboard)/reports/performance/view'), { ssr: false }),
    'reports/primary': dynamic(() => import('@/app/[slug]/(dashboard)/reports/primary/view'), { ssr: false }),
    'reports/registration-card': dynamic(() => import('@/app/[slug]/(dashboard)/reports/registration-card/view'), { ssr: false }),
    'reports/report-templates': dynamic(() => import('@/app/[slug]/(dashboard)/reports/report-templates/view'), { ssr: false }),
    'reports/students': dynamic(() => import('@/app/[slug]/(dashboard)/reports/students/view'), { ssr: false }),
    'reports/teachers': dynamic(() => import('@/app/[slug]/(dashboard)/reports/teachers/view'), { ssr: false }),
    'reports/visitors-card': dynamic(() => import('@/app/[slug]/(dashboard)/reports/visitors-card/view'), { ssr: false }),
    'settings/academic-year': dynamic(() => import('@/app/[slug]/(dashboard)/settings/academic-year/view'), { ssr: false }),
    'settings/backup': dynamic(() => import('@/app/[slug]/(dashboard)/settings/backup/view'), { ssr: false }),
    'settings/database': dynamic(() => import('@/app/[slug]/(dashboard)/settings/database/view'), { ssr: false }),
    'settings/general': dynamic(() => import('@/app/[slug]/(dashboard)/settings/general/view'), { ssr: false }),
    'settings/notifications': dynamic(() => import('@/app/[slug]/(dashboard)/settings/notifications/view'), { ssr: false }),
    'settings/preferences': dynamic(() => import('@/app/[slug]/(dashboard)/settings/preferences/view'), { ssr: false }),
    'settings/profile': dynamic(() => import('@/app/[slug]/(dashboard)/settings/profile/view'), { ssr: false }),
    'settings/roles': dynamic(() => import('@/app/[slug]/(dashboard)/settings/roles/view'), { ssr: false }),
    'settings/users': dynamic(() => import('@/app/[slug]/(dashboard)/settings/users/view'), { ssr: false }),
    'settings/years': dynamic(() => import('@/app/[slug]/(dashboard)/settings/years/view'), { ssr: false }),
    'students/add': dynamic(() => import('@/app/[slug]/(dashboard)/students/add/view'), { ssr: false }),
    'students/archived': dynamic(() => import('@/app/[slug]/(dashboard)/students/archived/view'), { ssr: false }),
    'students/import': dynamic(() => import('@/app/[slug]/(dashboard)/students/import/view'), { ssr: false }),
    'students/profiles': dynamic(() => import('@/app/[slug]/(dashboard)/students/profiles/view'), { ssr: false }),
    'students/promotion': dynamic(() => import('@/app/[slug]/(dashboard)/students/promotion/view'), { ssr: false }),
    'students': dynamic(() => import('@/app/[slug]/(dashboard)/students/view'), { ssr: false }),
    'subjects/matrix': dynamic(() => import('@/app/[slug]/(dashboard)/subjects/matrix/view'), { ssr: false }),
    'subjects': dynamic(() => import('@/app/[slug]/(dashboard)/subjects/view'), { ssr: false }),
    'teachers/add': dynamic(() => import('@/app/[slug]/(dashboard)/teachers/add/view'), { ssr: false }),
    'teachers/profiles': dynamic(() => import('@/app/[slug]/(dashboard)/teachers/profiles/view'), { ssr: false }),
    'teachers/profiles/[id]': dynamic(() => import('@/app/[slug]/(dashboard)/teachers/profiles/[id]/view'), { ssr: false }),
    'teachers': dynamic(() => import('@/app/[slug]/(dashboard)/teachers/view'), { ssr: false }),
    'super-admin': dynamic(() => import('@/app/super-admin/view'), { ssr: false }),
    'super-admin/subscriptions': dynamic(() => import('@/app/super-admin/subscriptions/view'), { ssr: false }),
};

export default function UniversalRouter(props: any) {
    const params = useParams();
    
    // Resolve Route
    const view = useMemo(() => {
        const segments = params.all as string[] | undefined;
        if (!segments || segments.length === 0) {
             return { type: 'platform', component: LandingPage, slug: '' };
        }

        const path = segments.join('/');
        const first = segments[0];

        // 1. Check Platform Routes
        if (first === 'login') return { type: 'platform', component: LoginPage, slug: 'platform' };
        if (first === 'setup') return { type: 'platform', component: SetupPage, slug: 'platform' };
        if (first === 'school-login') return { type: 'platform', component: SchoolLoginPage, slug: '' };
        if (first === 'super-admin') {
             const subPath = segments.join('/');
             const View = viewMap[subPath] || viewMap['super-admin'];
             return { type: 'dashboard', component: View, slug: 'platform' };
        }

        // 2. Check Dashboard Routes
        const slug = first;
        const subPath = segments.slice(1).join('/') || 'dashboard';
        
        // Resolve View Component
        let ViewComponent = viewMap[subPath];
        
        // Handle Slugs
        if (!ViewComponent) {
            if (subPath.startsWith('teachers/profiles/') && subPath.split('/').length === 3) ViewComponent = viewMap['teachers/profiles/[id]'];
            if (subPath.startsWith('fees/invoices/preview/') && subPath.split('/').length === 4) ViewComponent = viewMap['fees/invoices/preview/[id]'];
            if (subPath.startsWith('fees/receipts/preview/') && subPath.split('/').length === 4) ViewComponent = viewMap['fees/receipts/preview/[id]'];
        }

        if (!ViewComponent && segments.length === 2 && segments[1] === 'login') {
             return { type: 'platform', component: LoginPage, slug: slug };
        }

        if (ViewComponent) {
            return { type: 'dashboard', component: ViewComponent, slug };
        }

        return { 
            type: '404', 
            component: () => (
                <div className="p-8 text-center space-y-4">
                    <h1 className="text-2xl font-bold">View not found</h1>
                    <p className="text-slate-500">Path: <code>/{path}</code></p>
                    <div className="pt-8">
                        <a href="/debug" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors inline-block">
                            Run Infrastructure Diagnostics
                        </a>
                    </div>
                </div>
            ), 
            slug: '' 
        };
    }, [params.all]);

    if (view.type === 'dashboard') {
        const DashboardView = view.component;
        return (
            <DashboardLayout>
                <Suspense fallback={null}>
                    <DashboardView {...props} />
                </Suspense>
            </DashboardLayout>
        );
    }

    const PageView = view.component;
    return <Suspense fallback={null}><PageView slug={view.slug} {...props} /></Suspense>;
}
