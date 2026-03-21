import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { env } = getRequestContext();
  const { path } = await params;
  const filePath = path.join('/');

  try {
    const object = await env.BUCKET.get(filePath);

    if (!object) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(object.body, {
      headers,
    });
  } catch (error) {
    console.error('[R2 Get] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
