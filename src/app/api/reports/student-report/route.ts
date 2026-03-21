import { NextRequest, NextResponse } from 'next/server';
import { getStudentReportDataWebApi } from '@/lib/web-db-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const termId = searchParams.get('termId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const reportData = await getStudentReportDataWebApi(
      parseInt(studentId),
      termId ? parseInt(termId) : undefined
    );

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}
