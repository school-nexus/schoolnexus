import { eq, and, sql, count } from 'drizzle-orm';
import { academicYears, terms, classes, streams, subjectAllocations, exams, attendance, feeStructures, invoices } from '../schema';
import type { DrizzleDB } from '../repository';

export const academicYearsRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(academicYears).where(eq(academicYears.schoolId, schoolId)).orderBy(academicYears.startDate);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(academicYears).set(data).where(and(eq(academicYears.id, data.id), eq(academicYears.schoolId, schoolId))).returning();
        }
        return await db.insert(academicYears).values({ ...data, schoolId }).returning();
    },
    archive: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.update(academicYears)
            .set({ status: 'Archived', isActive: false })
            .where(and(eq(academicYears.id, id), eq(academicYears.schoolId, schoolId)))
            .returning();
    },
    setActive: async (db: DrizzleDB, schoolId: number, id: number) => {
        await db.update(academicYears).set({ isActive: false }).where(eq(academicYears.schoolId, schoolId));
        return await db.update(academicYears).set({ isActive: true }).where(and(eq(academicYears.id, id), eq(academicYears.schoolId, schoolId))).returning();
    }
};

export const termsRepository = {
    getByYear: async (db: DrizzleDB, schoolId: number, yearId: number) => {
        return await db.select().from(terms).where(and(eq(terms.schoolId, schoolId), eq(terms.academicYearId, yearId))).orderBy(terms.startDate);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(terms).set(data).where(and(eq(terms.id, data.id), eq(terms.schoolId, schoolId))).returning();
        }
        return await db.insert(terms).values({ ...data, schoolId }).returning();
    },
    archiveTerm: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.update(terms)
            .set({ isActive: false })
            .where(and(eq(terms.id, id), eq(terms.schoolId, schoolId)))
            .returning();
    },
    setActiveTerm: async (db: DrizzleDB, schoolId: number, id: number, academicYearId: number) => {
        await db.update(terms).set({ isActive: false }).where(eq(terms.academicYearId, academicYearId));
        return await db.update(terms).set({ isActive: true }).where(and(eq(terms.id, id), eq(terms.academicYearId, academicYearId))).returning();
    },
    getActive: async (db: DrizzleDB, schoolId: number) => {
        const result = await db.select().from(terms).where(and(eq(terms.isActive, true), eq(terms.schoolId, schoolId))).limit(1);
        return result[0] || null;
    },
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(terms).where(eq(terms.schoolId, schoolId)).orderBy(terms.startDate);
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        const [examDeps] = await db.select({ val: count() }).from(exams).where(and(eq(exams.termId, id), eq(exams.schoolId, schoolId)));
        const [attendanceDeps] = await db.select({ val: count() }).from(attendance).where(and(eq(attendance.termId, id), eq(attendance.schoolId, schoolId)));
        const [feeDeps] = await db.select({ val: count() }).from(feeStructures).where(and(eq(feeStructures.termId, id), eq(feeStructures.schoolId, schoolId)));
        const [invoiceDeps] = await db.select({ val: count() }).from(invoices).where(and(eq(invoices.termId, id), eq(invoices.schoolId, schoolId)));

        const totalDeps = (Number(examDeps?.val) || 0) + (Number(attendanceDeps?.val) || 0) + (Number(feeDeps?.val) || 0) + (Number(invoiceDeps?.val) || 0);

        if (totalDeps > 0) {
            throw new Error(`Cannot delete term with active records (${totalDeps} dependencies found). Please delete or move these records first.`);
        }

        return await db.delete(terms).where(and(eq(terms.id, id), eq(terms.schoolId, schoolId))).returning();
    }
};

export const classesRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(classes).where(eq(classes.schoolId, schoolId));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(classes).set(data).where(and(eq(classes.id, data.id), eq(classes.schoolId, schoolId))).returning();
        }
        return await db.insert(classes).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        const classStreams = await db.select().from(streams).where(and(eq(streams.classId, id), eq(streams.schoolId, schoolId)));
        if (classStreams.length > 0) {
            throw new Error('Cannot delete class with active streams. Please delete streams first.');
        }
        return await db.delete(classes).where(and(eq(classes.id, id), eq(classes.schoolId, schoolId))).returning();
    }
};

export const streamsRepository = {
    getByClass: async (db: DrizzleDB, schoolId: number, classId: number) => {
        return await db.select().from(streams).where(and(eq(streams.schoolId, schoolId), eq(streams.classId, classId)));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(streams).set(data).where(and(eq(streams.id, data.id), eq(streams.schoolId, schoolId))).returning();
        }
        return await db.insert(streams).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        // We'll need to check students repository or inline the query
        // For simplicity and to avoid circular deps, I'll use the database directly here
        const streamStudents = await db.select({ id: sql`id` }).from(sql`students`).where(and(sql`stream_id = ${id}`, sql`school_id = ${schoolId}`)).limit(1);
        if (streamStudents.length > 0) {
            throw new Error('Cannot delete stream with active students. Please reassign or delete students first.');
        }

        const allocations = await db.select().from(subjectAllocations).where(and(eq(subjectAllocations.streamId, id), eq(subjectAllocations.schoolId, schoolId)));
        if (allocations.length > 0) {
            throw new Error('Cannot delete stream with subject allocations. Please remove allocations first.');
        }

        return await db.delete(streams).where(and(eq(streams.id, id), eq(streams.schoolId, schoolId))).returning();
    }
};
