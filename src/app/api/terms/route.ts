import { NextRequest, NextResponse } from 'next/server';
import { getTermsWebApi } from '@/lib/web-db-api';

export const runtime = 'edge';

export async function GET() {
  try {
    const terms = await getTermsWebApi();

    return NextResponse.json(terms);
  } catch (error) {
    console.error('Failed to fetch terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terms' },
      { status: 500 }
    );
  }
}
