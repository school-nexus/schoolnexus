// Enum constants for type-safe string values
// Since SQLite doesn't support enums, we use these for validation

export const UserRole = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
    TEACHER: 'TEACHER',
    ACCOUNTANT: 'ACCOUNTANT',
    RECEPTIONIST: 'RECEPTIONIST',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Gender = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const ExamType = {
    MIDTERM: 'MIDTERM',
    FINAL: 'FINAL',
    QUIZ: 'QUIZ',
    ASSIGNMENT: 'ASSIGNMENT',
    PRACTICAL: 'PRACTICAL',
    PROJECT: 'PROJECT',
} as const;

export type ExamType = (typeof ExamType)[keyof typeof ExamType];

export const AttendanceStatus = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    LATE: 'LATE',
    EXCUSED: 'EXCUSED',
} as const;

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const FeeFrequency = {
    ONE_TIME: 'ONE_TIME',
    MONTHLY: 'MONTHLY',
    TERMLY: 'TERMLY',
    YEARLY: 'YEARLY',
} as const;

export type FeeFrequency = (typeof FeeFrequency)[keyof typeof FeeFrequency];

export const PaymentMethod = {
    CASH: 'CASH',
    BANK_TRANSFER: 'BANK_TRANSFER',
    MOBILE_MONEY: 'MOBILE_MONEY',
    CHEQUE: 'CHEQUE',
    CARD: 'CARD',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ExpenseCategory = {
    SALARY: 'SALARY',
    UTILITIES: 'UTILITIES',
    MAINTENANCE: 'MAINTENANCE',
    SUPPLIES: 'SUPPLIES',
    TRANSPORT: 'TRANSPORT',
    FOOD: 'FOOD',
    EVENTS: 'EVENTS',
    OTHER: 'OTHER',
} as const;

export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const ExpenseStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    PAID: 'PAID',
} as const;

export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

export const IncomeSource = {
    FEES: 'FEES',
    DONATION: 'DONATION',
    GRANT: 'GRANT',
    FUNDRAISING: 'FUNDRAISING',
    OTHER: 'OTHER',
} as const;

export type IncomeSource = (typeof IncomeSource)[keyof typeof IncomeSource];

export const SettingCategory = {
    GENERAL: 'GENERAL',
    ACADEMIC: 'ACADEMIC',
    FINANCIAL: 'FINANCIAL',
    NOTIFICATION: 'NOTIFICATION',
    SECURITY: 'SECURITY',
} as const;

export type SettingCategory = (typeof SettingCategory)[keyof typeof SettingCategory];

export const NotificationType = {
    INFO: 'INFO',
    SUCCESS: 'SUCCESS',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    FEE_REMINDER: 'FEE_REMINDER',
    EXAM_ANNOUNCEMENT: 'EXAM_ANNOUNCEMENT',
    RESULT_PUBLISHED: 'RESULT_PUBLISHED',
    ATTENDANCE_ALERT: 'ATTENDANCE_ALERT',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// Helper functions for validation
export function isValidUserRole(value: string): value is UserRole {
    return Object.values(UserRole).includes(value as UserRole);
}

export function isValidGender(value: string): value is Gender {
    return Object.values(Gender).includes(value as Gender);
}

export function isValidExamType(value: string): value is ExamType {
    return Object.values(ExamType).includes(value as ExamType);
}

export function isValidAttendanceStatus(value: string): value is AttendanceStatus {
    return Object.values(AttendanceStatus).includes(value as AttendanceStatus);
}

export function isValidFeeFrequency(value: string): value is FeeFrequency {
    return Object.values(FeeFrequency).includes(value as FeeFrequency);
}

export function isValidPaymentMethod(value: string): value is PaymentMethod {
    return Object.values(PaymentMethod).includes(value as PaymentMethod);
}

export function isValidExpenseCategory(value: string): value is ExpenseCategory {
    return Object.values(ExpenseCategory).includes(value as ExpenseCategory);
}

export function isValidExpenseStatus(value: string): value is ExpenseStatus {
    return Object.values(ExpenseStatus).includes(value as ExpenseStatus);
}

export function isValidIncomeSource(value: string): value is IncomeSource {
    return Object.values(IncomeSource).includes(value as IncomeSource);
}

export function isValidSettingCategory(value: string): value is SettingCategory {
    return Object.values(SettingCategory).includes(value as SettingCategory);
}

export function isValidNotificationType(value: string): value is NotificationType {
    return Object.values(NotificationType).includes(value as NotificationType);
}
