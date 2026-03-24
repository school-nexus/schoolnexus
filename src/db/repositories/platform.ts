import { eq, and, sql, desc } from 'drizzle-orm';
import { schools, users, subscriptionPlans, subscriptions, systemLogs } from '../schema';
import type { DrizzleDB } from '../repository';

export const platformRepository = {
    getStats: async (db: DrizzleDB) => {
        const schoolsCount = await db.select({ count: sql`count(*)` }).from(schools);
        const usersCount = await db.select({ count: sql`count(*)` }).from(users).where(and(eq(users.isActive, true), sql`${users.schoolId} IS NOT NULL`));
        return {
            totalSchools: Number((schoolsCount[0] as any).count || 0),
            activeUsers: Number((usersCount[0] as any).count || 0),
            systemStatus: 'Healthy'
        };
    },
    getPlanUsageStats: async (db: DrizzleDB) => {
        const plans = await db.select().from(subscriptionPlans);
        return await Promise.all(plans.map(async (plan) => {
            const countResult = await db.select({ count: sql`count(*)` }).from(subscriptions).where(eq(subscriptions.planId, plan.id));
            return {
                name: plan.name,
                price: plan.termlyPrice,
                count: Number((countResult[0] as any).count || 0)
            };
        }));
    }
};

export const subscriptionsRepository = {
    getPlans: async (db: DrizzleDB) => {
        return await db.select().from(subscriptionPlans);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createPlan: async (db: DrizzleDB, data: any) => {
        return await db.insert(subscriptionPlans).values(data).returning();
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
    },
    getPlatformPaymentHistory: async (db: DrizzleDB) => {
        return await db.select({
            id: subscriptions.id,
            schoolId: subscriptions.schoolId,
            schoolName: schools.name,
            planName: subscriptionPlans.name,
            status: subscriptions.status,
            billingCycle: subscriptions.billingCycle,
            startDate: subscriptions.startDate,
            endDate: subscriptions.endDate,
            lastPaymentDate: subscriptions.lastPaymentDate,
            price: subscriptionPlans.termlyPrice
        })
        .from(subscriptions)
        .leftJoin(schools, eq(subscriptions.schoolId, schools.id))
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .orderBy(desc(subscriptions.createdAt));
    }
};

export const systemLogsRepository = {
    getLogs: async (db: DrizzleDB) => {
        return await db.select({
            id: systemLogs.id,
            action: systemLogs.action,
            actorId: systemLogs.actorId,
            actorName: users.fullName,
            details: systemLogs.details,
            timestamp: systemLogs.timestamp
        })
        .from(systemLogs)
        .leftJoin(users, eq(systemLogs.actorId, users.id))
        .orderBy(desc(systemLogs.timestamp))
        .limit(100);
    },
    logAction: async (db: DrizzleDB, action: string, actorId: number | null, details: string) => {
        return await db.insert(systemLogs).values({ action, actorId, details }).returning();
    }
};
