/**
 * Electron IPC Client Utilities
 * 
 * This module provides type-safe IPC communication between the renderer
 * and main processes, with fallback mock data for browser-only development.
 */

import {
    SchoolProfile, AcademicYear, Term, User, Class, Stream, Subject, Teacher, Student,
    Exam, ExamType, AttendanceRecord, FeeStructure, FeePayment, Invoice, Expense, Income,
    TransactionCategory, Mark, GradingScale, Guardian, Budget
} from './types';

// Type definitions
interface ElectronAPI {
    ipcRenderer: {
        invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, listener: (event: any, ...args: any[]) => void) => () => void;
        once: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
    };
    platform: string;
    isElectron: boolean;
}

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}

/**
 * Check if running in Electron environment
 */
export const isElectron = (): boolean => {
    return typeof window !== 'undefined' && !!window.electron?.isElectron;
};

/**
 * Invoke an IPC channel and return the result
 * Falls back to direct database calls or mock data when running in browser mode
 */
export const invokeIPC = async <T>(channel: string, ...args: any[]): Promise<T> => {
    // 1. Electron Mode
    if (typeof window !== 'undefined' && window.electron) {
        return window.electron.ipcRenderer.invoke(channel, ...args);
    }

    // 2. Web Mode (Cloudflare D1 RPC)
    if (typeof window !== 'undefined') {
        const isWeb = !window.electron;
        if (isWeb) {
            try {
                // Extract school slug from URL if possible
                let schoolSlug = 'platform';
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                if (pathParts.length > 0) {
                    // If the first part is a known non-school route, use platform
                    const platformRoutes = ['login', 'setup', 'school-login', 'super-admin'];
                    if (!platformRoutes.includes(pathParts[0])) {
                        schoolSlug = pathParts[0];
                    }
                }

                const response = await fetch('/api/rpc', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-school-slug': schoolSlug
                    },
                    body: JSON.stringify({ channel, args })
                });

                if (!response.ok) {
                    const err = await response.json() as any;
                    throw new Error(err.error || 'RPC Error');
                }

                return await response.json() as T;
            } catch (error) {
                console.error(`[RPC] Error for ${channel}:`, error);
                throw error;
            }
        }
    }

    // Browser mode - return appropriate mock data
    console.warn(`[IPC] Browser mode (Mock): ${channel}`);
    return getMockData<T>(channel, args);
};

/**
 * Get mock data based on channel pattern
 */
