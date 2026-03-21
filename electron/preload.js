"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const { contextBridge, ipcRenderer } = require("electron");

// Allowed IPC channels for security
const ALLOWED_INVOKE_CHANNELS = [
    'ping',
    // School profile
    'get-school-profile', 'update-school-profile',
    // Academic years
    'get-academic-years', 'update-academic-year', 'set-active-academic-year',
    // Terms
    'get-terms', 'get-active-term', 'update-term',
    // Users
    'get-users', 'update-user', 'delete-user', 'authenticate', 'seed-database',
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
    'restore-student', 'permanent-delete-student', 'bulk-import-students', 'promote-students',
    'get-student-documents', 'add-student-document', 'delete-student-document',
    // Exams
    'get-exams', 'get-exam-types', 'create-exam', 'create-exam-type',
    'update-exam', 'update-exam-type', 'delete-exam', 'delete-exam-type',
    // Attendance
    'get-attendance-by-date', 'get-students-for-attendance', 'save-attendance',
    // Fees
    'get-student-fees', 'get-fee-payments', 'get-all-payments', 'create-fee-payment', 'delete-fee-payment',
    'get-fee-structures', 'create-fee-structure', 'update-fee-structure', 'delete-fee-structure',
    'assign-fee', 'get-fee-assignments', 'delete-fee-assignment', 'delete-fee-assignments-bulk',
    // Invoices
    'get-invoices', 'get-invoice-by-id', 'generate-invoices', 'delete-invoice',
    // Dashboard
    'get-dashboard-stats', 'get-top-debtors',
    // Guardians
    'get-all-guardians', 'get-guardians', 'update-guardian',
    // Expenses & Income
    'get-expenses', 'create-expense', 'update-expense', 'delete-expense', 'get-expense-stats',
    'get-income', 'create-income', 'delete-income', 'get-income-stats',
    // Budgets
    'get-budgets', 'create-budget', 'update-budget', 'get-budget-stats',
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
    'get-payroll-data',
    // Settings
    'get-settings', 'update-setting',
    // Student groups
    'get-student-groups', 'create-student-group', 'delete-student-group',
    'get-group-members', 'add-group-member', 'remove-group-member',
    // Files
    'save-file', 'delete-file',
];

const ALLOWED_SEND_CHANNELS = [];

const ALLOWED_RECEIVE_CHANNELS = [];

/**
 * Validate that a channel is allowed for the specified operation
 */
function isChannelAllowed(channel, allowedChannels) {
    return allowedChannels.includes(channel);
}

/**
 * Expose a secure API to the renderer process via context bridge
 */
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel, ...args) => {
            if (!isChannelAllowed(channel, ALLOWED_INVOKE_CHANNELS)) {
                console.warn(`[Preload] Blocked invoke on unauthorized channel: ${channel}`);
                return Promise.reject(new Error(`Channel "${channel}" is not allowed`));
            }
            return ipcRenderer.invoke(channel, ...args);
        },

        send: (channel, ...args) => {
            if (!isChannelAllowed(channel, ALLOWED_SEND_CHANNELS)) {
                console.warn(`[Preload] Blocked send on unauthorized channel: ${channel}`);
                return;
            }
            ipcRenderer.send(channel, ...args);
        },

        on: (channel, listener) => {
            if (!isChannelAllowed(channel, ALLOWED_RECEIVE_CHANNELS)) {
                console.warn(`[Preload] Blocked listener on unauthorized channel: ${channel}`);
                return () => { };
            }
            const subscription = (event, ...args) => listener(event, ...args);
            ipcRenderer.on(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        },

        once: (channel, listener) => {
            if (!isChannelAllowed(channel, ALLOWED_RECEIVE_CHANNELS)) {
                console.warn(`[Preload] Blocked once listener on unauthorized channel: ${channel}`);
                return;
            }
            ipcRenderer.once(channel, listener);
        },
    },

    platform: process.platform,
    isElectron: true,
});

// Log successful preload initialization
console.log('[Preload] Script initialized successfully');
