'use client';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

export const runtime = 'edge';

const viewMap: Record<string, any> = {
    'accounts/budget': dynamic(() => import('../accounts/budget/view'), { ssr: false }),
    'accounts/categories': dynamic(() => import('../accounts/categories/view'), { ssr: false }),
    'accounts/dashboard': dynamic(() => import('../accounts/dashboard/view'), { ssr: false }),
    'accounts/expenses': dynamic(() => import('../accounts/expenses/view'), { ssr: false }),
    'accounts/income': dynamic(() => import('../accounts/income/view'), { ssr: false }),
    'accounts/payroll': dynamic(() => import('../accounts/payroll/view'), { ssr: false }),
    'attendance/daily': dynamic(() => import('../attendance/daily/view'), { ssr: false }),
    'attendance/exam': dynamic(() => import('../attendance/exam/view'), { ssr: false }),
    'attendance/records': dynamic(() => import('../attendance/records/view'), { ssr: false }),
    'classes/assignments': dynamic(() => import('../classes/assignments/view'), { ssr: false }),
    'classes': dynamic(() => import('../classes/view'), { ssr: false }),
    'dashboard': dynamic(() => import('../dashboard/view'), { ssr: false }),
    'exams/grading': dynamic(() => import('../exams/grading/view'), { ssr: false }),
    'exams/marks': dynamic(() => import('../exams/marks/view'), { ssr: false }),
    'exams/marksheets': dynamic(() => import('../exams/marksheets/view'), { ssr: false }),
    'exams/schedule': dynamic(() => import('../exams/schedule/view'), { ssr: false }),
    'exams/types': dynamic(() => import('../exams/types/view'), { ssr: false }),
    'exams': dynamic(() => import('../exams/view'), { ssr: false }),
    'fees/assignments': dynamic(() => import('../fees/assignments/view'), { ssr: false }),
    'fees/dashboard': dynamic(() => import('../fees/dashboard/view'), { ssr: false }),
    'fees/groups': dynamic(() => import('../fees/groups/view'), { ssr: false }),
    'fees/invoices/preview/[id]': dynamic(() => import('../fees/invoices/preview/[id]/view'), { ssr: false }),
    'fees/invoices': dynamic(() => import('../fees/invoices/view'), { ssr: false }),
    'fees/payments': dynamic(() => import('../fees/payments/view'), { ssr: false }),
    'fees/receipts/preview/[id]': dynamic(() => import('../fees/receipts/preview/[id]/view'), { ssr: false }),
    'fees/receipts': dynamic(() => import('../fees/receipts/view'), { ssr: false }),
    'fees/reports': dynamic(() => import('../fees/reports/view'), { ssr: false }),
    'fees/types': dynamic(() => import('../fees/types/view'), { ssr: false }),
    'fees': dynamic(() => import('../fees/view'), { ssr: false }),
    'reports/examination-card': dynamic(() => import('../reports/examination-card/view'), { ssr: false }),
    'reports/guardians': dynamic(() => import('../reports/guardians/view'), { ssr: false }),
    'reports/individual': dynamic(() => import('../reports/individual/view'), { ssr: false }),
    'reports/performance': dynamic(() => import('../reports/performance/view'), { ssr: false }),
    'reports/primary': dynamic(() => import('../reports/primary/view'), { ssr: false }),
    'reports/registration-card': dynamic(() => import('../reports/registration-card/view'), { ssr: false }),
    'reports/report-templates': dynamic(() => import('../reports/report-templates/view'), { ssr: false }),
    'reports/students': dynamic(() => import('../reports/students/view'), { ssr: false }),
    'reports/teachers': dynamic(() => import('../reports/teachers/view'), { ssr: false }),
    'reports/visitors-card': dynamic(() => import('../reports/visitors-card/view'), { ssr: false }),
    'settings/academic-year': dynamic(() => import('../settings/academic-year/view'), { ssr: false }),
    'settings/backup': dynamic(() => import('../settings/backup/view'), { ssr: false }),
    'settings/database': dynamic(() => import('../settings/database/view'), { ssr: false }),
    'settings/general': dynamic(() => import('../settings/general/view'), { ssr: false }),
    'settings/notifications': dynamic(() => import('../settings/notifications/view'), { ssr: false }),
    'settings/preferences': dynamic(() => import('../settings/preferences/view'), { ssr: false }),
    'settings/profile': dynamic(() => import('../settings/profile/view'), { ssr: false }),
    'settings/roles': dynamic(() => import('../settings/roles/view'), { ssr: false }),
    'settings/users': dynamic(() => import('../settings/users/view'), { ssr: false }),
    'settings/years': dynamic(() => import('../settings/years/view'), { ssr: false }),
    'students/add': dynamic(() => import('../students/add/view'), { ssr: false }),
    'students/archived': dynamic(() => import('../students/archived/view'), { ssr: false }),
    'students/import': dynamic(() => import('../students/import/view'), { ssr: false }),
    'students/profiles': dynamic(() => import('../students/profiles/view'), { ssr: false }),
    'students/promotion': dynamic(() => import('../students/promotion/view'), { ssr: false }),
    'students': dynamic(() => import('../students/view'), { ssr: false }),
    'subjects/matrix': dynamic(() => import('../subjects/matrix/view'), { ssr: false }),
    'subjects': dynamic(() => import('../subjects/view'), { ssr: false }),
    'teachers/add': dynamic(() => import('../teachers/add/view'), { ssr: false }),
    'teachers/profiles': dynamic(() => import('../teachers/profiles/view'), { ssr: false }),
    'teachers/profiles/[id]': dynamic(() => import('../teachers/profiles/[id]/view'), { ssr: false }),
    'teachers': dynamic(() => import('../teachers/view'), { ssr: false }),
};

export default function DashboardRouter(props: any) {
    const params = useParams();
    const viewKey = useMemo(() => {
        const all = params.all;
        if (!all || (Array.isArray(all) && all.length === 0)) return '';
        return Array.isArray(all) ? all.join('/') : (all as string);
    }, [params.all]);

    const Component = useMemo(() => {
        if (viewMap[viewKey]) return viewMap[viewKey];
        if (viewKey.startsWith('teachers/profiles/') && viewKey.split('/').length === 3) return viewMap['teachers/profiles/[id]'];
        if (viewKey.startsWith('fees/invoices/preview/') && viewKey.split('/').length === 4) return viewMap['fees/invoices/preview/[id]'];
        if (viewKey.startsWith('fees/receipts/preview/') && viewKey.split('/').length === 4) return viewMap['fees/receipts/preview/[id]'];
        return viewMap[''] || (() => <div className="p-8">View not found: {viewKey}</div>);
    }, [viewKey]);

    return <Suspense fallback={null}><Component {...props} /></Suspense>;
}
