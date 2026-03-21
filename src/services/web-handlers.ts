import { repository, type DrizzleDB } from '@/db/repository';
import * as schema from '../db/schema';

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
        case 'get-students':
            return await repository.students.getAll(d1, schoolId);
        case 'has-completed-setup':
            return await repository.settings.hasCompletedSetup(d1);
        case 'mark-setup-completed':
            return await repository.settings.update(d1, 'setup_completed', 'true', schoolId);
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
