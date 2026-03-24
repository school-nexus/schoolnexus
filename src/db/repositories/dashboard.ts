import { eq, and, sql, desc, or, inArray, count, sum, lt } from 'drizzle-orm';
import { 
    students, users, classes, feePayments, terms, subjects, 
    marks, exams, streams, academicYears, invoices, schoolProfile, 
    gradingScales, settings, subjectAllocations, teachers, 
    teacherDocuments, attendance, transactionCategories, income, 
    expenses, budget, payroll, salaryPayments, reportTemplates,
    guardians, studentDocuments
} from '../schema';
import type { DrizzleDB } from '../repository';
import { getGradeInfoRepo, calculateAggregatesRepo, determineDivisionRepo } from './utils';

export const dashboardRepository = {
    getStats: async (db: DrizzleDB, schoolId: number) => {
        const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(and(eq(students.schoolId, schoolId), eq(students.status, 'Active')));
        const [teacherCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.role, 'teacher')));
        const [classCount] = await db.select({ count: sql<number>`count(*)` }).from(classes).where(eq(classes.schoolId, schoolId));
        const [revenue] = await db.select({ total: sum(feePayments.amount) }).from(feePayments).where(eq(feePayments.schoolId, schoolId));

        return {
            totalStudents: studentCount.count || 0,
            totalTeachers: teacherCount.count || 0,
            totalClasses: classCount.count || 0,
            totalRevenue: Number(revenue.total || 0),
        };
    },
    getChartsData: async (db: DrizzleDB, schoolId: number) => {
        const currentYear = new Date().getFullYear().toString();
        const rawPayments = await db.select({ amount: feePayments.amount, date: feePayments.date }).from(feePayments).where(and(eq(feePayments.schoolId, schoolId), sql`strftime('%Y', ${feePayments.date}) = ${currentYear}`));

        const monthlyRevenueMap: Record<string, number> = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        rawPayments.forEach((p: any) => {
            const date = new Date(p.date as string);
            const monthName = monthNames[date.getMonth()];
            monthlyRevenueMap[monthName] = (monthlyRevenueMap[monthName] || 0) + Number(p.amount);
        });

        const revenueTrends = monthNames.map(name => ({ month: name, revenue: monthlyRevenueMap[name] || 0 })).filter((_, i) => i <= new Date().getMonth());

        const [activeTerm] = await db.select().from(terms).where(and(eq(terms.isActive, true), eq(terms.schoolId, schoolId))).limit(1);
        let performanceData: any[] = [];
        if (activeTerm) {
            const subjectAverages = await db.select({ subjectName: subjects.name, averageScore: sql`AVG(${marks.score})` }).from(marks).innerJoin(subjects, eq(marks.subjectId, subjects.id)).innerJoin(exams, eq(marks.examId, exams.id)).where(and(eq(exams.termId, activeTerm.id), eq(marks.schoolId, schoolId))).groupBy(subjects.name);
            performanceData = subjectAverages.map((s: any) => ({ subject: s.subjectName, score: Math.round(Number(s.averageScore || 0)) }));
        }

        const recentStudents = await db.select({ id: students.id, name: sql`${students.firstName} || ' ' || ${students.lastName}`, date: students.enrollmentDate }).from(students).where(and(eq(students.schoolId, schoolId), eq(students.status, 'Active'))).orderBy(desc(students.enrollmentDate)).limit(3);
        const recentPayments = await db.select({ id: feePayments.id, studentName: sql`${students.firstName} || ' ' || ${students.lastName}`, amount: feePayments.amount, date: feePayments.date }).from(feePayments).innerJoin(students, eq(feePayments.studentId, students.id)).where(eq(feePayments.schoolId, schoolId)).orderBy(desc(feePayments.date)).limit(3);

        const activities = [
            ...recentStudents.map((s: any) => ({ action: 'New Student Registered', name: s.name, time: s.date, type: 'student' })),
            ...recentPayments.map((p: any) => ({ action: 'Fee Payment Received', name: `${p.studentName} paid UGX ${Number(p.amount).toLocaleString()}`, time: p.date, type: 'payment' }))
        ].sort((a, b) => new Date(b.time as string).getTime() - new Date(a.time as string).getTime()).slice(0, 5);

        return { revenueTrends, performanceData: performanceData.length > 0 ? performanceData : [{ subject: 'No Data', score: 0 }], activities };
    }
};

