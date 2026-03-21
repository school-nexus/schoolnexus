import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --- ESSENTIAL SCHEMAS ---

export const schoolProfile = sqliteTable('school_profile', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    website: text('website'),
    registrationNumber: text('registration_number'),
    motto: text('motto'),
    logo: text('logo'), // Path to logo file
    currency: text('currency').default('UGX'),
});

export const academicYears = sqliteTable('academic_years', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(), // e.g., "2024"
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(false),
    status: text('status').default('Active'), // Active, Archived
});

export const terms = sqliteTable('terms', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    academicYearId: integer('academic_year_id').references(() => academicYears.id).notNull(),
    name: text('name').notNull(), // e.g., "Term 1"
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(false),
});

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull(),
    role: text('role').notNull().default('teacher'), // admin, teacher, bursar
    email: text('email'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const roles = sqliteTable('roles', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    permissions: text('permissions'), // JSON string of permissions
    type: text('type').default('Custom'), // System or Custom
    status: text('status').default('Active'), // Active, Inactive
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const backups = sqliteTable('backups', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    filePath: text('file_path'),
    size: text('size'), // Size in MB
    type: text('type').default('Manual'), // Automatic, Manual, Scheduled
    status: text('status').default('Success'), // Success, Failed
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- ACADEMIC STRUCTURE ---

export const classes = sqliteTable('classes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(), // e.g., "Primary One"
    code: text('code').notNull(), // e.g., "P.1"
});

export const streams = sqliteTable('streams', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    classId: integer('class_id').references(() => classes.id).notNull(),
    name: text('name').notNull(), // e.g., "Blue", "A"
    roomNumber: text('room_number'),
    teacherId: integer('teacher_id').references(() => teachers.id), // Class teacher
});

export const subjects = sqliteTable('subjects', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(), // e.g., "Mathematics"
    code: text('code').notNull(), // e.g., "MTC"
    category: text('category').default('Core'), // Core, Elective
    isOptional: integer('is_optional', { mode: 'boolean' }).default(false),
});

// --- PEOPLE ---

export const teachers = sqliteTable('teachers', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id), // Optional link to login
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    gender: text('gender'),
    qualification: text('qualification'), // Changed from qualifications to match form singular
    address: text('address'), // Added missing address field
    subjects: text('subjects'), // JSON string of subject names e.g. ["Math", "Science"]
    status: text('status').default('Active'),
    joinedDate: text('joined_date'),
    experience: integer('experience'),
    photoUrl: text('photo_url'),
});

export const teacherDocuments = sqliteTable('teacher_documents', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // PDF, DOCX, etc.
    size: text('size').notNull(),
    date: text('date').default(sql`CURRENT_TIMESTAMP`),
    path: text('path'), // Path to file
});

export const students = sqliteTable('students', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    admissionNumber: text('admission_number').notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    gender: text('gender').notNull(),
    dob: text('dob'),
    nationality: text('nationality'),
    classId: integer('class_id').references(() => classes.id), // Current class
    streamId: integer('stream_id').references(() => streams.id), // Current stream
    photoUrl: text('photo_url'),
    status: text('status').default('Active'), // Active, Archived, Alumni
    enrollmentDate: text('enrollment_date').default(sql`CURRENT_TIMESTAMP`),
    // Parent/Guardian Info (Simplified for now, can be normalized later)
    parentNames: text('parent_names'),
    parentContact: text('parent_contact'),
    address: text('address'),
    previousSchool: text('previous_school'),
    linNumber: text('lin_number'),
    schoolPayCode: text('school_pay_code'),
    email: text('email'),
    medicalConditions: text('medical_conditions'),
    specialNeeds: text('special_needs'),
    notes: text('notes'),
});

export const guardians = sqliteTable('guardians', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    name: text('name').notNull(),
    relationship: text('relationship'), // Father, Mother, etc.
    phone: text('phone'),
    email: text('email'),
});

export const studentDocuments = sqliteTable('student_documents', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // PDF, DOCX, etc.
    size: text('size').notNull(),
    date: text('date').default(sql`CURRENT_TIMESTAMP`),
    path: text('path'), // Path to file
});

// --- ACADEMIC OPERATIONS ---

export const subjectAllocations = sqliteTable('subject_allocations', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id).notNull(),
    streamId: integer('stream_id').references(() => streams.id).notNull(),
    academicYearId: integer('academic_year_id').references(() => academicYears.id).notNull(),
});

export const examTypes = sqliteTable('exam_types', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(), // B.O.T, MID, E.O.T
    shortCode: text('short_code').notNull(),
    weightage: real('weightage').default(100),
});

export const exams = sqliteTable('exams', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    examTypeId: integer('exam_type_id').references(() => examTypes.id).notNull(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    classId: integer('class_id').references(() => classes.id), // Specific class for this exam
    name: text('name'), // Exam name e.g. "Term 1 Opening Exam"
    duration: integer('duration'), // Exam duration in minutes
    startDate: text('start_date'),
    endDate: text('end_date'),
});

export const gradingScales = sqliteTable('grading_scales', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    grade: text('grade').notNull(), // D1, D2...
    minScore: integer('min_score').notNull(),
    maxScore: integer('max_score').notNull(),
    points: integer('points').notNull(),
    remark: text('remark'),
});

