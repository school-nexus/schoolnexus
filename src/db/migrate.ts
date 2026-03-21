import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index.js';

// This script runs migrations on the database
try {
    console.log('Running migrations...');
    migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully.');
} catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
}