function getMockData<T>(channel: string, args: any[]): T {
    // School Profile
    if (channel === 'get-school-profile') {
        return {
            name: 'School Nexus (Demo)',
            address: '123 Education Road, Kampala',
            phone: '+256 700 123456',
            email: 'info@schoolnexus.com',
            motto: 'Excellence in Learning',
            currency: 'UGX',
        } as unknown as T;
    }

    if (channel === 'get-dashboard-stats' || channel === 'get-top-debtors') {
        return null as unknown as T;
    }

    // Stats endpoints
    if (channel.includes('-stats')) {
        return {
            totalStudents: 150,
            totalTeachers: 12,
            totalClasses: 8,
            totalRevenue: 45000000,
            totalExpenses: 15000000,
            totalIncome: 30000000,
            totalPaid: 35000000,
            totalOwed: 10000000,
        } as unknown as T;
    }

    // List endpoints
    if (channel === 'get-students') {
        return [
            { id: 1, admissionNumber: 'S001', firstName: 'Alice', lastName: 'Nakitto', gender: 'Female', status: 'Active' },
            { id: 2, admissionNumber: 'S002', firstName: 'Bob', lastName: 'Opio', gender: 'Male', status: 'Active' },
        ] as unknown as T;
    }

    if (channel === 'get-student-report-data') {
        return [
            { id: 1, studentId: 1, termId: 1, year: '2024', subjects: [] }
        ] as unknown as T;
    }

    if (channel.includes('get-all') || (channel.startsWith('get-') && !channel.includes('-by-id'))) {
        return [] as unknown as T;
    }

    // Single item endpoints
    if (channel.includes('-by-id')) {
        return null as unknown as T;
    }

    // Mutation endpoints
    if (channel.includes('create-') || channel.includes('update-') || channel.includes('save-')) {
        return (args[0] || { success: true }) as unknown as T;
    }

    // Delete endpoints
    if (channel.includes('delete-')) {
        return { success: true } as unknown as T;
    }

    // Fee Structure Groups endpoints
    if (channel === 'get-fee-structure-groups') {
        return [] as unknown as T;
    }

    if (channel === 'create-fee-structure-group' || channel === 'delete-fee-structure-group') {
        return { success: true } as unknown as T;
    }

    if (channel === 'get-fee-structure-group-items') {
        return [] as unknown as T;
    }

    // Setup endpoints
    if (channel === 'has-completed-setup') {
        return false as unknown as T; // In browser/dev mode, always show setup wizard
    }

    if (channel === 'save-setup-data' || channel === 'mark-setup-completed') {
        return { success: true } as unknown as T;
    }

    // Auth endpoint
    if (channel === 'authenticate') {
        const user = {
            id: 1,
            username: 'admin',
            fullName: 'Demo User',
            email: 'demo@example.com',
            role: 'admin',
        };
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('current_user', JSON.stringify(user));
        }
        return user as unknown as T;
    }

    if (channel === 'get-current-user') {
        if (typeof window !== 'undefined') {
            const userStr = sessionStorage.getItem('current_user');
            if (userStr) return JSON.parse(userStr) as unknown as T;
        }
        // Fallback for demo
        return { role: 'admin' } as unknown as T;
    }

    // File operations
    if (channel === 'save-file') {
        return '/mock/file/path' as unknown as T;
    }

    if (channel === 'get-budget-forecast') {
        return [
            { category: 'Scholastic Materials', suggestedAmount: 5000000, previousAmount: 4500000, growthFactor: 1.11 },
            { category: 'Utilities', suggestedAmount: 2000000, previousAmount: 1800000, growthFactor: 1.11 },
        ] as unknown as T;
    }

    return null as unknown as T;
}

// ============================================================================
// School Profile Actions
// ============================================================================

export const schoolProfileActions = {
    get: () => invokeIPC<SchoolProfile>('get-school-profile'),
    update: (data: Partial<SchoolProfile>) => invokeIPC<SchoolProfile>('update-school-profile', data),
};

// ============================================================================
// Academic Year Actions
// ============================================================================

export const academicYearActions = {
    getAll: () => invokeIPC<AcademicYear[]>('get-academic-years'),
    update: (data: Partial<AcademicYear>) => invokeIPC<AcademicYear>('update-academic-year', data),
    setActive: (id: number) => invokeIPC<AcademicYear>('set-active-academic-year', id),
    archive: (id: number) => invokeIPC<AcademicYear>('archive-academic-year', id),
};

// ============================================================================
// Term Actions
// ============================================================================

export const termActions = {
    getAll: () => invokeIPC<Term[]>('get-terms'),
    getByYear: (yearId: number) => invokeIPC<Term[]>('get-terms', yearId),
    getActive: () => invokeIPC<Term>('get-active-term'),
    setActive: (id: number) => invokeIPC<Term>('set-active-term', id),
    update: (data: Partial<Term>) => invokeIPC<Term>('update-term', data),
    delete: (id: number) => invokeIPC<void>('delete-term', id),
};

// ============================================================================
// User Actions
// ============================================================================

export const userActions = {
    getAll: () => invokeIPC<User[]>('get-users'),
    getById: (id: number) => invokeIPC<User>('get-user-by-id', id),
    create: (data: Partial<User>) => invokeIPC<User>('create-user', data),
    update: (data: Partial<User>) => invokeIPC<User>('update-user', data),
    delete: (id: number) => invokeIPC<void>('delete-user', id),
    resetPassword: (userId: number, newPassword: string) =>
        invokeIPC<void>('reset-user-password', { userId, newPassword }),
    authenticate: (credentials: { username: string; password: string }) =>
        invokeIPC<User>('authenticate', credentials),
    getCurrentUser: () => invokeIPC<User>('get-current-user'),
    seed: () => invokeIPC<any>('seed-database'),
};

// ============================================================================
// Class Actions
// ============================================================================

export const classActions = {
    getAll: () => invokeIPC<Class[]>('get-classes'),
    update: (data: Partial<Class>) => invokeIPC<Class>('update-class', data),
    delete: (id: number) => invokeIPC<void>('delete-class', id),
};

