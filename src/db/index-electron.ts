import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from './schema.js';
import { app } from 'electron';
import { logDebug } from '../lib/logger.js';

// In production, the DB file should be in the user's data directory
// For dev, we can keep it in the project root
const dbPath = (() => {
    try {
        // Try to use app data directory for packaged apps
        const isProduction = process.env.NODE_ENV === 'production' || (app?.isPackaged ?? false);
        if (isProduction && app?.getPath) {
            const userDataPath = app.getPath('userData');
            const targetPath = path.join(userDataPath, 'school-nexus.db');
            logDebug(`[DB] Using production database path: ${targetPath}`);
            return targetPath;
        }
    } catch (e) {
        // Fall back if app context not available
        logDebug('[DB] Could not determine app path, using current directory', e);
    }
    const fallbackPath = path.resolve('school-nexus.db');
    logDebug(`[DB] Using fallback database path: ${fallbackPath}`);
    return fallbackPath;
})();

export let sqlite: any;
export let db: any;

export const runMigrations = async () => {
    if (!db) {
        logDebug('[DB] Cannot run migrations: db is undefined');
        return;
    }
    try {
        logDebug('[DB] Starting database migrations...');
        
        // Import fs dynamically to avoid import issues
        const fs = await import('fs');
        
        // Determine migrations path based on whether app is packaged
        // For unpacked ASAR resources, we should check both appPath and appPath.unpacked
        let appPath = app?.getAppPath() || process.cwd();
        
        // If appPath ends with app.asar, try to find the unpacked version
        if (appPath.endsWith('app.asar')) {
            const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
            if (fs.existsSync(path.join(unpackedPath, 'drizzle'))) {
                logDebug(`[DB] Detected unpacked ASAR, using: ${unpackedPath}`);
                appPath = unpackedPath;
            }
        }
        
        const migrationsPath = path.resolve(appPath, 'drizzle');
        logDebug(`[DB] Migration directory: ${migrationsPath}`);
        
        if (!fs.existsSync(migrationsPath)) {
            logDebug(`[DB] WARNING: Migrations directory not found at: ${migrationsPath}`);
            // Attempt a secondary search in resourcesPath
            if (process.resourcesPath) {
                const altPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'drizzle');
                logDebug(`[DB] Checking alternative path: ${altPath}`);
                if (fs.existsSync(altPath)) {
                    logDebug('[DB] Found migrations in alternative path');
                    migrate(db, { migrationsFolder: altPath });
                    return;
                }
            }
        } else {
            migrate(db, { migrationsFolder: migrationsPath });
            logDebug('[DB] Migrations completed successfully');
        }
    } catch (error) {
        logDebug('[DB] Error during migrations', error);
    }
};

export const initializeDatabase = async () => {
    try {
        sqlite = new Database(dbPath);
        db = drizzle(sqlite, { schema });
        
        // 1. Run core Drizzle migrations
        await runMigrations();
        
        
        logDebug('[DB] Database initialization sequence complete');
        return { db, sqlite };
    } catch (error) {
        logDebug('[DB] critical: Failed to initialize database', error);
        throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const closeDatabase = () => {
    if (sqlite) {
        try {
            sqlite.close();
        } catch (error) {
            console.error('Error closing database:', error);
        }
    }
};

export const getDbPath = () => dbPath;

// Only initialize database in Electron context, not in Next.js dev server
// Check if we're in Electron environment (window.require exists)
const isElectron = typeof window !== 'undefined' && (window as any).require;

if (isElectron) {
    // Initial initialize
    initializeDatabase();
}