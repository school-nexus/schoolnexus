import { eq, and, or } from 'drizzle-orm';
import { users, roles, schools } from '../schema';
import { comparePassword } from '@/lib/auth-utils';
import type { DrizzleDB } from '../repository';

export const usersRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(users).where(eq(users.schoolId, schoolId));
    },
    getAllPlatformUsers: async (db: DrizzleDB) => {
        return await db.select({
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            role: users.role,
            email: users.email,
            isActive: users.isActive,
            createdAt: users.createdAt,
            schoolId: users.schoolId,
            schoolName: schools.name,
            schoolSlug: schools.slug
        })
        .from(users)
        .leftJoin(schools, eq(users.schoolId, schools.id))
        .orderBy(users.id);
    },
    updatePlatformUserStatus: async (db: DrizzleDB, userId: number, isActive: boolean) => {
        return await db.update(users).set({ isActive }).where(eq(users.id, userId)).returning();
    },
    getByUsername: async (db: DrizzleDB, username: string, schoolId?: number) => {
        const conditions = [eq(users.username, username)];
        if (schoolId !== undefined) conditions.push(eq(users.schoolId, schoolId));
        const result = await db.select().from(users).where(and(...conditions)).limit(1);
        return result[0] || null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (db: DrizzleDB, data: any) => {
        const hashedPassword = data.passwordHash || data.password;
        return await db.insert(users).values({
            ...data,
            passwordHash: hashedPassword,
        }).returning();
    },
    hasSuperAdmin: async (db: DrizzleDB) => {
        try {
            const result = await db.select({ id: users.id })
                .from(users)
                .where(eq(users.role, 'super_admin'))
                .limit(1);
            return result.length > 0;
        } catch (error) {
            return false;
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        const { id, password, ...updateData } = data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const set: any = { ...updateData };
        return await db.update(users).set(set).where(and(eq(users.id, id), eq(users.schoolId, schoolId))).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(users).where(and(eq(users.id, id), eq(users.schoolId, schoolId))).returning();
    },
    getById: async (db: DrizzleDB, schoolId: number, id: number) => {
        const result = await db.select().from(users).where(and(eq(users.id, id), eq(users.schoolId, schoolId))).limit(1);
        return result[0] || null;
    },
    getByRole: async (db: DrizzleDB, schoolId: number, role: string) => {
        return await db.select().from(users).where(and(eq(users.role, role), eq(users.schoolId, schoolId)));
    },
    resetPassword: async (db: DrizzleDB, schoolId: number, userId: number, passwordHash: string) => {
        return await db.update(users).set({ passwordHash }).where(and(eq(users.id, userId), eq(users.schoolId, schoolId))).returning();
    },
    authenticate: async (db: DrizzleDB, usernameOrEmail: string, password: string, schoolId?: number) => {
        const results = await db.select()
            .from(users)
            .where(
                and(
                    or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail)),
                    schoolId !== undefined ? eq(users.schoolId, schoolId) : eq(users.role, 'super_admin')
                )
            )
            .limit(1);

        const user = results[0];
        if (!user || !user.passwordHash) return null;

        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) return null;

        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
    }
};

export const rolesRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(roles).where(eq(roles.schoolId, schoolId)).orderBy(roles.id);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(roles).set(data).where(and(eq(roles.id, data.id), eq(roles.schoolId, schoolId))).returning();
        }
        return await db.insert(roles).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(roles).where(and(eq(roles.id, id), eq(roles.schoolId, schoolId))).returning();
    }
};
