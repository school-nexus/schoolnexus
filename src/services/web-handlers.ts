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
    const isInitChannel = channel === 'initialize-database' || channel === 'get-database-status' || channel === 'has-completed-setup';
    
    if (schoolSlug && schoolSlug !== 'localhost' && schoolSlug !== 'app' && !isInitChannel) {
        try {
            const school = await repository.schools.getBySlug(d1, schoolSlug);
            if (school) schoolId = school.id;
        } catch (e) {
            console.warn(`[Web Handlers] Failed to resolve school ID for slug ${schoolSlug} (possibly DB not initialized)`);
        }
    }

    switch (channel) {
        case 'get-platform-stats':
            return await repository.platform.getStats(d1);
        case 'get-recent-schools':
            return await repository.schools.getRecent(d1, 5);
        case 'get-plan-usage-stats':
            return await repository.platform.getPlanUsageStats(d1);
        case 'get-all-schools':
            return await repository.schools.getAll(d1);
        case 'create-school':
            return await repository.schools.create(d1, args[0]);
        case 'get-plans':
            return await repository.subscriptions.getPlans(d1);
        case 'create-plan':
            return await repository.subscriptions.createPlan(d1, args[0]);
        case 'get-subscription-plans':
            return await repository.subscriptions.getPlans(d1);
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
            return await repository.subjects.getAll(d1, schoolId);
        case 'get-academic-years':
            return await repository.academicYears.getAll(d1, schoolId);
        case 'get-terms':
            return await repository.terms.getAll(d1, schoolId);
        case 'get-teacher-report-data':
            return await repository.teachers.getReportData(d1, schoolId);
        case 'get-students':
            return await repository.students.getAll(d1, schoolId);
        case 'get-dashboard-stats':
            return await repository.dashboard.getStats(d1, schoolId);
        case 'get-dashboard-charts-data':
            return await repository.dashboard.getChartsData(d1, schoolId);
        case 'get-school-by-slug':
            return await repository.schools.getBySlug(d1, args[0] as string);
        case 'has-completed-setup': {
            const hasCompleted = await repository.setup.hasCompleted(d1, schoolId);
            console.log(`[Web Handlers] has-completed-setup (ID: ${schoolId}): ${hasCompleted}`);
            return hasCompleted;
        }
        case 'reset-database': {
            const provider = (d1 as any).constructor.name.includes('D1') ? 'Cloudflare D1' : 'Local SQLite';
            if (process.env.NEXT_PUBLIC_PLATFORM !== 'cloudflare' && provider === 'Local SQLite') {
                try {
                    const { resetDatabase, initializeSQLite, getLocalDb } = await import('@/db/index-local');
                    // Reset (close & delete)
                    const resetSuccess = resetDatabase();
                    if (!resetSuccess) throw new Error("Failed to delete database file.");
                    
                    // Re-connect and initialize
                    getLocalDb();
                    const initSuccess = initializeSQLite();
                    return { success: initSuccess, message: initSuccess ? 'Database reset and initialized' : 'Reset successful but initialization failed', provider };
                } catch (e: any) {
                    console.error('[Web Handlers] Reset error:', e);
                    return { success: false, error: e.message, provider };
                }
            }
            return { success: false, message: 'Reset not supported for Cloud provider via this channel', provider };
        }
        case 'initialize-database': {
            const provider = (d1 as any).constructor.name.includes('D1') ? 'Cloudflare D1' : 'Local SQLite';
            if (process.env.NEXT_PUBLIC_PLATFORM !== 'cloudflare' && provider === 'Local SQLite') {
                try {
                    const { initializeSQLite, getLocalDb } = await import('@/db/index-local');
                    // Ensure internal instance is connected
                    getLocalDb();
                    // Hard-apply schema
                    const success = initializeSQLite();
                    return { success, message: success ? 'Local database initialized' : 'Initialization failed', provider };
                } catch (e: any) {
                    console.error('[Web Handlers] Initialization error:', e);
                    return { success: false, error: e.message, provider };
                }
            }
            return { success: true, message: 'Cloud database connection verified', provider };
        }
        case 'get-database-status': {
            const status = await repository.settings.getDatabaseStatus(d1);
            return {
                ...status,
                provider: (d1 as any).constructor.name.includes('D1') ? 'Cloudflare D1' : 'Local SQLite',
                tables: 1, // Placeholder for table count
            };
        }
        case 'complete-setup':
        case 'save-setup-data':
        case 'mark-setup-completed': {
            const setupArgs = args[0] as any;
            const targetId = setupArgs?.schoolId || schoolId;
            const data = setupArgs?.data;
            
            // 1. Save Initial Data if provided
            if (data) {
                await repository.setup.saveInitialData(d1, targetId, data);
            }
            
            // 2. Mark as completed
            if (targetId === 1) {
                await repository.settings.update(d1, 'platform_setup_completed', 'true', 1);
            } else {
                await repository.settings.update(d1, 'setup_completed', 'true', targetId);
            }
            
            return { success: true };
        }
        case 'create-user': {
            const userData = args[0] as any;
            return await repository.users.create(d1, { ...userData, schoolId: userData.role === 'super_admin' ? null : schoolId });
        }
        case 'login-user':
        case 'authenticate': {
            const { username, password, schoolId: targetId } = args[0] as any;
            return await repository.users.authenticate(d1, username, password, targetId);
        }
        case 'update-academic-year':
            return await repository.academicYears.update(d1, schoolId, args[0]);
        case 'update-term':
            return await repository.terms.update(d1, schoolId, args[0]);
        case 'get-all-platform-users':
            return await repository.users.getAllPlatformUsers(d1);
        case 'update-platform-user-status': {
            const userId = args[0] as number;
            const isActive = args[1] as boolean;
            const res = await repository.users.updatePlatformUserStatus(d1, userId, isActive);
            await repository.systemLogs.logAction(d1, `Updated User Status`, null, `User ID: ${userId}, Active: ${isActive}`);
            return res;
        }
        case 'get-current-user':
            return null; // Handled by session mostly
            
        // --- PHASE 2 PLATFORM HANDLERS ---
        case 'get-registration-requests':
            return await repository.schools.getRegistrationRequests(d1);
            
        case 'update-registration-status': {
            const { schoolId: targetSchoolId, status } = args[0] as any;
            const res = await repository.schools.updateStatus(d1, targetSchoolId, status);
            await repository.systemLogs.logAction(d1, `Updated Registration Status to ${status}`, null, `School ID: ${targetSchoolId}`);
            return res;
        }

        case 'get-platform-payment-history':
            return await repository.subscriptions.getPlatformPaymentHistory(d1);
            
        case 'get-system-logs':
            return await repository.systemLogs.getLogs(d1);
            
        case 'get-platform-settings':
            return await repository.settings.getPlatformSettings(d1);
            
        case 'update-platform-setting': {
            const { key, value } = args[0] as any;
            const res = await repository.settings.update(d1, key, value, 1, 'platform');
            await repository.systemLogs.logAction(d1, `Updated Platform Setting`, null, `Key: ${key}, Value: ${value}`);
            return res;
        }

        // ... add more cases as handlers are migrated
        default:
            console.warn(`[Web Handlers] Channel not handled: ${channel}`);
            return null;
    }
};
