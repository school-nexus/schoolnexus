import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Type definitions for the exposed API
export interface ElectronAPI {
    ipcRenderer: {
        invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
        send: (channel: string, ...args: unknown[]) => void;
        on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => () => void;
        once: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => void;
    };
    platform: NodeJS.Platform;
    isElectron: boolean;
}

// Allowed IPC channels for security
const ALLOWED_INVOKE_CHANNELS = [
    'ping',
    // Setup wizard
    'has-completed-setup', 'save-setup-data', 'mark-setup-completed', 'initialize-database', 'get-database-status',
    // School profile
    'get-school-profile', 'update-school-profile',
    // Academic years
    'get-academic-years', 'update-academic-year', 'set-active-academic-year',
    // Terms
    'get-terms', 'get-active-term', 'update-term',
    // Users
    'get-users', 'update-user', 'delete-user', 'authenticate', 'seed-database', 'create-user', 'get-user-by-id', 'reset-user-password',
    // Classes & Streams
    'get-classes', 'update-class', 'delete-class',
    'get-streams', 'update-stream', 'delete-stream',
    // Subjects
    'get-subjects', 'update-subject', 'delete-subject',
    // Teachers
    'get-teachers', 'get-teacher-by-id', 'update-teacher', 'create-teacher', 'delete-teacher',
    'get-teacher-documents', 'add-teacher-document', 'delete-teacher-document', 'get-teacher-stats',
    // Subject allocations
    'get-subject-allocations', 'create-subject-allocation', 'delete-subject-allocation',
    // Students
    'get-students', 'get-student-by-id', 'create-student', 'update-student', 'delete-student',
    'restore-student', 'restore-students', 'permanent-delete-student', 'permanent-delete-students', 'bulk-import-students', 'promote-students',
    'get-student-documents', 'add-student-document', 'delete-student-document',
    // Exams
    'get-exams', 'get-exam-types', 'create-exam', 'create-exam-type',
    'update-exam', 'update-exam-type', 'delete-exam', 'delete-exam-type',
    // Attendance
    'get-attendance-by-date', 'get-students-for-attendance', 'save-attendance',
    // Fees
    'get-student-fees', 'get-fee-payments', 'get-all-payments', 'get-payment-by-id', 'create-fee-payment', 'delete-fee-payment',
    'get-fee-structures', 'create-fee-structure', 'update-fee-structure', 'delete-fee-structure',
    'assign-fee', 'get-fee-assignments', 'bulk-create-fee-assignments', 'bulk-delete-fee-assignments', 'update-fee-assignment', 'delete-fee-assignment', 'delete-fee-assignments-bulk',
    'get-fee-structure-groups', 'create-fee-structure-group', 'get-fee-structure-group-items', 'delete-fee-structure-group',
    // Invoices
    'get-invoices', 'get-invoice-by-id', 'generate-invoices', 'delete-invoice',
    // Dashboard
    'get-dashboard-stats', 'get-dashboard-charts-data', 'get-top-debtors',
    // Guardians
    'get-all-guardians', 'get-guardians', 'update-guardian',
    // Expenses & Income
    'get-expenses', 'create-expense', 'update-expense', 'delete-expense', 'get-expense-stats',
    'get-income', 'create-income', 'delete-income', 'get-income-stats',
    // Budgets
    'get-budgets', 'create-budget', 'update-budget', 'delete-budget', 'get-budget-stats',
    // Marks
    'get-marks-by-exam', 'get-marks-by-exam-subject', 'get-marks-by-student', 'save-marks',
    // Grading
    'get-grading-scales', 'create-grading-scale', 'update-grading-scale', 'delete-grading-scale',
    // Reports
    'get-student-report-data', 'get-teacher-report-data', 'get-attendance-report',
    'get-financial-report', 'get-termly-report-data', 'get-class-performance',
    'get-performance-trends', 'get-performance-analytics', 'get-exam-marks-report',
    // Report templates
    'get-report-templates', 'create-report-template', 'update-report-template', 'delete-report-template',
    // Payroll
    'get-payroll-data', 'get-all-payroll', 'create-payroll', 'update-payroll',
    'get-salary-payments', 'process-salary-payment', 'get-payroll-stats',
    // Transaction Categories
    'get-transaction-categories', 'create-transaction-category', 'update-transaction-category', 'delete-transaction-category',
    // Settings
    'get-settings', 'update-setting',
    // Student groups
    'get-student-groups', 'create-student-group', 'delete-student-group',
    'get-group-members', 'add-group-member', 'remove-group-member',
    // Files
    'save-file', 'delete-file',
    // Roles
    'get-roles', 'create-role', 'update-role', 'delete-role', 'get-users-by-role',
    // Backups
    'get-backups', 'create-backup', 'restore-backup', 'delete-backup', 'download-backup',
];

const ALLOWED_SEND_CHANNELS: string[] = [];

const ALLOWED_RECEIVE_CHANNELS: string[] = [];

/**
 * Validate that a channel is allowed for the specified operation
 */
function isChannelAllowed(channel: string, allowedChannels: string[]): boolean {
    return allowedChannels.includes(channel);
}

/**
 * Expose a secure API to the renderer process via context bridge
 */
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
            if (!isChannelAllowed(channel, ALLOWED_INVOKE_CHANNELS)) {
                console.warn(`[Preload] Blocked invoke on unauthorized channel: ${channel}`);
                return Promise.reject(new Error(`Channel "${channel}" is not allowed`));
            }
            return ipcRenderer.invoke(channel, ...args);
        },

        send: (channel: string, ...args: unknown[]): void => {
            if (!isChannelAllowed(channel, ALLOWED_SEND_CHANNELS)) {
                console.warn(`[Preload] Blocked send on unauthorized channel: ${channel}`);
                return;
            }
            ipcRenderer.send(channel, ...args);
        },

        on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): (() => void) => {
            if (!isChannelAllowed(channel, ALLOWED_RECEIVE_CHANNELS)) {
                console.warn(`[Preload] Blocked listener on unauthorized channel: ${channel}`);
                return () => { };
            }
            const subscription = (event: IpcRendererEvent, ...args: unknown[]) => listener(event, ...args);
            ipcRenderer.on(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        },

        once: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void => {
            if (!isChannelAllowed(channel, ALLOWED_RECEIVE_CHANNELS)) {
                console.warn(`[Preload] Blocked once listener on unauthorized channel: ${channel}`);
                return;
            }
            ipcRenderer.once(channel, listener);
        },
    },

    platform: process.platform,
    isElectron: true,
} as ElectronAPI);

// Log successful preload initialization
console.log('[Preload] Script initialized successfully');
