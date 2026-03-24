/**
 * Central database resolver for the Next.js web app.
 * Routes to the correct database based on the NEXT_PUBLIC_PLATFORM env var:
 * - 'cloudflare' → Cloudflare D1 via getRequestContext()
 * - 'local' (default) → Local SQLite via better-sqlite3
 */

let cachedDb: any = null;

export const getDb = async () => {
    const platform = process.env.NEXT_PUBLIC_PLATFORM || 'local';

    if (platform === 'cloudflare') {
        if (cachedDb) return cachedDb;
        // Production: Use Cloudflare D1 binding
        try {
            const { getRequestContext } = await import('@cloudflare/next-on-pages');
            const context = getRequestContext();
            if (context?.env?.DB) {
                const { drizzle } = await import('drizzle-orm/d1');
                const schema = await import('./schema');
                cachedDb = drizzle(context.env.DB, { schema });
                console.log('[DB] Connected to Cloudflare D1');
                return cachedDb;
            }
        } catch (e) {
            console.error('[DB] Failed to get Cloudflare D1 context:', e);
        }
        throw new Error('Cloudflare D1 binding "DB" not found. Ensure D1 is configured in wrangler.toml and Cloudflare Pages dashboard.');
    }

    // Local development: Use local SQLite via better-sqlite3
    // We don't cache locally in getDb because getLocalDb() handles its own singleton 
    // and supports closing/reopening (e.g. during reset)
    const { getLocalDb } = await import('./index-local');
    return getLocalDb();
};
