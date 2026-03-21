import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

let dbInstance: any = null;

export const getWebDb = (d1Binding?: any) => {
    if (d1Binding) {
        dbInstance = drizzle(d1Binding, { schema });
        return dbInstance;
    }
    
    if (!dbInstance) {
        // In local development with Next.js + Cloudflare, DB might be on process.env.DB
        const localDB = (process.env as any).DB;
        if (localDB) {
            dbInstance = drizzle(localDB, { schema });
        }
    }
    
    return dbInstance;
};

export { dbInstance as db };
