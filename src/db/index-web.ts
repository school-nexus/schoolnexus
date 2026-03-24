/**
 * Web Database Adapter (Cloudflare D1 only)
 * 
 * This module is used exclusively when NEXT_PUBLIC_PLATFORM=cloudflare.
 * For local development, use get-db.ts which routes to index-local.ts.
 */
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

let dbInstance: any = null;

export const getWebDb = (d1Binding: any) => {
    if (!d1Binding) {
        throw new Error('[Web DB] D1 binding is required. This module should only be used in Cloudflare mode.');
    }
    
    if (!dbInstance) {
        dbInstance = drizzle(d1Binding, { schema });
    }
    
    return dbInstance;
};

export { dbInstance as db };
