import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { academicYears, terms, schools, users } from './schema';
import { hashPassword } from '@/lib/auth-utils';
import { schoolsRepository, profileRepository, backupsRepository } from './repositories/schools';
import { usersRepository, rolesRepository } from './repositories/users';
import { platformRepository, subscriptionsRepository, systemLogsRepository } from './repositories/platform';
import { 
    academicYearsRepository, 
    termsRepository, 
    classesRepository, 
    streamsRepository 
} from './repositories/academic';
import { 
    teachersRepository, 
    teacherDocumentsRepository, 
    studentsRepository, 
    guardiansRepository, 
    studentDocumentsRepository 
} from './repositories/people';
import { 
    subjectsRepository, 
    examTypesRepository, 
    examsRepository, 
    marksRepository, 
    gradingScalesRepository 
} from './repositories/exams';
import { 
    feeStructuresRepository, 
    feeAssignmentsRepository, 
    feePaymentsRepository, 
    invoicesRepository, 
    transactionCategoriesRepository, 
    incomeRepository, 
    expensesRepository, 
    budgetRepository, 
    payrollRepository, 
    salaryPaymentsRepository 
} from './repositories/finance';
import { 
    dashboardRepository, 
    analyticsRepository, 
    reportsRepository 
} from './repositories/dashboard';
import { 
    settingsRepository, 
    studentGroupsRepository, 
    studentGroupMembersRepository 
} from './repositories/settings';

// Use a generic SQLite database type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrizzleDB = BaseSQLiteDatabase<any, any, any, any>;

export const repository = {
    schools: schoolsRepository,
    profile: profileRepository,
    backups: backupsRepository,
    users: usersRepository,
    roles: rolesRepository,
    platform: platformRepository,
    subscriptions: subscriptionsRepository,
    systemLogs: systemLogsRepository,
    academicYears: academicYearsRepository,
    terms: termsRepository,
    classes: classesRepository,
    streams: streamsRepository,
    teachers: teachersRepository,
    teacherDocuments: teacherDocumentsRepository,
    students: studentsRepository,
    guardians: guardiansRepository,
    studentDocuments: studentDocumentsRepository,
    subjects: subjectsRepository,
    examTypes: examTypesRepository,
    exams: examsRepository,
    marks: marksRepository,
    gradingScales: gradingScalesRepository,
    feeStructures: feeStructuresRepository,
    feeAssignments: feeAssignmentsRepository,
    feePayments: feePaymentsRepository,
    invoices: invoicesRepository,
    transactionCategories: transactionCategoriesRepository,
    income: incomeRepository,
    expenses: expensesRepository,
    budget: budgetRepository,
    payroll: payrollRepository,
    salaryPayments: salaryPaymentsRepository,
    dashboard: dashboardRepository,
    analytics: analyticsRepository,
    reports: reportsRepository,
    settings: settingsRepository,
    studentGroups: studentGroupsRepository,
    studentGroupMembers: studentGroupMembersRepository,
    setup: {
        hasCompleted: async (db: DrizzleDB, schoolId: number) => {
            return await settingsRepository.hasCompleted(db, schoolId);
        },
        markAsCompleted: async (db: DrizzleDB, schoolId: number) => {
            return await settingsRepository.update(db, 'setup_completed', 'true', schoolId, 'system');
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saveInitialData: async (db: DrizzleDB, schoolId: number, data: any) => {
            const { schoolInfo, academicYear, adminInfo } = data;

            // 0. Ensure School record exists first (to avoid Foreign Key errors)
            const schoolData = {
                id: schoolId,
                name: schoolInfo?.name || (schoolId === 1 ? 'Platform' : 'New School'),
                slug: schoolId === 1 ? 'platform' : (schoolInfo?.slug || `school-${schoolId}`),
            };

            await db.insert(schools).values(schoolData).onConflictDoUpdate({
                target: schools.id,
                set: { name: schoolData.name, slug: schoolData.slug }
            });

            // 1. School Profile
            if (schoolInfo && schoolInfo.name) {
                const profileData = {
                    name: schoolInfo.name,
                    phone: schoolInfo.phone,
                    email: schoolInfo.email,
                    address: schoolInfo.address,
                    motto: schoolInfo.motto,
                    currency: schoolInfo.currency || 'UGX',
                    website: schoolInfo.website,
                    registrationNumber: schoolInfo.registrationNumber,
                };
                await profileRepository.update(db, schoolId, profileData);
            }

            // 2. Admin Account
            if (adminInfo && adminInfo.username) {
                const role = adminInfo.role || (schoolId === 1 ? 'super_admin' : 'admin');
                const hashedPassword = await hashPassword(adminInfo.password);
                const adminData = {
                    fullName: adminInfo.fullName,
                    username: adminInfo.username,
                    email: adminInfo.email,
                    passwordHash: hashedPassword,
                    role,
                    schoolId: role === 'super_admin' ? null : schoolId
                };

                await db.insert(users).values(adminData).onConflictDoUpdate({
                    target: users.username,
                    set: { 
                        fullName: adminData.fullName, 
                        email: adminData.email, 
                        passwordHash: adminData.passwordHash,
                        role: adminData.role 
                    }
                });
            }

            // 3. Academic Year & Terms - ONLY for schools (schoolId > 1)
            if (schoolId > 1 && academicYear && academicYear.name) {
                const yearData = {
                    schoolId,
                    name: academicYear.name,
                    startDate: academicYear.startDate,
                    endDate: academicYear.endDate,
                    isActive: true
                };
                
                // Using db directly for onConflict as repositories abstract it away sometimes
                const [year] = await db.insert(academicYears).values(yearData).onConflictDoUpdate({
                    target: [academicYears.id],
                    set: yearData
                }).returning();

                if (year && (year as any).id && academicYear.terms) {
                    for (const term of academicYear.terms) {
                        const termData = {
                            schoolId,
                            academicYearId: (year as any).id,
                            name: term.name,
                            startDate: term.startDate,
                            endDate: term.endDate,
                            isActive: term.isActive
                        };
                        await db.insert(terms).values(termData).onConflictDoUpdate({
                            target: [terms.id],
                            set: termData
                        });
                    }
                }
            }

            return { success: true };
        }
    }
};
