import { NextResponse } from 'next/server';



export async function GET() {
    return NextResponse.json({ 
        status: 'ok', 
        platform: process.env.NEXT_PUBLIC_PLATFORM,
        time: new Date().toISOString()
    });
}