// ============================================================================
// Stream Actions
// ============================================================================

export const streamActions = {
    getAll: (classId?: number) => invokeIPC<Stream[]>('get-streams', classId),
    update: (data: Partial<Stream>) => invokeIPC<Stream>('update-stream', data),
    delete: (id: number) => invokeIPC<void>('delete-stream', id),
};

// ============================================================================
// Subject Actions
// ============================================================================

export const subjectActions = {
    getAll: () => invokeIPC<Subject[]>('get-subjects'),
    create: (data: Partial<Subject>) => invokeIPC<Subject>('update-subject', data),
    update: (data: Partial<Subject>) => invokeIPC<Subject>('update-subject', data),
    delete: (id: number) => invokeIPC<void>('delete-subject', id),
};

// ============================================================================
// Teacher Actions
// ============================================================================

export const teacherActions = {
    getAll: () => invokeIPC<Teacher[]>('get-teachers'),
    getById: (id: number) => invokeIPC<Teacher>('get-teacher-by-id', id),
    create: (data: Partial<Teacher>) => invokeIPC<Teacher>('create-teacher', data),
    update: (data: Partial<Teacher>) => invokeIPC<Teacher>('update-teacher', data),
    delete: (id: number) => invokeIPC<void>('delete-teacher', id),
    getDocuments: (teacherId: number) => invokeIPC<any[]>('get-teacher-documents', teacherId),
    addDocument: (data: any) => invokeIPC<void>('add-teacher-document', data),
    deleteDocument: (id: number) => invokeIPC<void>('delete-teacher-document', id),
    getStats: (teacherId: number) => invokeIPC<any>('get-teacher-stats', teacherId),
};

// ============================================================================
// Subject Allocation Actions
// ============================================================================

export const allocationActions = {
    getByYear: (yearId: number) => invokeIPC<any[]>('get-subject-allocations', yearId),
    create: (data: { teacherId: number; subjectId: number; streamId: number; academicYearId: number }) =>
        invokeIPC<any>('create-subject-allocation', data),
    delete: (data: { subjectId: number; streamId: number; academicYearId: number }) =>
        invokeIPC<any>('delete-subject-allocation', data),
};

// ============================================================================
// Student Actions
// ============================================================================

export const studentActions = {
    getAll: () => invokeIPC<Student[]>('get-students'),
    getById: (id: number) => invokeIPC<Student>('get-student-by-id', id),
    create: (data: Partial<Student>) => invokeIPC<Student>('create-student', data),
    update: (data: Partial<Student>) => invokeIPC<Student>('update-student', data),
    delete: (id: number) => invokeIPC<void>('delete-student', id),
    restore: (id: number) => invokeIPC<void>('restore-student', id),
    restoreBulk: (ids: number[]) => invokeIPC<void>('restore-students', ids),
    permanentDelete: (id: number) => invokeIPC<void>('permanent-delete-student', id),
    permanentDeleteBulk: (ids: number[]) => invokeIPC<void>('permanent-delete-students', ids),
    bulkImport: (studentsData: Partial<Student>[]) => invokeIPC<void>('bulk-import-students', studentsData),
    getAdmissionPrefix: () => invokeIPC<string>('get-admission-prefix'),
    promote: (data: { studentIds: number[]; targetStreamId?: number; status?: string }) =>
        invokeIPC<void>('promote-students', data),
    getDocuments: (studentId: number) => invokeIPC<any[]>('get-student-documents', studentId),
    addDocument: (data: any) => invokeIPC<void>('add-student-document', data),
    deleteDocument: (id: number) => invokeIPC<void>('delete-student-document', id),
};

// ============================================================================
// Exam Actions
// ============================================================================

export const examActions = {
    getAll: () => invokeIPC<Exam[]>('get-exams'),
    getTypes: () => invokeIPC<ExamType[]>('get-exam-types'),
    create: (data: Partial<Exam>) => invokeIPC<Exam>('create-exam', data),
    createType: (data: Partial<ExamType>) => invokeIPC<ExamType>('create-exam-type', data),
    update: (data: Partial<Exam>) => invokeIPC<Exam>('update-exam', data),
    updateType: (data: Partial<ExamType>) => invokeIPC<ExamType>('update-exam-type', data),
    delete: (id: number) => invokeIPC<void>('delete-exam', id),
    deleteType: (id: number) => invokeIPC<void>('delete-exam-type', id),
};

