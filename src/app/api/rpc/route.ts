import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db/get-db';
import { handleWebRequest } from '@/services/web-handlers';

// Use Node.js runtime to support local SQLite (better-sqlite3)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { channel: string; args: any[] };
        const { channel, args } = body;
        
        const db = await getDb();

        if (!db) {
            return NextResponse.json({ 
                error: 'Database not available',
                details: 'Could not connect to the database. Check NEXT_PUBLIC_PLATFORM in .env.',
            }, { status: 500 });
        }

        // Extract school slug from headers (set by middleware)
        const schoolSlug = request.headers.get('x-school-slug') || undefined;
        
        console.log('[RPC API] Handling request', { 
            channel, 
            schoolSlug, 
            platform: process.env.NEXT_PUBLIC_PLATFORM || 'local',
        });

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
