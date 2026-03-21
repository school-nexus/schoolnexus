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
    logo: text('logo'),
    currency: text('currency').default('UGX'),
});

export const academicYears = sqliteTable('academic_years', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(false),
    status: text('status').default('Active'),
});

export const terms = sqliteTable('terms', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    academicYearId: integer('academic_year_id').references(() => academicYears.id).notNull(),
    name: text('name').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(false),
});

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull(),
    role: text('role').notNull().default('teacher'),
    email: text('email'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const roles = sqliteTable('roles', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    permissions: text('permissions'),
    type: text('type').default('Custom'),
    status: text('status').default('Active'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- ACADEMIC STRUCTURE ---

export const classes = sqliteTable('classes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    code: text('code').notNull(),
});

export const streams = sqliteTable('streams', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    classId: integer('class_id').references(() => classes.id).notNull(),
    name: text('name').notNull(),
    roomNumber: text('room_number'),
    teacherId: integer('teacher_id').references(() => teachers.id),
});

export const subjects = sqliteTable('subjects', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    code: text('code').notNull(),
    category: text('category').default('Core'),
    isOptional: integer('is_optional', { mode: 'boolean' }).default(false),
});

// --- PEOPLE ---

export const teachers = sqliteTable('teachers', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    gender: text('gender'),
    qualification: text('qualification'),
    address: text('address'),
    subjects: text('subjects'),
    status: text('status').default('Active'),
    joinedDate: text('joined_date'),
    experience: integer('experience'),
    photoUrl: text('photo_url'),
});

export const students = sqliteTable('students', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    admissionNumber: text('admission_number').notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    gender: text('gender').notNull(),
    dob: text('dob'),
    nationality: text('nationality'),
    classId: integer('class_id').references(() => classes.id),
    streamId: integer('stream_id').references(() => streams.id),
    photoUrl: text('photo_url'),
    status: text('status').default('Active'),
    enrollmentDate: text('enrollment_date').default(sql`CURRENT_TIMESTAMP`),
    parentNames: text('parent_names'),
    parentContact: text('parent_contact'),
    address: text('address'),
    previousSchool: text('previous_school'),
    linNumber: text('lin_number'),
    schoolPayCode: text('school_pay_code'),
    email: text('email'),
});

// --- ACADEMIC OPERATIONS ---

export const subjectAllocations = sqliteTable('subject_allocations', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id).notNull(),
    streamId: integer('stream_id').references(() => streams.id).notNull(),
    academicYearId: integer('academic_year_id').references(() => academicYears.id).notNull(),
});

export const exams = sqliteTable('exams', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    classId: integer('class_id').references(() => classes.id),
    startDate: text('start_date'),
    endDate: text('end_date'),
    duration: integer('duration'),
});

export const marks = sqliteTable('marks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id).notNull(),
    examId: integer('exam_id').references(() => exams.id).notNull(),
    score: real('score').notNull(),
    grade: text('grade'),
    remarks: text('remarks'),
    enteredBy: integer('entered_by').references(() => users.id),
    enteredAt: text('entered_at').default(sql`CURRENT_TIMESTAMP`),
});

export const attendance = sqliteTable('attendance', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    date: text('date').notNull(),
    status: text('status').notNull(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    recordedBy: integer('recorded_by').references(() => users.id),
});

// --- FINANCE ---

export const feeStructures = sqliteTable('fee_structures', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    amount: real('amount').notNull(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    classId: integer('class_id').references(() => classes.id),
    studentId: integer('student_id').references(() => students.id),
});

export const invoices = sqliteTable('invoices', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    invoiceNumber: text('invoice_number').unique(),
    amount: real('amount').notNull(),
    dueDate: text('due_date'),
    status: text('status').default('Pending'),
    notes: text('notes'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const feePayments = sqliteTable('fee_payments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    studentId: integer('student_id').references(() => students.id).notNull(),
    amount: real('amount').notNull(),
    date: text('date').notNull(),
    method: text('method').default('Cash'),
    receiptNumber: text('receipt_number').unique(),
    termId: integer('term_id').references(() => terms.id).notNull(),
    invoiceId: integer('invoice_id').references(() => invoices.id),
    recordedBy: integer('recorded_by').references(() => users.id),
    notes: text('notes'),
});

export const expenses = sqliteTable('expenses', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    category: text('category').notNull(),
    amount: real('amount').notNull(),
    date: text('date').notNull(),
    description: text('description'),
    recordedBy: integer('recorded_by').references(() => users.id),
});

export const income = sqliteTable('income', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    category: text('category').notNull(),
    amount: real('amount').notNull(),
    date: text('date').notNull(),
    description: text('description'),
    source: text('source'),
    recordedBy: integer('recorded_by').references(() => users.id),
});

// --- SETTINGS ---

export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull().unique(),
    value: text('value'),
    category: text('category').default('general'),
});