export const analyticsRepository = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getClassPerformance: async (db: DrizzleDB, schoolId: number, filters: any) => {
        let streamIds: number[] = [];
        if (filters.streamId) { streamIds = [filters.streamId]; } 
        else {
            const classStreams = await db.select().from(streams).where(and(eq(streams.classId, filters.classId), eq(streams.schoolId, schoolId)));
            streamIds = classStreams.map((s: any) => s.id);
        }
        if (streamIds.length === 0) return { averageScore: 0, passRate: 0, totalStudents: 0 };

        const classStudents = await db.select().from(students).where(and(inArray(students.streamId, streamIds), eq(students.status, 'Active'), eq(students.schoolId, schoolId)));
        const studentIds = classStudents.map((s: any) => s.id);
        if (studentIds.length === 0) return { averageScore: 0, passRate: 0, totalStudents: 0 };

        let conditions = and(inArray(marks.studentId, studentIds), eq(exams.termId, filters.termId), eq(marks.schoolId, schoolId));
        if (filters.subjectId) conditions = and(conditions, eq(marks.subjectId, filters.subjectId));

        const classMarks = await db.select({ score: marks.score }).from(marks).innerJoin(exams, eq(marks.examId, exams.id)).where(conditions);
        if (classMarks.length === 0) return { averageScore: 0, passRate: 0, totalStudents: classStudents.length };

        const totalScore = classMarks.reduce((sum, m) => sum + (Number(m.score) || 0), 0);
        return { averageScore: Math.round((totalScore / classMarks.length) * 10) / 10, passRate: Math.round((classMarks.filter(m => (Number(m.score) || 0) >= 50).length / classMarks.length) * 100 * 10) / 10, totalStudents: classStudents.length };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPerformanceAnalytics: async (db: DrizzleDB, schoolId: number, filters: any) => {
        let streamIds: number[] = [];
        if (filters.streamId) { streamIds = [filters.streamId]; } 
        else {
            const classStreams = await db.select().from(streams).where(and(eq(streams.classId, filters.classId), eq(streams.schoolId, schoolId)));
            streamIds = classStreams.map((s: any) => s.id);
        }
        const classStudents = await db.select().from(students).where(and(inArray(students.streamId, streamIds), eq(students.status, 'Active'), eq(students.schoolId, schoolId)));
        const studentIds = classStudents.map((s: any) => s.id);
        if (studentIds.length === 0) return { subjectPerformance: [], gradeDistribution: [], passFailStats: [], termTrends: [] };

        const subjectMarks = await db.select({ subjectName: subjects.name, score: marks.score }).from(marks).innerJoin(exams, eq(marks.examId, exams.id)).innerJoin(subjects, eq(marks.subjectId, subjects.id)).where(and(inArray(marks.studentId, studentIds), eq(exams.termId, filters.termId), eq(marks.schoolId, schoolId)));
        const subjectStats: Record<string, { total: number; count: number }> = {};
        subjectMarks.forEach((m: any) => {
            if (!subjectStats[m.subjectName]) subjectStats[m.subjectName] = { total: 0, count: 0 };
            subjectStats[m.subjectName].total += (Number(m.score) || 0);
            subjectStats[m.subjectName].count += 1;
        });

        const scales = await db.select().from(gradingScales).where(eq(gradingScales.schoolId, schoolId)).orderBy(desc(gradingScales.minScore));
        const gradeCounts: Record<string, number> = {};
        scales.forEach(s => gradeCounts[s.grade] = 0);
        subjectMarks.forEach((m: any) => {
            const scale = scales.find(s => (Number(m.score) || 0) >= s.minScore && (Number(m.score) || 0) <= s.maxScore);
            if (scale) gradeCounts[scale.grade]++;
        });

        return {
            subjectPerformance: Object.entries(subjectStats).map(([subject, stats]) => ({ subject, average: Math.round((stats.total / stats.count) * 10) / 10 })).sort((a, b) => b.average - a.average),
            gradeDistribution: Object.entries(gradeCounts).map(([name, value]) => ({ name, value })).filter(g => g.value > 0),
            passFailStats: [{ name: 'Pass', value: subjectMarks.filter(m => (Number(m.score) || 0) >= 50).length, fill: '#10b981' }, { name: 'Fail', value: subjectMarks.filter(m => (Number(m.score) || 0) < 50).length, fill: '#ef4444' }],
            termTrends: []
        };
    }
};

