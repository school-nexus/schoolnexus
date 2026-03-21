import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Database connection
const sqlite = new Database('school-nexus.db');
export const db = drizzle(sqlite, { schema });

export default db;