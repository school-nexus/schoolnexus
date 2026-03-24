import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    return NextResponse.json({ 
        status: 'ok', 
        platform: process.env.NEXT_PUBLIC_PLATFORM,
        time: new Date().toISOString()
    });
}