// ============================================================================
// Attendance Actions
// ============================================================================

export const attendanceActions = {
    getByStudent: (studentId: number) => invokeIPC<AttendanceRecord[]>('get-attendance-by-student', studentId),
    getByDate: (params: { date: string; streamId: number; termId: number }) =>
        invokeIPC<AttendanceRecord[]>('get-attendance-by-date', params),
    getStudentsForAttendance: (streamId: number) =>
        invokeIPC<any[]>('get-students-for-attendance', streamId),
    save: (records: Partial<AttendanceRecord>[]) => invokeIPC<void>('save-attendance', records),
};

// ============================================================================
// Fee Actions
// ============================================================================

export const feeActions = {
    getStudentFees: (studentId: number) => invokeIPC<any>('get-student-fees', studentId),
    getPayments: (studentId: number) => invokeIPC<FeePayment[]>('get-fee-payments', studentId),
    getAllPayments: () => invokeIPC<FeePayment[]>('get-all-payments'),
    getPaymentById: (id: number) => invokeIPC<FeePayment>('get-payment-by-id', id),
    createPayment: (data: Partial<FeePayment>) => invokeIPC<FeePayment>('create-fee-payment', data),
    deletePayment: (id: number) => invokeIPC<void>('delete-fee-payment', id),
    getStructures: (params?: { termId?: number; classId?: number }) =>
        invokeIPC<FeeStructure[]>('get-fee-structures', params),
    createStructure: (data: Partial<FeeStructure>) => invokeIPC<FeeStructure>('create-fee-structure', data),
    updateStructure: (data: Partial<FeeStructure>) => invokeIPC<FeeStructure>('update-fee-structure', data),
    deleteStructure: (id: number) => invokeIPC<void>('delete-fee-structure', id),

    // New Fee Assignment Actions
    createAssignment: (data: {
        feeStructureId: number;
        targetType: 'class' | 'stream' | 'student' | 'group';
        targetId: number;
        academicYearId: number;
        termId: number;
        amount?: number;
        dueDate?: string;
        notes?: string;
        assignedBy?: number;
    }) => invokeIPC<any>('create-fee-assignment', data),
    getAssignments: (filters?: {
        academicYearId?: number;
        termId?: number;
        targetType?: string;
        status?: string;
    }) => invokeIPC<any[]>('get-fee-assignments', filters),
    updateAssignment: (id: number, data: any) => invokeIPC<any>('update-fee-assignment', id, data),
    deleteAssignment: (id: number) => invokeIPC<any>('delete-fee-assignment', id),
    bulkCreateAssignments: (data: {
        feeStructureIds: number[];
        targetType: 'class' | 'stream' | 'student' | 'group';
        targetIds: number[];
        academicYearId: number;
        termId: number;
        dueDate?: string;
        notes?: string;
        assignedBy?: number;
    }) => invokeIPC<any>('bulk-create-fee-assignments', data),
    bulkDeleteAssignments: (data: {
        targetType: string;
        targetId: number;
        academicYearId?: number;
        termId?: number;
    }) => invokeIPC<any>('bulk-delete-fee-assignments', data),


};

// ============================================================================
// Invoice Actions
// ============================================================================

export const invoiceActions = {
    getAll: (filters?: any) => invokeIPC<Invoice[]>('get-invoices', filters),
    getById: (id: number) => invokeIPC<Invoice>('get-invoice-by-id', id),
    generate: (data: { classId?: number; studentId?: number; termId: number; dueDate: string }) =>
        invokeIPC<void>('generate-invoices', data),
    delete: (id: number) => invokeIPC<void>('delete-invoice', id),
};

// ============================================================================
// Dashboard Actions
// ============================================================================

export const dashboardActions = {
    getStats: () => invokeIPC<any>('get-dashboard-stats'),
    getChartsData: () => invokeIPC<any>('get-dashboard-charts-data'),
    getTopDebtors: () => invokeIPC<any[]>('get-top-debtors'),
};

