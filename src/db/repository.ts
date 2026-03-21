import { eq, and, sql } from 'drizzle-orm';
import { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { 
    schoolProfile, 
    users, 
    classes, 
    students,
    schools,
    subscriptions,
    subscriptionPlans,
    settings,
    academicYears,
    terms
} from './schema';

// Use a generic SQLite database type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrizzleDB = BaseSQLiteDatabase<any, any, any, any>;

export const repository = {
    schools: {
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
        }
    },
    profile: {
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
    },
    users: {
        getAll: async (db: DrizzleDB, schoolId: number) => {
            return await db.select().from(users).where(eq(users.schoolId, schoolId));
        },
        getByUsername: async (db: DrizzleDB, username: string, schoolId?: number) => {
            const conditions = [eq(users.username, username)];
            if (schoolId !== undefined) conditions.push(eq(users.schoolId, schoolId));
            const result = await db.select().from(users).where(and(...conditions)).limit(1);
            return result[0] || null;
        },
        create: async (db: DrizzleDB, data: any) => {
            const hashedPassword = data.passwordHash || data.password; // Handle both
            return await db.insert(users).values({
                ...data,
                passwordHash: hashedPassword,
            }).returning();
        }
    },
    settings: {
        get: async (db: DrizzleDB, key: string, schoolId?: number) => {
            const conditions = [eq(settings.key, key)];
            if (schoolId !== undefined) conditions.push(eq(settings.schoolId, schoolId));
            const result = await db.select().from(settings).where(and(...conditions)).limit(1);
            return result[0] || null;
        },
        update: async (db: DrizzleDB, key: string, value: string, schoolId: number, category = 'general') => {
            const existing = await db.select().from(settings).where(and(eq(settings.key, key), eq(settings.schoolId, schoolId))).limit(1);
            if (existing.length > 0) {
                return await db.update(settings).set({ value, category }).where(eq(settings.id, existing[0].id)).returning();
            } else {
                return await db.insert(settings).values({ key, value, schoolId, category }).returning();
            }
        },
        hasCompletedSetup: async (db: DrizzleDB, schoolId?: number) => {
            // If schoolId is not provided, we check for ANY user or ANY school profile
            // as a proxy for setup completion for the platform
            const userCount = await db.select({ count: sql`count(*)` }).from(users);
            return (userCount[0] as any).count > 0;
        }
    },
    academicYears: {
        update: async (db: DrizzleDB, schoolId: number, data: any) => {
            if (data.id) {
                return await db.update(academicYears).set(data).where(eq(academicYears.id, data.id)).returning();
            }
            return await db.insert(academicYears).values({ ...data, schoolId }).returning();
        }
    },
    terms: {
        update: async (db: DrizzleDB, schoolId: number, data: any) => {
            if (data.id) {
                return await db.update(terms).set(data).where(eq(terms.id, data.id)).returning();
            }
            return await db.insert(terms).values({ ...data, schoolId }).returning();
        }
    },
    classes: {
        getAll: async (db: DrizzleDB, schoolId: number) => {
            return await db.select().from(classes).where(eq(classes.schoolId, schoolId));
        }
    },
    students: {
        getAll: async (db: DrizzleDB, schoolId: number) => {
            return await db.select().from(students).where(eq(students.schoolId, schoolId));
        }
    },
    subscriptions: {
        getPlans: async (db: DrizzleDB) => {
            return await db.select().from(subscriptionPlans);
        },
        getForSchool: async (db: DrizzleDB, schoolId: number) => {
            return await db.select().from(subscriptions).where(eq(subscriptions.schoolId, schoolId));
        },
        getLatestBySchool: async (db: DrizzleDB, schoolId: number) => {
            const result = await db.select().from(subscriptions)
                .where(eq(subscriptions.schoolId, schoolId))
                .orderBy(sql`${subscriptions.createdAt} DESC`)
                .limit(1);
            return result[0] || null;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: async (db: DrizzleDB, data: any) => {
            return await db.insert(subscriptions).values(data).returning();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update: async (db: DrizzleDB, schoolId: number, data: any) => {
            const latest = await db.select().from(subscriptions)
                .where(eq(subscriptions.schoolId, schoolId))
                .orderBy(sql`${subscriptions.createdAt} DESC`)
                .limit(1);
            if (latest.length > 0) {
                return await db.update(subscriptions).set(data).where(eq(subscriptions.id, latest[0].id)).returning();
            } else {
                return await db.insert(subscriptions).values({ ...data, schoolId }).returning();
            }
        },
        getAll: async (db: DrizzleDB) => {
            return await db.select().from(subscriptions);
        }
    }
};
