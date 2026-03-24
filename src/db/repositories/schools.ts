import { eq, and, sql, desc } from 'drizzle-orm';
import { schools, schoolProfile, backups } from '../schema';
import type { DrizzleDB } from '../repository';

export const schoolsRepository = {
    getAll: async (db: DrizzleDB) => {
        return await db.select().from(schools);
    },
    getBySlug: async (db: DrizzleDB, slug: string) => {
        const result = await db.select().from(schools).where(eq(schools.slug, slug)).limit(1);
        return result[0] || null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (db: DrizzleDB, data: any) => {
        return await db.insert(schools).values(data).returning();
    },
    getRecent: async (db: DrizzleDB, limit: number = 5) => {
        return await db.select().from(schools).orderBy(desc(schools.createdAt)).limit(limit);
    },
    getRegistrationRequests: async (db: DrizzleDB) => {
        return await db.select().from(schools).where(eq(schools.status, 'Pending')).orderBy(desc(schools.createdAt));
    },
    updateStatus: async (db: DrizzleDB, schoolId: number, status: string) => {
        return await db.update(schools).set({ status }).where(eq(schools.id, schoolId)).returning();
    }
};

export const profileRepository = {
    get: async (db: DrizzleDB, schoolId: number) => {
        const result = await db.select().from(schoolProfile).where(eq(schoolProfile.schoolId, schoolId)).limit(1);
        return result[0] || null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        const existing = await db.select().from(schoolProfile).where(eq(schoolProfile.schoolId, schoolId)).limit(1);
        if (existing.length > 0) {
            return await db.update(schoolProfile).set(data).where(eq(schoolProfile.id, existing[0].id)).returning();
        } else {
            return await db.insert(schoolProfile).values({ ...data, schoolId }).returning();
        }
    }
};

export const backupsRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(backups).where(eq(backups.schoolId, schoolId)).orderBy(sql`${backups.createdAt} DESC`);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record: async (db: DrizzleDB, schoolId: number, data: any) => {
        return await db.insert(backups).values({ ...data, schoolId }).returning();
    },
    getById: async (db: DrizzleDB, schoolId: number, id: number) => {
        const result = await db.select().from(backups).where(and(eq(backups.id, id), eq(backups.schoolId, schoolId))).limit(1);
        return result[0] || null;
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(backups).where(and(eq(backups.id, id), eq(backups.schoolId, schoolId))).returning();
    }
};
