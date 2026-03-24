import { eq, and, inArray, sql, count } from 'drizzle-orm';
import { teachers, teacherDocuments, students, guardians, studentDocuments, subjectAllocations, settings, schoolProfile } from '../schema';
import type { DrizzleDB } from '../repository';

export const teachersRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(teachers).where(eq(teachers.schoolId, schoolId)).orderBy(teachers.firstName);
    },
    getById: async (db: DrizzleDB, schoolId: number, id: number) => {
        const result = await db.select().from(teachers).where(and(eq(teachers.id, id), eq(teachers.schoolId, schoolId))).limit(1);
        return result[0] || null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        const { id, ...updateData } = data;
        const mappedData = {
            ...updateData,
            schoolId,
            qualification: updateData.qualification || updateData.qualifications,
            joinedDate: updateData.joinedDate || updateData.joinDate,
            experience: updateData.experience ? parseInt(updateData.experience.toString()) : null
        };
        delete (mappedData as any).qualifications;
        delete (mappedData as any).joinDate;

        if (id) {
            return await db.update(teachers).set(mappedData).where(and(eq(teachers.id, id), eq(teachers.schoolId, schoolId))).returning();
        }
        return await db.insert(teachers).values(mappedData).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(teachers).where(and(eq(teachers.id, id), eq(teachers.schoolId, schoolId))).returning();
    },
    getReportData: async (db: DrizzleDB, schoolId: number) => {
        const teachersList = await db.select().from(teachers).where(eq(teachers.schoolId, schoolId)).orderBy(teachers.firstName);
        return teachersList.map(t => ({
            ...t,
            qualifications: (t as any).qualification
        }));
    },
    getStats: async (db: DrizzleDB, schoolId: number, teacherId: number) => {
        // Find active term inline to avoid circular deps
        const activeTermResult = await db.select({ academicYearId: sql`academic_year_id` }).from(sql`terms`).where(and(sql`is_active = 1`, sql`school_id = ${schoolId}`)).limit(1);
        const activeTerm = activeTermResult[0] as { academicYearId: number } | undefined;
        
        if (!activeTerm) return { classes: 0, students: 0 };

        const allocations = await db.select().from(subjectAllocations).where(and(
            eq(subjectAllocations.teacherId, teacherId),
            eq(subjectAllocations.academicYearId, activeTerm.academicYearId),
            eq(subjectAllocations.schoolId, schoolId)
        ));

        const streamIds = Array.from(new Set(allocations.map((a: any) => a.streamId)));
        if (streamIds.length === 0) return { classes: 0, students: 0 };

        const [studentCountResult] = await db.select({ val: count() }).from(students).where(and(
            inArray(students.streamId, streamIds),
            eq(students.status, 'Active'),
            eq(students.schoolId, schoolId)
        ));

        return { classes: streamIds.length, students: Number(studentCountResult?.val) || 0 };
    }
};

