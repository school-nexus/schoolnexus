import { NextRequest, NextResponse } from 'next/server';
import { getStudentsWebApi } from '@/lib/web-db-api';

export async function GET() {
  try {
    const students = await getStudentsWebApi();

    return NextResponse.json(students);
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