// ============================================================================
// Guardian Actions
// ============================================================================

export const guardianActions = {
    getAll: () => invokeIPC<Guardian[]>('get-all-guardians'),
    getByStudent: (studentId: number) => invokeIPC<Guardian[]>('get-guardians', studentId),
    update: (data: Partial<Guardian>) => invokeIPC<Guardian>('update-guardian', data),
};

// ============================================================================
// Expense Actions
// ============================================================================

export const expenseActions = {
    getAll: () => invokeIPC<Expense[]>('get-expenses'),
    create: (data: Partial<Expense>) => invokeIPC<Expense>('create-expense', data),
    update: (data: Partial<Expense>) => invokeIPC<Expense>('update-expense', data),
    delete: (id: number) => invokeIPC<void>('delete-expense', id),
    getStats: () => invokeIPC<any>('get-expense-stats'),
};

// ============================================================================
// Income Actions
// ============================================================================

export const incomeActions = {
    getAll: () => invokeIPC<Income[]>('get-income'),
    create: (data: Partial<Income>) => invokeIPC<Income>('create-income', data),
    delete: (id: number) => invokeIPC<void>('delete-income', id),
    getStats: () => invokeIPC<any>('get-income-stats'),
};

// ============================================================================
// Budget Actions
// ============================================================================

export const budgetActions = {
    getAll: () => invokeIPC<Budget[]>('get-budgets'),
    create: (data: Partial<Budget>) => invokeIPC<Budget>('create-budget', data),
    update: (data: Partial<Budget>) => invokeIPC<Budget>('update-budget', data),
    delete: (id: number) => invokeIPC<void>('delete-budget', id),
    getStats: () => invokeIPC<any>('get-budget-stats'),
    getForecast: (targetYearId: number) => invokeIPC<any[]>('get-budget-forecast', targetYearId),
};

export const categoryActions = {
    getAll: () => invokeIPC<TransactionCategory[]>('get-transaction-categories'),
    create: (data: Partial<TransactionCategory>) => invokeIPC<TransactionCategory>('create-transaction-category', data),
    update: (data: Partial<TransactionCategory>) => invokeIPC<TransactionCategory>('update-transaction-category', data),
    delete: (id: number) => invokeIPC<void>('delete-transaction-category', id),
};

// ============================================================================
// Marks Actions
// ============================================================================

export const marksActions = {
    getByExam: (examId: number) => invokeIPC<Mark[]>('get-marks-by-exam', examId),
    getByExamSubject: (params: { examId: number; subjectId: number }) =>
        invokeIPC<Mark[]>('get-marks-by-exam-subject', params),
    getByStudent: (studentId: number) => invokeIPC<Mark[]>('get-marks-by-student', studentId),
    save: (data: Partial<Mark>[]) => invokeIPC<void>('save-marks', data),
};

// ============================================================================
// Grading Actions
// ============================================================================

export const gradingActions = {
    getAll: () => invokeIPC<GradingScale[]>('get-grading-scales'),
    create: (data: Partial<GradingScale>) => invokeIPC<GradingScale>('create-grading-scale', data),
    update: (data: Partial<GradingScale>) => invokeIPC<GradingScale>('update-grading-scale', data),
    delete: (id: number) => invokeIPC<void>('delete-grading-scale', id),
};

// ============================================================================
// Report Actions
// ============================================================================

export const reportActions = {
    getStudentReport: (filters?: any) =>
        invokeIPC<any[]>('get-student-report-data', filters),
    getTeacherReport: (filters?: any) =>
        invokeIPC<any[]>('get-teacher-report-data', filters),
    getAttendanceReport: (params?: any) =>
        invokeIPC<any>('get-attendance-report', params),
    getFinancialReport: (params?: any) =>
        invokeIPC<any>('get-financial-report', params),
    getTermlyReport: (filters: { classId?: number; termId?: number; studentId?: number; streamId?: number }) =>
        invokeIPC<any[]>('get-termly-report-data', filters),
    getClassPerformance: (filters: any) =>
        invokeIPC<any>('get-class-performance', filters),
    getPerformanceTrends: (filters: { classId: number; termId: number; streamId?: number }) =>
        invokeIPC<any[]>('get-performance-trends', filters),
    getPerformanceAnalytics: (filters: any) =>
        invokeIPC<any>('get-performance-analytics', filters),
    getExamMarksReport: (filters: any) =>
        invokeIPC<any>('get-exam-marks-report', filters),
};

