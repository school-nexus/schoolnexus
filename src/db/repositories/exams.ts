import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { subjects, subjects as subjectsTable, examSubjects, examTypes, exams, terms, classes, marks, students, gradingScales } from '../schema';
import type { DrizzleDB } from '../repository';
import { getGradeInfoRepo } from './utils';

export const subjectsRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(subjects).where(eq(subjects.schoolId, schoolId)).orderBy(subjects.name);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(subjects).set(data).where(and(eq(subjects.id, data.id), eq(subjects.schoolId, schoolId))).returning();
        }
        return await db.insert(subjects).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(subjects).where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId))).returning();
    }
};

export const examTypesRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(examTypes).where(eq(examTypes.schoolId, schoolId)).orderBy(examTypes.name);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(examTypes).set(data).where(and(eq(examTypes.id, data.id), eq(examTypes.schoolId, schoolId))).returning();
        }
        return await db.insert(examTypes).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        const linkedExams = await db.select().from(exams).where(and(eq(exams.examTypeId, id), eq(exams.schoolId, schoolId))).limit(1);
        if (linkedExams.length > 0) {
            throw new Error('Cannot delete exam type as it is linked to existing exams');
        }
        return await db.delete(examTypes).where(and(eq(examTypes.id, id), eq(examTypes.schoolId, schoolId))).returning();
    }
};

export const examsRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        const examsList = await db
            .select({
                id: exams.id,
                examTypeId: exams.examTypeId,
                termId: exams.termId,
                classId: exams.classId,
                duration: exams.duration,
                startDate: exams.startDate,
                endDate: exams.endDate,
                name: exams.name,
                examTypeName: examTypes.name,
                termName: terms.name,
                className: classes.name,
            })
            .from(exams)
            .innerJoin(examTypes, and(eq(exams.examTypeId, examTypes.id), eq(examTypes.schoolId, schoolId)))
            .innerJoin(terms, and(eq(exams.termId, terms.id), eq(terms.schoolId, schoolId)))
            .leftJoin(classes, and(eq(exams.classId, classes.id), eq(classes.schoolId, schoolId)))
            .where(eq(exams.schoolId, schoolId))
            .orderBy(desc(exams.startDate));

        return await Promise.all(examsList.map(async (exam: any) => {
            const associatedSubjects = await db
                .select({ id: subjectsTable.id, name: subjectsTable.name, code: subjectsTable.code })
                .from(examSubjects)
                .innerJoin(subjectsTable, and(eq(examSubjects.subjectId, subjectsTable.id), eq(subjectsTable.schoolId, schoolId)))
                .where(and(eq(examSubjects.examId, exam.id), eq(examSubjects.schoolId, schoolId)));
            return { ...exam, subjects: associatedSubjects };
        }));
    },
    getByTerm: async (db: DrizzleDB, schoolId: number, termId: number) => {
        const examsList = await db
            .select({
                id: exams.id,
                examTypeId: exams.examTypeId,
                termId: exams.termId,
                classId: exams.classId,
                duration: exams.duration,
                startDate: exams.startDate,
                endDate: exams.endDate,
                name: exams.name,
                examTypeName: examTypes.name,
                termName: terms.name,
                className: classes.name,
            })
            .from(exams)
            .innerJoin(examTypes, and(eq(exams.examTypeId, examTypes.id), eq(examTypes.schoolId, schoolId)))
            .innerJoin(terms, and(eq(exams.termId, terms.id), eq(terms.schoolId, schoolId)))
            .leftJoin(classes, and(eq(exams.classId, classes.id), eq(classes.schoolId, schoolId)))
            .where(and(eq(exams.termId, termId), eq(exams.schoolId, schoolId)))
            .orderBy(desc(exams.startDate));

        return await Promise.all(examsList.map(async (exam: any) => {
            const associatedSubjects = await db
                .select({ id: subjectsTable.id, name: subjectsTable.name, code: subjectsTable.code })
                .from(examSubjects)
                .innerJoin(subjectsTable, and(eq(examSubjects.subjectId, subjectsTable.id), eq(subjectsTable.schoolId, schoolId)))
                .where(and(eq(examSubjects.examId, exam.id), eq(examSubjects.schoolId, schoolId)));
            return { ...exam, subjects: associatedSubjects };
        }));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        const { id, subjectIds, ...examData } = data;
        if (!examData.academicYearId && examData.termId) {
            const [termRecord] = await db.select({ academicYearId: terms.academicYearId }).from(terms).where(and(eq(terms.id, examData.termId), eq(terms.schoolId, schoolId))).limit(1);
            if (termRecord) examData.academicYearId = termRecord.academicYearId;
        }

        let result;
        if (id) {
            result = await db.update(exams).set(examData).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).returning();
        } else {
            result = await db.insert(exams).values({ ...examData, schoolId }).returning();
        }

        const newExam = result[0];
        if (newExam && subjectIds) {
            await db.delete(examSubjects).where(and(eq(examSubjects.examId, newExam.id), eq(examSubjects.schoolId, schoolId)));
            if (subjectIds.length > 0) {
                const examSubjectRecords = subjectIds.map((subjectId: number) => ({
                    examId: newExam.id,
                    subjectId,
                    schoolId
                }));
                await db.insert(examSubjects).values(examSubjectRecords);
            }
        }
        return newExam;
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        await db.delete(examSubjects).where(and(eq(examSubjects.examId, id), eq(examSubjects.schoolId, schoolId)));
        return await db.delete(exams).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).returning();
    }
};