export const teacherDocumentsRepository = {
    getByTeacher: async (db: DrizzleDB, schoolId: number, teacherId: number) => {
        return await db.select().from(teacherDocuments).where(and(eq(teacherDocuments.schoolId, schoolId), eq(teacherDocuments.teacherId, teacherId)));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (db: DrizzleDB, schoolId: number, data: any) => {
        return await db.insert(teacherDocuments).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(teacherDocuments).where(and(eq(teacherDocuments.id, id), eq(teacherDocuments.schoolId, schoolId))).returning();
    }
};

export const studentsRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(students).where(eq(students.schoolId, schoolId)).orderBy(students.firstName);
    },
    getById: async (db: DrizzleDB, schoolId: number, id: number) => {
        const result = await db.select().from(students).where(and(eq(students.id, id), eq(students.schoolId, schoolId))).limit(1);
        return result[0] || null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        const { id, ...updateData } = data;
        const mappedData = {
            ...updateData,
            schoolId,
            dateOfBirth: updateData.dateOfBirth || updateData.dob,
            admissionDate: updateData.admissionDate || updateData.admittedOn
        };
        delete (mappedData as any).dob;
        delete (mappedData as any).admittedOn;

        if (id) {
            return await db.update(students).set(mappedData).where(and(eq(students.id, id), eq(students.schoolId, schoolId))).returning();
        }
        return await db.insert(students).values(mappedData).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(students).where(and(eq(students.id, id), eq(students.schoolId, schoolId))).returning();
    },
    restore: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.update(students).set({ status: 'Active' }).where(and(eq(students.id, id), eq(students.schoolId, schoolId))).returning();
    },
    restoreBulk: async (db: DrizzleDB, schoolId: number, ids: number[]) => {
        return await db.update(students).set({ status: 'Active' }).where(and(inArray(students.id, ids), eq(students.schoolId, schoolId))).returning();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    promoteBulk: async (db: DrizzleDB, schoolId: number, data: { studentIds: number[]; targetStreamId?: number; status?: string }) => {
        const { studentIds, targetStreamId, status } = data;
        if (targetStreamId) {
            return await db.update(students).set({ streamId: targetStreamId, status: 'Active' }).where(and(inArray(students.id, studentIds), eq(students.schoolId, schoolId))).returning();
        } else if (status) {
            return await db.update(students).set({ status, streamId: null }).where(and(inArray(students.id, studentIds), eq(students.schoolId, schoolId))).returning();
        }
        throw new Error('Either targetStreamId or status must be provided');
    },
    permanentDelete: async (db: DrizzleDB, schoolId: number, id: number) => {
        await db.delete(guardians).where(and(eq(guardians.studentId, id), eq(guardians.schoolId, schoolId)));
        await db.delete(studentDocuments).where(and(eq(studentDocuments.studentId, id), eq(studentDocuments.schoolId, schoolId)));
        return await db.delete(students).where(and(eq(students.id, id), eq(students.schoolId, schoolId))).returning();
    },
    permanentDeleteBulk: async (db: DrizzleDB, schoolId: number, ids: number[]) => {
        if (!ids || ids.length === 0) return [];
        await db.delete(guardians).where(and(inArray(guardians.studentId, ids), eq(guardians.schoolId, schoolId)));
        await db.delete(studentDocuments).where(and(inArray(studentDocuments.studentId, ids), eq(studentDocuments.schoolId, schoolId)));
        return await db.delete(students).where(and(inArray(students.id, ids), eq(students.schoolId, schoolId))).returning();
    },
    getAdmissionPrefix: async (db: DrizzleDB, schoolId: number) => {
        const result = await db.select().from(settings).where(and(eq(settings.key, 'admission_id_prefix'), eq(settings.schoolId, schoolId))).limit(1);
        if (result[0]?.value) return result[0].value;

        const profile = await db.select().from(schoolProfile).where(eq(schoolProfile.schoolId, schoolId)).limit(1);
        if (profile[0]?.name) {
            const initials = profile[0].name.split(/[\s&]+/).map(w => w.charAt(0).toUpperCase()).filter(c => /[A-Z]/.test(c)).join('');
            if (initials.length > 0) return initials;
        }
        return 'STU';
    }
};

export const guardiansRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(guardians).where(eq(guardians.schoolId, schoolId));
    },
    getByStudent: async (db: DrizzleDB, schoolId: number, studentId: number) => {
        return await db.select().from(guardians).where(and(eq(guardians.schoolId, schoolId), eq(guardians.studentId, studentId)));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(guardians).set(data).where(and(eq(guardians.id, data.id), eq(guardians.schoolId, schoolId))).returning();
        }
        return await db.insert(guardians).values({ ...data, schoolId }).returning();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upsertByStudent: async (db: DrizzleDB, schoolId: number, studentId: number, data: any) => {
        const existing = await db.select().from(guardians).where(and(eq(guardians.studentId, studentId), eq(guardians.schoolId, schoolId))).limit(1);
        if (existing.length > 0) {
            return await db.update(guardians).set(data).where(eq(guardians.id, existing[0].id)).returning();
        }
        return await db.insert(guardians).values({ ...data, studentId, schoolId }).returning();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (db: DrizzleDB, schoolId: number, data: any) => {
        return await db.insert(guardians).values({ ...data, schoolId }).returning();
    }
};

export const studentDocumentsRepository = {
    getByStudent: async (db: DrizzleDB, schoolId: number, studentId: number) => {
        return await db.select().from(studentDocuments).where(and(eq(studentDocuments.schoolId, schoolId), eq(studentDocuments.studentId, studentId)));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (db: DrizzleDB, schoolId: number, data: any) => {
        return await db.insert(studentDocuments).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(studentDocuments).where(and(eq(studentDocuments.id, id), eq(studentDocuments.schoolId, schoolId))).returning();
    }
};