export const marks = sqliteTable('marks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id).notNull(),
    examId: integer('exam_id').references(() => exams.id).notNull(),
    score: real('score').notNull(),
    grade: text('grade'), // Cached grade
    remarks: text('remarks'),
    enteredBy: integer('entered_by').references(() => users.id),
    enteredAt: text('entered_at').default(sql`CURRENT_TIMESTAMP`),
});

export const examSubjects = sqliteTable('exam_subjects', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    examId: integer('exam_id').references(() => exams.id).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id).notNull(),
});

export const attendance = sqliteTable('attendance', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    date: text('date').notNull(),
    status: text('status').notNull(), // Present, Absent, Late, Excused
    termId: integer('term_id').references(() => terms.id).notNull(),
    recordedBy: integer('recorded_by').references(() => users.id),
});

// --- FINANCE ---

export const feeStructures = sqliteTable('fee_structures', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(), // e.g., "Tuition Fee"
    amount: real('amount').notNull(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    classId: integer('class_id').references(() => classes.id), // Null means applies to all classes
    studentId: integer('student_id').references(() => students.id), // Specific to a student
});

export const invoices = sqliteTable('invoices', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    invoiceNumber: text('invoice_number').unique(),
    amount: real('amount').notNull(),
    dueDate: text('due_date'),
    status: text('status').default('Pending'), // Pending, Partially Paid, Paid, Overdue
    notes: text('notes'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});


export const feeAssignments = sqliteTable('fee_assignments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    feeStructureId: integer('fee_structure_id').references(() => feeStructures.id).notNull(),
    targetType: text('target_type').notNull(), // 'class', 'stream', 'student', 'group'
    targetId: integer('target_id').notNull(), // ID of the target based on targetType
    academicYearId: integer('academic_year_id').references(() => academicYears.id).notNull(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    amount: real('amount').notNull(),
    dueDate: text('due_date'),
    status: text('status').default('Active'), // Active, Inactive, Completed
    notes: text('notes'),
    assignedBy: integer('assigned_by').references(() => users.id),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const feePayments = sqliteTable('fee_payments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    amount: real('amount').notNull(),
    date: text('date').notNull(),
    method: text('method').default('Cash'), // Cash, Bank, Mobile Money
    receiptNumber: text('receipt_number').unique(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    invoiceId: integer('invoice_id').references(() => invoices.id), // Link to invoice
    recordedBy: integer('recorded_by').references(() => users.id),
    notes: text('notes'),
});

export const transactionCategories = sqliteTable('transaction_categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'Income' or 'Expense'
    description: text('description'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const expenses = sqliteTable('expenses', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    category: text('category').notNull(), // Keep for legacy/manual entry
    categoryId: integer('category_id').references(() => transactionCategories.id),
    amount: real('amount').notNull(),
    date: text('date').notNull(),
    description: text('description'),
    recordedBy: integer('recorded_by').references(() => users.id),
});

export const income = sqliteTable('income', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    category: text('category').notNull(), // Keep for legacy/manual entry
    categoryId: integer('category_id').references(() => transactionCategories.id),
    amount: real('amount').notNull(),
    date: text('date').notNull(),
    description: text('description'),
    source: text('source'),
    recordedBy: integer('recorded_by').references(() => users.id),
});

export const budget = sqliteTable('budget', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    category: text('category').notNull(),
    allocatedAmount: real('allocated_amount').notNull(),
    academicYearId: integer('academic_year_id').references(() => academicYears.id).notNull(),
    notes: text('notes'),
});

export const payroll = sqliteTable('payroll', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
    baseSalary: real('base_salary').notNull(),
    allowances: real('allowances').default(0),
    deductions: real('deductions').default(0),
    paymentFrequency: text('payment_frequency').default('Monthly'), // Monthly, Weekly, etc.
    status: text('status').default('Active'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const salaryPayments = sqliteTable('salary_payments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    payrollId: integer('payroll_id').references(() => payroll.id).notNull(),
    amountPaid: real('amount_paid').notNull(),
    datePaid: text('date_paid').notNull(),
    period: text('period').notNull(), // e.g., "January 2024"
    paymentMethod: text('payment_method').default('Cash'),
    status: text('status').default('Paid'), // Paid, Pending
    recordedBy: integer('recorded_by').references(() => users.id),
    notes: text('notes'),
});

// --- SETTINGS ---

export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull().unique(), // e.g., 'grading_system_name', 'pass_mark', 'calculation_method'
    value: text('value'),
    category: text('category').default('general'),
});

export const studentGroups = sqliteTable('student_groups', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const studentGroupMembers = sqliteTable('student_group_members', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    groupId: integer('group_id').references(() => studentGroups.id).notNull(),
    studentId: integer('student_id').references(() => students.id).notNull(),
    joinedAt: text('joined_at').default(sql`CURRENT_TIMESTAMP`),
});

export const reportTemplates = sqliteTable('report_templates', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type').notNull(), // Term Report, Mid-Term, Transcript
    description: text('description'),
    content: text('content'), // JSON string for layout/fields
    status: text('status').default('Active'), // Active, Draft
    lastModified: text('last_modified').default(sql`CURRENT_TIMESTAMP`),
});
