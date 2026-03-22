import { NextRequest, NextResponse } from 'next/server';
import { getWebDb } from '@/db/index-web';
import { handleWebRequest } from '@/services/web-handlers';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';


export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { channel: string; args: any[] };
        const { channel, args } = body;
        
        const context = getRequestContext();
        const env = (context?.env || {}) as unknown as CloudflareEnv;
        
        if (!env || !env.DB) {
            const availableKeys = Object.keys(env);
            console.error('[RPC API] Database binding (DB) missing!', { 
                hasContext: !!context,
                availableKeys,
                message: 'Check Cloudflare Pages -> Settings -> Functions -> D1 database bindings'
            });
            
            return NextResponse.json({ 
                error: 'Database binding not found',
                details: 'The D1 database binding "DB" is missing in the Cloudflare environment.',
                action: 'Link a D1 database with variable name "DB" in the Cloudflare Pages dashboard.',
                debug: { availableKeys }
            }, { status: 500 });
        }

        const db = getWebDb(env.DB);
        
        // Attach BUCKET to the db object for the handlers
        (db as any).BUCKET = env.BUCKET;

        // Extract school slug from headers (set by middleware)
        const schoolSlug = request.headers.get('x-school-slug') || undefined;
        
        console.log('[RPC API] Handling web request', { 
            channel, 
            schoolSlug, 
            timestamp: new Date().toISOString(),
            route: '/api/rpc'
        });

        const result = await handleWebRequest(
            db,
            channel,
            args || [],
            schoolSlug
        );
        
        console.log('[RPC API] Web request handled successfully', { 
            channel, 
            schoolSlug, 
            timestamp: new Date().toISOString(),
            route: '/api/rpc',
            status: 200
        });
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[RPC API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
