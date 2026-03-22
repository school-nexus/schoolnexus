import { repository, type DrizzleDB } from '@/db/repository';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '@/db/schema';

/**
 * Handle database requests in Web mode by calling the repository directly.
 */
export const handleWebRequest = async (db: unknown, channel: string, args: unknown[], schoolSlug?: string) => {
    if (!db) throw new Error("Web Database not provided");
    const d1 = db as DrizzleDB;

    // Resolve school ID from slug
    let schoolId = 1;
    if (schoolSlug && schoolSlug !== 'localhost' && schoolSlug !== 'app') {
        const school = await repository.schools.getBySlug(d1, schoolSlug);
        if (school) schoolId = school.id;
    }

    switch (channel) {
        case 'get-platform-stats': {
            const schoolsCount = await d1.select({ count: sql`count(*)` }).from(schema.schools);
            const usersCount = await d1.select({ count: sql`count(*)` }).from(schema.users).where(and(eq(schema.users.isActive, true), sql`${schema.users.schoolId} IS NOT NULL`));
            return {
                totalSchools: Number((schoolsCount[0] as any).count || 0),
                activeUsers: Number((usersCount[0] as any).count || 0),
                systemStatus: 'Healthy'
            };
        }
        case 'get-recent-schools':
            return await d1.select().from(schema.schools).orderBy(sql`${schema.schools.createdAt} DESC`).limit(5);
        case 'get-plan-usage-stats': {
            const plans = await d1.select().from(schema.subscriptionPlans);
            const stats = await Promise.all(plans.map(async (plan) => {
                const count = await d1.select({ count: sql`count(*)` }).from(schema.subscriptions).where(eq(schema.subscriptions.planId, plan.id));
                return {
                    name: plan.name,
                    price: plan.termlyPrice,
                    count: Number((count[0] as any).count || 0)
                };
            }));
            return stats;
        }
        case 'get-all-schools':
            return await repository.schools.getAll(d1);
        case 'create-school':
            return await repository.schools.create(d1, args[0]);
        case 'get-plans':
            return await repository.subscriptions.getPlans(d1);
        case 'get-subscription-plans':
            return await d1.select().from(schema.subscriptionPlans);
        case 'get-school-subscription':
            return await repository.subscriptions.getForSchool(d1, (args[0] as number) || schoolId);
        case 'get-active-subscription':
            return await repository.subscriptions.getLatestBySchool(d1, (args[0] as number) || schoolId);
        case 'update-school-subscription':
            return await repository.subscriptions.update(d1, args[0] as number, args[1]);
        case 'get-school-profile':
            return await repository.profile.get(d1, schoolId);
        case 'update-school-profile':
            return await repository.profile.update(d1, schoolId, args[0]);
        case 'save-file': {
            const { fileBuffer, category, id, fileName } = args[0] as { fileBuffer: ArrayBuffer; category: string; id: string; fileName: string };
            const key = `${category}/${id}/${fileName}`;
            
            // In Cloudflare context, BUCKET is available via getRequestContext()
            // But since this is called from the RPC route, we should pass the bucket instance
            const bucket = (d1 as unknown as Record<string, unknown>).BUCKET as R2Bucket || (globalThis as unknown as Record<string, unknown>).BUCKET as R2Bucket;
            if (!bucket) throw new Error("R2 Bucket not found");

            await bucket.put(key, fileBuffer);
            return key; // Return the path for the /api/files/ proxy
        }
        case 'delete-file': {
            const relativePath = args[0] as string;
            const bucket = (d1 as unknown as Record<string, unknown>).BUCKET as R2Bucket || (globalThis as unknown as Record<string, unknown>).BUCKET as R2Bucket;
            if (!bucket) throw new Error("R2 Bucket not found");

            await bucket.delete(relativePath);
            return true;
        }
        case 'get-users':
            return await repository.users.getAll(d1, schoolId);
        case 'get-classes':
            return await repository.classes.getAll(d1, schoolId);
        case 'get-subjects':
            return await d1.select().from(schema.subjects).where(eq(schema.subjects.schoolId, schoolId));
        case 'get-academic-years':
            return await d1.select().from(schema.academicYears).where(eq(schema.academicYears.schoolId, schoolId));
        case 'get-terms':
            return await d1.select().from(schema.terms).where(eq(schema.terms.schoolId, schoolId));
        case 'get-teacher-report-data': {
            const teachers = await d1.select().from(schema.teachers).where(eq(schema.teachers.schoolId, schoolId));
            return teachers.map(t => ({
                ...t,
                qualifications: (t as any).qualification // Align with UI expectations
            }));
        }
        case 'get-students':
            return await repository.students.getAll(d1, schoolId);
        case 'get-dashboard-stats':
            return await repository.dashboard.getStats(d1, schoolId);
        case 'get-dashboard-charts-data':
            return await repository.dashboard.getChartsData(d1, schoolId);
        case 'get-school-by-slug':
            return await repository.schools.getBySlug(d1, args[0] as string);
        case 'has-completed-setup':
            return await repository.settings.hasCompletedSetup(d1, schoolId);
        case 'initialize-database':
            return { success: true, message: "D1 is already initialized via migrations" };
        case 'create-school':
            return await repository.schools.create(d1, args[0]);
        case 'complete-setup':
        case 'mark-setup-completed':
            if (schoolId === 1) {
                return await repository.settings.update(d1, 'platform_setup_completed', 'true', 1);
            }
            return await repository.settings.update(d1, 'setup_completed', 'true', schoolId);
        case 'save-setup-data': {
            const data = args[0] as any;
            const { schoolInfo, academicYear } = data;
            
            // 1. Create/Update Profile
            await repository.profile.update(d1, schoolId, {
                name: schoolInfo.name,
                phone: schoolInfo.phone,
                email: schoolInfo.email,
                address: schoolInfo.address,
                motto: schoolInfo.motto,
                currency: schoolInfo.currency || 'UGX',
                website: schoolInfo.website,
                registrationNumber: schoolInfo.registrationNumber
            });

            // 2. Create Academic Year
            if (academicYear.name) {
                const [year] = await repository.academicYears.update(d1, schoolId, {
                    name: academicYear.name,
                    startDate: academicYear.startDate,
                    endDate: academicYear.endDate,
                    isActive: true
                });

                // 3. Create Terms
                if (year && academicYear.terms) {
                    for (const term of academicYear.terms) {
                        await repository.terms.update(d1, schoolId, {
                            academicYearId: (year as any).id,
                            name: term.name,
                            startDate: term.startDate,
                            endDate: term.endDate,
                            isActive: term.isActive
                        });
                    }
                }
            }

            return { success: true };
        }
        case 'create-user': {
            const userData = args[0] as any;
            return await repository.users.create(d1, { ...userData, schoolId: userData.role === 'super_admin' ? null : schoolId });
        }
        case 'authenticate': {
            const { username, password } = args[0] as any;
            const user = await repository.users.getByUsername(d1, username);
            if (user && (user.passwordHash === password)) { // Simplify for now, bcrypt later
                return user;
            }
            return null;
        }
        case 'update-academic-year':
            return await repository.academicYears.update(d1, schoolId, args[0]);
        case 'update-term':
            return await repository.terms.update(d1, schoolId, args[0]);
        case 'initialize-database':
            return { success: true, message: "Cloudflare D1 is pre-initialized via migrations" };
        case 'get-current-user':
            return null; // Handled by session mostly
        // ... add more cases as handlers are migrated
        default:
            console.warn(`[Web Handlers] Channel not handled: ${channel}`);
            return null;
    }
};