export const reportsRepository = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getTeacherReport: async (db: DrizzleDB, schoolId: number, filters: any) => {
        const conditions = [eq(teachers.schoolId, schoolId)];
        if (filters?.status) conditions.push(eq(teachers.status, filters.status));
        const teacherList = await db.select().from(teachers).where(and(...conditions));
        return await Promise.all(teacherList.map(async (t: any) => ({ ...t, subjectCount: (await db.select({ count: count() }).from(subjectAllocations).where(and(eq(subjectAllocations.teacherId, t.id), eq(subjectAllocations.schoolId, schoolId))))[0].count })));
    },
    getAttendanceReport: async (db: DrizzleDB, schoolId: number) => {
        const records = await db.select().from(attendance).where(eq(attendance.schoolId, schoolId));
        return { total: records.length, present: records.filter(r => r.status === 'Present').length, absent: records.filter(r => r.status === 'Absent').length, late: records.filter(r => r.status === 'Late').length, presentRate: records.length > 0 ? Math.round((records.filter(r => r.status === 'Present').length / records.length) * 100) : 0 };
    },
    getFinancialReport: async (db: DrizzleDB, schoolId: number) => {
        const [feeRevenue, otherIncome, totalExpenses] = await Promise.all([
            db.select({ total: sum(feePayments.amount) }).from(feePayments).where(eq(feePayments.schoolId, schoolId)),
            db.select({ total: sum(income.amount) }).from(income).where(eq(income.schoolId, schoolId)),
            db.select({ total: sum(expenses.amount) }).from(expenses).where(eq(expenses.schoolId, schoolId))
        ]);
        const fr = Number(feeRevenue[0]?.total || 0), oi = Number(otherIncome[0]?.total || 0), te = Number(totalExpenses[0]?.total || 0);
        return { feeRevenue: fr, otherIncome: oi, totalRevenue: fr + oi, totalExpenses: te, netIncome: fr + oi - te };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getStudentReportData: async (db: DrizzleDB, schoolId: number, params: any) => {
        const { studentId, termId } = params;
        const [studentData] = await db.select({ student: students, streamName: streams.name, className: classes.name, classCode: classes.code }).from(students).leftJoin(streams, eq(students.streamId, streams.id)).leftJoin(classes, eq(streams.classId, classes.id)).where(and(eq(students.id, studentId), eq(students.schoolId, schoolId))).limit(1);
        if (!studentData) throw new Error('Student not found');
        const [profile, term, scales, dbSettings] = await Promise.all([
            db.select().from(schoolProfile).where(eq(schoolProfile.schoolId, schoolId)).limit(1),
            db.select().from(terms).where(and(termId ? eq(terms.id, termId) : eq(terms.isActive, true), eq(terms.schoolId, schoolId))).limit(1),
            db.select().from(gradingScales).where(eq(gradingScales.schoolId, schoolId)).orderBy(desc(gradingScales.minScore)),
            db.select().from(settings).where(eq(settings.schoolId, schoolId))
        ]);
        if (!term[0]) throw new Error('Term not found');
        const [year] = await db.select().from(academicYears).where(eq(academicYears.id, term[0].academicYearId)).limit(1);
        const calculationMethod = dbSettings.find(s => s.key === 'calculation_method')?.value || 'average';
        const termExams = await db.select().from(exams).where(eq(exams.termId, term[0].id));
        const examIds = termExams.map(e => e.id);
        let processedMarks = [];
        if (examIds.length > 0) {
            const sm = await db.select({ subjectId: marks.subjectId, examId: marks.id, score: marks.score, subjectName: subjects.name, subjectCode: subjects.code, teacherFirstName: teachers.firstName, teacherLastName: teachers.lastName }).from(marks).innerJoin(subjects, eq(marks.subjectId, subjects.id)).leftJoin(subjectAllocations, and(eq(subjectAllocations.subjectId, marks.subjectId), eq(subjectAllocations.streamId, studentData.student.streamId))).leftJoin(teachers, eq(subjectAllocations.teacherId, teachers.id)).where(and(eq(marks.studentId, studentId), inArray(marks.examId, examIds)));
            processedMarks = sm.map((m: any) => ({ ...m, ...getGradeInfoRepo(scales, Number(m.score)), initials: ((m.teacherFirstName?.[0] || '') + (m.teacherLastName?.[0] || '')).toUpperCase() }));
        }
        const subjectAverages: any[] = [];
        let totalScore = 0;
        const groups: Record<number, any[]> = {};
        processedMarks.forEach(m => { if (!groups[m.subjectId]) groups[m.subjectId] = []; groups[m.subjectId].push(m); });
        Object.values(groups).forEach(g => { const avg = g.reduce((s, m) => s + Number(m.score), 0) / g.length; totalScore += avg; subjectAverages.push({ ...g[0], score: avg, ...getGradeInfoRepo(scales, avg) }); });
        const avgScore = subjectAverages.length > 0 ? totalScore / subjectAverages.length : 0;
        const aggregates = calculateAggregatesRepo(subjectAverages, calculationMethod);
        return { student: { ...studentData.student, className: `${studentData.classCode} ${studentData.streamName}` }, schoolInfo: profile[0], termName: term[0].name, year: year?.name, marks: processedMarks, attendance: (await db.select().from(attendance).where(and(eq(attendance.studentId, studentId), eq(attendance.termId, term[0].id))))[0] || { present: 0, total: 0 }, performance: { total: totalScore.toFixed(0), average: avgScore.toFixed(1), aggregates, division: determineDivisionRepo(aggregates, avgScore, calculationMethod), rank: 'N/A' }, gradingScales: scales, gradingSettings: dbSettings };
    }
};
