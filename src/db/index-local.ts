import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from './schema';
import fs from 'fs';

let dbInstance: any = null;
let sqlite: any = null;

export const initializeSQLite = (dbInstance?: any) => {
    const target = dbInstance || sqlite;
    if (!target) {
        console.error('[Local DB] Cannot initialize: No SQLite instance available.');
        return false;
    }

    console.log('[Local DB] Initializing database schema...');
    const migrationPath = path.resolve(process.cwd(), 'drizzle', '0000_initial.sql');
    
    if (fs.existsSync(migrationPath)) {
        try {
            const sqlContent = fs.readFileSync(migrationPath, 'utf8');
            // Split by statement-breakpoint (Drizzle standard)
            const statements = sqlContent.split('--> statement-breakpoint');
            
            // Disable FKs during schema creation to avoid dependency order issues
            target.exec("PRAGMA foreign_keys = OFF;");
            
            for (let statement of statements) {
                statement = statement.trim();
                if (statement) {
                    try {
                        target.exec(statement);
                    } catch (err) {
                        console.error(`[Local DB] Statement failed: ${statement.substring(0, 50)}...`, err);
                        // Continue if it's just "already exists" but throw on others
                        if (!(err as any).message.includes('already exists')) {
                            throw err;
                        }
                    }
                }
            }
            
            target.exec("PRAGMA foreign_keys = ON;");
            console.log('[Local DB] Initial schema applied successfully.');
            return true;
        } catch (error) {
            console.error('[Local DB] Failed to apply schema:', error);
            // Ensure FKs are re-enabled even on failure
            try { target.exec("PRAGMA foreign_keys = ON;"); } catch (e) {}
            return false;
        }
    } else {
        console.warn(`[Local DB] Migration file not found at ${migrationPath}. Database may be empty.`);
        return false;
    }
};

export const getLocalDb = () => {
    if (dbInstance) return dbInstance;

    try {
        const dataDir = path.resolve(process.cwd(), '.db-data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const dbPath = path.join(dataDir, 'school-nexus-local.db');
        const fileExists = fs.existsSync(dbPath);
        
        console.log(`[Local DB] Connecting to persistent SQLite: ${dbPath}`);
        
        sqlite = new Database(dbPath);
        dbInstance = drizzle(sqlite, { schema });

        // Check if schema is missing (even if file exists)
        const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schools'").get();
        if (!tables) {
            console.log('[Local DB] Schools table missing. Initializing schema...');
            initializeSQLite(sqlite);
        }

        return dbInstance;
    } catch (error) {
        console.error('[Local DB] Failed to initialize local SQLite:', error);
        throw error;
    }
};

export const closeLocalDb = () => {
    if (sqlite) {
        sqlite.close();
        dbInstance = null;
        sqlite = null;
    }
};
export const resetDatabase = () => {
    closeLocalDb();
    const dbPath = path.resolve(process.cwd(), '.db-data', 'school-nexus-local.db');
    
    // Attempt deletion
    if (fs.existsSync(dbPath)) {
        try {
            fs.unlinkSync(dbPath);
            console.log(`[Local DB] Database file deleted: ${dbPath}`);
            return true;
        } catch (error) {
            console.warn('[Local DB] File protected. Falling back to DROP TABLE...', error);
        }
    }

    // Fallback: Drop all tables
    try {
        const tempSqlite = new Database(dbPath);
        const tables = tempSqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
        
        tempSqlite.exec("PRAGMA foreign_keys = OFF;");
        for (const table of tables) {
            console.log(`[Local DB] Dropping table: ${table.name}`);
            tempSqlite.exec(`DROP TABLE IF EXISTS "${table.name}"`);
        }
        tempSqlite.exec("PRAGMA foreign_keys = ON;");
        tempSqlite.close();
        return true;
    } catch (error) {
        console.error('[Local DB] Reset failed completely:', error);
        return false;
    }
};