// ============================================================================
// Report Template Actions
// ============================================================================

export const reportTemplateActions = {
    getAll: () => invokeIPC<any[]>('get-report-templates'),
    create: (data: any) => invokeIPC<void>('create-report-template', data),
    update: (data: any) => invokeIPC<void>('update-report-template', data),
    delete: (id: number) => invokeIPC<void>('delete-report-template', id),
};

// ============================================================================
// Payroll Actions
// ============================================================================

export const payrollActions = {
    getAll: () => invokeIPC<any[]>('get-all-payroll'),
    create: (data: any) => invokeIPC<any>('create-payroll', data),
    update: (data: any) => invokeIPC<any>('update-payroll', data),
    deleteRoster: (id: number) => invokeIPC<void>('delete-payroll', id),
    getPayments: (payrollId?: number) => invokeIPC<any[]>('get-salary-payments', payrollId),
    processPayment: (data: any) => invokeIPC<void>('process-salary-payment', data),
    getStats: () => invokeIPC<any>('get-payroll-stats'),
};

// ============================================================================
// Settings Actions
// ============================================================================

export const settingsActions = {
    get: () => invokeIPC<any[]>('get-settings'),
    update: (data: { key: string; value: string; category?: string }) =>
        invokeIPC<void>('update-setting', data),
};

// ============================================================================
// Student Group Actions
// ============================================================================

export const groupActions = {
    getAll: () => invokeIPC<any[]>('get-student-groups'),
    create: (data: any) => invokeIPC<void>('create-student-group', data),
    delete: (id: number) => invokeIPC<void>('delete-student-group', id),
    getMembers: (groupId: number) => invokeIPC<any[]>('get-group-members', groupId),
    addMember: (data: { groupId: number; studentId: number }) =>
        invokeIPC<void>('add-group-member', data),
    removeMember: (data: { groupId: number; studentId: number }) =>
        invokeIPC<void>('remove-group-member', data),
};

// ============================================================================
// File Actions
// ============================================================================

export const fileActions = {
    save: async (file: File, category: string, id: string | number): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        return invokeIPC<string>('save-file', {
            fileBuffer: Array.from(uint8Array),
            category,
            id,
            fileName: file.name,
        });
    },
    delete: (filePath: string) => invokeIPC<void>('delete-file', filePath),
    getUrl: (filePath: string | null | undefined) => {
        if (!filePath) return '';
        if (filePath.startsWith('http') || filePath.startsWith('blob:') || filePath.startsWith('data:')) return filePath;
        
        const platform = isElectron() ? 'app-data' : 'api/files';
        // Ensure we don't double slash
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        return `/${platform}/${cleanPath}`;
    }
};

// ============================================================================
// Setup Wizard Actions
// ============================================================================

export const setupActions = {
    hasCompletedSetup: () => invokeIPC<boolean>('has-completed-setup'),
    saveSetupData: (data: any) => invokeIPC<void>('save-setup-data', data),
    markSetupCompleted: () => invokeIPC<void>('mark-setup-completed'),
    initializeDatabase: () => invokeIPC<void>('initialize-database'),
    getDatabaseStatus: () => invokeIPC<any>('get-database-status'),
};

// ============================================================================
// Role Actions
// ============================================================================

export const roleActions = {
    getAll: () => invokeIPC<any[]>('get-roles'),
    create: (data: any) => invokeIPC<void>('create-role', data),
    update: (data: any) => invokeIPC<void>('update-role', data),
    delete: (id: number) => invokeIPC<void>('delete-role', id),
    getUserCount: (roleName: string) => invokeIPC<number>('get-users-by-role', roleName),
};

// ============================================================================
// Backup Actions
// ============================================================================

export const backupActions = {
    getAll: () => invokeIPC<any[]>('get-backups'),
    create: () => invokeIPC<void>('create-backup'),
    restore: (id: number) => invokeIPC<void>('restore-backup', id),
    delete: (id: number) => invokeIPC<void>('delete-backup', id),
    download: (id: number) => invokeIPC<string>('download-backup', id),
};


