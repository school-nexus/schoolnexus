import { db } from './index.js';
import {
    users,
    schoolProfile,
    academicYears,
    terms,
    classes,
    streams,
    subjects,
    teachers,
    examTypes,
    exams,
    examSubjects,
    reportTemplates,
    settings
} from './schema.js';
import { sql } from 'drizzle-orm';

export async function seed() {
    console.log('Seeding database...');

    // Check if admin user exists
    const existingAdmin = await db.select().from(users).limit(1);
    if (existingAdmin.length === 0) {
        console.log('Creating default admin user...');
        await db.insert(users).values({
            username: 'admin',
            passwordHash: 'admin123', // In a real app, this would be hashed
            fullName: 'System Administrator',
            role: 'admin',
        });
    }

    // Check if school profile exists
    const existingProfile = await db.select().from(schoolProfile).limit(1);
    if (existingProfile.length === 0) {
        console.log('Creating default school profile...');
        await db.insert(schoolProfile).values({
            name: 'School Nexus',
            email: 'info@schoolnexus.edu',
            phone: '+256 772 123456',
            address: 'Plot 45, Kampala Road, Kampala, Uganda',
            currency: 'UGX',
        });
    }

    // Check if settings exist
    const existingSettings = await db.select().from(settings).limit(1);
    if (existingSettings.length === 0) {
        console.log('Creating default system settings...');
        await db.insert(settings).values([
            { key: 'school_name', value: 'School Management System', category: 'general' },
            { key: 'admission_id_prefix', value: 'STU', category: 'general' },
            { key: 'system_language', value: 'en', category: 'general' },
            { key: 'timezone', value: 'eat', category: 'general' },
            { key: 'date_format', value: 'ddmmyyyy', category: 'general' },
            { key: 'session_timeout', value: '30', category: 'security' },
            { key: 'two_factor_auth', value: 'false', category: 'security' },
            { key: 'email_notifications', value: 'true', category: 'notifications' },
            { key: 'sms_alerts', value: 'true', category: 'notifications' },
            { key: 'push_notifications', value: 'false', category: 'notifications' },
            { key: 'calculation_method', value: 'average', category: 'grading' },
        ]);
    }

    // Check if academic years exist
    const existingYears = await db.select().from(academicYears).limit(1);
    if (existingYears.length === 0) {
        console.log('Creating default academic year...');
        const [year] = await db.insert(academicYears).values({
            name: '2025',
            startDate: '2025-01-15',
            endDate: '2025-12-10',
            isActive: true,
        }).returning();

        console.log('Creating default terms...');
        await db.insert(terms).values([
            { academicYearId: year.id, name: 'Term One', startDate: '2025-01-15', endDate: '2025-04-20', isActive: false },
            { academicYearId: year.id, name: 'Term Two', startDate: '2025-05-15', endDate: '2025-08-25', isActive: true },
            { academicYearId: year.id, name: 'Term Three', startDate: '2025-09-15', endDate: '2025-12-10', isActive: false },
        ]);
    }

    // Check if classes exist
    const existingClasses = await db.select().from(classes).limit(1);
    if (existingClasses.length === 0) {
        console.log('Creating default classes and streams...');
        const [p1] = await db.insert(classes).values({ name: 'Primary One', code: 'P.1' }).returning();
        const [p2] = await db.insert(classes).values({ name: 'Primary Two', code: 'P.2' }).returning();
        const [p3] = await db.insert(classes).values({ name: 'Primary Three', code: 'P.3' }).returning();

        await db.insert(streams).values([
            { classId: p1.id, name: 'Blue', roomNumber: 'Room 101' },
            { classId: p1.id, name: 'Red', roomNumber: 'Room 102' },
            { classId: p2.id, name: 'Blue', roomNumber: 'Room 201' },
            { classId: p3.id, name: 'Green', roomNumber: 'Room 301' },
        ]);
    }

    // Check if subjects exist
    const existingSubjects = await db.select().from(subjects).limit(1);
    if (existingSubjects.length === 0) {
        console.log('Creating default subjects...');
        await db.insert(subjects).values([
            { name: 'Mathematics', code: 'MTC', category: 'Core' },
            { name: 'English', code: 'ENG', category: 'Core' },
            { name: 'Science', code: 'SCI', category: 'Core' },
            { name: 'Social Studies', code: 'SST', category: 'Core' },
            { name: 'Religious Education', code: 'RE', category: 'Core' },
        ]);
    }

    // Check if teachers exist
    const existingTeachers = await db.select().from(teachers).limit(1);
    if (existingTeachers.length === 0) {
        console.log('Creating default teachers...');
        await db.insert(teachers).values([
            { firstName: 'Sarah', lastName: 'Wilson', gender: 'Female', status: 'Active' },
            { firstName: 'David', lastName: 'Okello', gender: 'Male', status: 'Active' },
            { firstName: 'Mary', lastName: 'Katu', gender: 'Female', status: 'Active' },
        ]);
    }

    // Check if exam types exist
    const existingExamTypes = await db.select().from(examTypes).limit(1);
    if (existingExamTypes.length === 0) {
        console.log('Creating default exam types...');
        await db.insert(examTypes).values([
            { name: 'Beginning of Term', shortCode: 'B.O.T', weightage: 30 },
            { name: 'Mid Term', shortCode: 'MID', weightage: 30 },
            { name: 'End of Term', shortCode: 'E.O.T', weightage: 40 },
        ]);
    }

    // Check if exams exist
    const existingExams = await db.select().from(exams).limit(1);
    if (existingExams.length === 0) {
        console.log('Creating default exams...');

        // Get references
        const [term2] = await db.select().from(terms).where(sql`name = 'Term Two'`).limit(1);
        const [midType] = await db.select().from(examTypes).where(sql`short_code = 'MID'`).limit(1);
        const [eotType] = await db.select().from(examTypes).where(sql`short_code = 'E.O.T'`).limit(1);
        const allSubjects = await db.select().from(subjects);

        if (term2 && midType && eotType) {
            // Create Mid Term (In Progress/Recent)
            const [midExam] = await db.insert(exams).values({
                examTypeId: midType.id,
                termId: term2.id,
                name: 'Term 2 Midterm Exams',
                startDate: '2025-06-15T08:00',
                endDate: '2025-06-20T16:00',
                duration: 120
            }).returning();

            // Create End of Term (Upcoming)
            const [eotExam] = await db.insert(exams).values({
                examTypeId: eotType.id,
                termId: term2.id,
                name: 'Term 2 Final Exams',
                startDate: '2025-08-10T08:00',
                endDate: '2025-08-18T16:00',
                duration: 180
            }).returning();

            // Assign subjects to exams
            if (allSubjects.length > 0) {
                for (const subject of allSubjects) {
                    await db.insert(examSubjects).values({ examId: midExam.id, subjectId: subject.id });
                    await db.insert(examSubjects).values({ examId: eotExam.id, subjectId: subject.id });
                }
            }
        }
    }

    // Check if report templates exist
    const existingTemplates = await db.select().from(reportTemplates).limit(1);
    if (existingTemplates.length === 0) {
        console.log('Creating default report templates...');
        await db.insert(reportTemplates).values([
            {
                name: 'Standard PLE Report',
                type: 'Term Report',
                description: 'Standard Primary Leaving Examination report card template with BOT, MID, and EOT columns',
                content: JSON.stringify({
                    layout: 'primary',
                    sections: [
                        'header',
                        'student_info',
                        'marks_table',
                        'summary',
                        'comments',
                        'footer'
                    ],
                    settings: {
                        showAttendance: true,
                        showGradingScale: true,
                        showTeacherComments: true,
                        showHeadTeacherComments: true,
                        showFooter: true,
                        showBotColumn: true,
                        showMidColumn: true,
                        showEotColumn: true
                    },
                    gradingSystem: 'uneb-ple',
                    subjects: [
                        'English',
                        'Mathematics',
                        'Science',
                        'Social Studies',
                        'Religious Education',
                        'Art and Technology',
                        'Physical Education'
                    ]
                }),
                status: 'Active'
            },
            {
                name: 'Primary School Mid-Term Report',
                type: 'Mid-Term',
                description: 'Mid-term progress report for primary school students',
                content: JSON.stringify({
                    layout: 'primary',
                    sections: [
                        'header',
                        'student_info',
                        'marks_table',
                        'comments'
                    ],
                    settings: {
                        showAttendance: true,
                        showGradingScale: false,
                        showTeacherComments: true,
                        showHeadTeacherComments: false,
                        showFooter: false,
                        showBotColumn: true,
                        showMidColumn: true,
                        showEotColumn: false
                    },
                    gradingSystem: 'uneb-ple',
                    subjects: [
                        'English',
                        'Mathematics',
                        'Science',
                        'Social Studies',
                        'Religious Education'
                    ]
                }),
                status: 'Active'
            },
            {
                name: 'Primary School Transcript',
                type: 'Transcript',
                description: 'Academic transcript for primary school completion',
                content: JSON.stringify({
                    layout: 'transcript',
                    sections: [
                        'header',
                        'student_info',
                        'academic_record',
                        'certification'
                    ],
                    settings: {
                        showAttendance: false,
                        showGradingScale: true,
                        showTeacherComments: false,
                        showHeadTeacherComments: true,
                        showFooter: true,
                        showBotColumn: false,
                        showMidColumn: false,
                        showEotColumn: true
                    },
                    gradingSystem: 'uneb-ple',
                    subjects: [
                        'English',
                        'Mathematics',
                        'Science',
                        'Social Studies',
                        'Religious Education',
                        'Art and Technology',
                        'Physical Education'
                    ]
                }),
                status: 'Active'
            }
        ]);
    }

    console.log('Seeding completed.');
}