export const marksRepository = {
    getByExam: async (db: DrizzleDB, schoolId: number, examId: number) => {
        return await db
            .select({
                id: marks.id,
                studentId: marks.studentId,
                subjectId: marks.subjectId,
                examId: marks.examId,
                score: marks.score,
                grade: marks.grade,
                remarks: marks.remarks,
                studentName: sql`${students.firstName} || ' ' || ${students.lastName}`,
                subjectName: subjectsTable.name,
            })
            .from(marks)
            .innerJoin(students, and(eq(marks.studentId, students.id), eq(students.schoolId, schoolId)))
            .innerJoin(subjectsTable, and(eq(marks.subjectId, subjectsTable.id), eq(subjectsTable.schoolId, schoolId)))
            .where(and(eq(marks.examId, examId), eq(marks.schoolId, schoolId)));
    },
    getByStudent: async (db: DrizzleDB, schoolId: number, studentId: number) => {
        return await db
            .select({
                id: marks.id,
                score: marks.score,
                grade: marks.grade,
                remarks: marks.remarks,
                subjectId: marks.subjectId,
                subjectName: subjectsTable.name,
                examId: marks.examId,
                examName: exams.name,
                examDate: exams.startDate,
                termId: exams.termId,
                termName: terms.name,
            })
            .from(marks)
            .innerJoin(subjectsTable, and(eq(marks.subjectId, subjectsTable.id), eq(subjectsTable.schoolId, schoolId)))
            .innerJoin(exams, and(eq(marks.examId, exams.id), eq(exams.schoolId, schoolId)))
            .innerJoin(terms, and(eq(exams.termId, terms.id), eq(terms.schoolId, schoolId)))
            .where(and(eq(marks.studentId, studentId), eq(marks.schoolId, schoolId)))
            .orderBy(desc(exams.startDate));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        const existing = await db.select().from(marks).where(and(
            eq(marks.schoolId, schoolId),
            eq(marks.studentId, data.studentId),
            eq(marks.subjectId, data.subjectId),
            eq(marks.examId, data.examId)
        )).limit(1);

        if (existing.length > 0) {
            return await db.update(marks).set(data).where(and(eq(marks.id, existing[0].id), eq(marks.schoolId, schoolId))).returning();
        }
        return await db.insert(marks).values({ ...data, schoolId }).returning();
    }
};

export const gradingScalesRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(gradingScales).where(eq(gradingScales.schoolId, schoolId)).orderBy(gradingScales.minScore);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(gradingScales).set(data).where(and(eq(gradingScales.id, data.id), eq(gradingScales.schoolId, schoolId))).returning();
        }
        return await db.insert(gradingScales).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(gradingScales).where(and(eq(gradingScales.id, id), eq(gradingScales.schoolId, schoolId))).returning();
    }
};
