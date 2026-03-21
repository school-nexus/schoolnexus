import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from './schema.js';

// Simple database initialization without Electron dependencies
const dbPath = path.resolve('school-nexus.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

console.log('Initializing database...');
console.log('Database path:', dbPath);

// Run the initialization logic from the main database file
try {
    // Create all the tables that might be missing
    const tablePatches = [
        { table: 'transaction_categories', sql: `
            CREATE TABLE IF NOT EXISTS transaction_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `},
        { table: 'payroll', sql: `
            CREATE TABLE IF NOT EXISTS payroll (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teacher_id INTEGER NOT NULL REFERENCES teachers(id),
                base_salary REAL NOT NULL,
                allowances REAL DEFAULT 0,
                deductions REAL DEFAULT 0,
                payment_frequency TEXT DEFAULT 'Monthly',
                status TEXT DEFAULT 'Active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `},
        { table: 'salary_payments', sql: `
            CREATE TABLE IF NOT EXISTS salary_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payroll_id INTEGER NOT NULL REFERENCES payroll(id),
                amount_paid REAL NOT NULL,
                date_paid TEXT NOT NULL,
                period TEXT NOT NULL,
                payment_method TEXT DEFAULT 'Cash',
                status TEXT DEFAULT 'Paid',
                recorded_by INTEGER REFERENCES users(id),
                notes TEXT
            )
        `},
        { table: 'invoices', sql: `
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL REFERENCES students(id),
                term_id INTEGER NOT NULL REFERENCES terms(id),
                invoice_number TEXT UNIQUE,
                amount REAL NOT NULL,
                due_date TEXT,
                status TEXT DEFAULT 'Pending',
                notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `},
        { table: 'student_groups', sql: `
            CREATE TABLE IF NOT EXISTS student_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `},
        { table: 'student_group_members', sql: `
            CREATE TABLE IF NOT EXISTS student_group_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL REFERENCES student_groups(id),
                student_id INTEGER NOT NULL REFERENCES students(id),
                joined_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `},
        { table: 'fee_structure_groups', sql: `
            CREATE TABLE IF NOT EXISTS fee_structure_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                class_id INTEGER REFERENCES classes(id),
                student_id INTEGER REFERENCES students(id),
                group_id INTEGER REFERENCES student_groups(id),
                term_id INTEGER REFERENCES terms(id),
                created_by INTEGER REFERENCES users(id),
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `},
        { table: 'fee_structure_group_items', sql: `
            CREATE TABLE IF NOT EXISTS fee_structure_group_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fee_structure_group_id INTEGER NOT NULL REFERENCES fee_structure_groups(id),
                fee_structure_id INTEGER NOT NULL REFERENCES fee_structures(id),
                sequence INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `}
    ];

    // Execute all table creation statements
    for (const patch of tablePatches) {
        console.log(`Creating table: ${patch.table}`);
        sqlite.exec(patch.sql);
    }

    console.log('Database initialization completed successfully!');
    sqlite.close();
} catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
}