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
        const env = context.env as unknown as CloudflareEnv;
        
        if (!env || !env.DB) {
            return NextResponse.json({ error: 'Database binding not found' }, { status: 500 });
        }

        const db = getWebDb(env.DB);
        
        // Attach BUCKET to the db object for the handlers
        (db as any).BUCKET = env.BUCKET;

        // Extract school slug from headers (set by middleware)
        const schoolSlug = request.headers.get('x-school-slug') || undefined;
        
        const result = await handleWebRequest(
            db,
            channel,
            args || [],
            schoolSlug
        );
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[RPC API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
