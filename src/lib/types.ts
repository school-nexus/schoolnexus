export interface SchoolProfile {
    id?: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    motto: string;
    logo?: string;
    currency: string;
    registrationNumber?: string;
    website?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
}

export interface AcademicYear {
    id: number;
    name: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    isArchived?: boolean;
    status?: string;
}

export interface Term {
    id: number;
    name: string;
    academicYearId: number;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    status?: string;
    year?: string | number;
}

export interface User {
    id: number;
    username: string;
    fullName: string;
    email?: string;
    role: string;
    password?: string;
    isActive?: boolean | string;
    lastLogin?: string;
}

export interface Class {
    id: number;
    name: string;
    level?: number;
    code?: string;
}

export interface Stream {
    id: number;
    name: string;
    classId: number;
    teacherId?: number;
    roomNumber?: string;
}

export interface Subject {
    id: number;
    name: string;
    code?: string;
    category?: string;
}

export interface Teacher {
    id: number;
    fullName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    photoUrl?: string | null;
    subjects?: string;
    experience?: string;
    qualification?: string;
    joinDate?: string;
    status?: string | boolean;
}

export interface Student {
    id: number;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth?: string;
    enrollmentDate?: string | null;
    status: string;
    streamId: number;
    classId?: number;
    photoUrl?: string;
    email?: string;
    phone?: string;
    address?: string;
    bloodGroup?: string;
    medicalConditions?: string;
    photo?: string;
    linNumber?: string;
    schoolPayCode?: string;
    nationality?: string;
    religion?: string;
}

export interface ExamType {
    id: number;
    name: string;
    shortCode?: string;
    weightage?: number;
}

export interface Exam {
    id: number;
    name: string;
    examTypeId: number;
    termId: number;
    startDate: string;
    endDate?: string;
    subjects?: { id: number; name?: string; code?: string }[];
}

export interface AttendanceRecord {
    id: number;
    studentId: number;
    date: string;
    status: string;
    termId: number;
    recordedBy?: number;
    remarks?: string;
    termName?: string;
}

export interface FeeStructure {
    id: number;
    name: string;
    amount: number;
    termId: number;
    classId: number;
    academicYearId: number;
}

export interface FeePayment {
    id: number;
    studentId: number;
    amount: number;
    date: string;
    paymentMethod: string;
    method?: string;
    transactionId?: string;
    receiptNumber?: string;
    studentName?: string;
    admissionNumber?: string;
    termId?: number;
    className?: string;
    invoiceNumber?: string;
    invoiceId?: number;
}

export interface Invoice {
    id: number;
    invoiceNumber: string;
    studentId: number;
    studentName: string;
    studentAdmNo: string;
    className: string;
    amount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
    createdAt: string;
    classId: number;
    termId: number;
}

export interface Expense {
    id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
    recordedBy?: number;
}

export interface Income {
    id: number;
    source: string;
    amount: number;
    date: string;
    category: string;
}

export interface TransactionCategory {
    id: number;
    name: string;
    type: 'income' | 'expense';
    description?: string | null;
}

export interface Mark {
    id: number;
    studentId: number;
    examId: number;
    subjectId: number;
    score: number;
    subjectName?: string;
    termName?: string;
    examName?: string;
    grade?: string;
    remarks?: string;
}

export interface GradingScale {
    id: number;
    name: string;
    minScore: number;
    maxScore: number;
    grade: string;
    points: number;
    remarks: string;
    remark?: string;
}

export interface Guardian {
    id: number;
    studentId: number;
    studentName?: string;
    fullName: string;
    name?: string;
    relationship: string;
    phone: string;
    email?: string;
    occupation?: string;
    address?: string;
}

export interface Budget {
    id: number;
    category: string;
    amount: number;
    allocatedAmount?: number;
    academicYearId: number;
    termId: number;
    notes?: string;
}
