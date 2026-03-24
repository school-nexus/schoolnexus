import { NextRequest, NextResponse } from 'next/server';



export async function GET(request: NextRequest) {
    try {
        const platform = process.env.NEXT_PUBLIC_PLATFORM || 'local';
        
        let dbStatus = 'unknown';
        let dbProvider = platform === 'cloudflare' ? 'Cloudflare D1' : 'Local SQLite';

        // Try to connect to DB to verify it works
        try {
            const { getDb } = await import('@/db/get-db');
            const db = await getDb();
            dbStatus = db ? 'connected' : 'not connected';
        } catch (e: any) {
            dbStatus = `error: ${e.message}`;
        }

        const debugInfo = {
            timestamp: new Date().toISOString(),
            platform,
            dbProvider,
            dbStatus,
            nodeEnv: process.env.NODE_ENV,
            headers: {
                host: request.headers.get('host'),
                xSchoolSlug: request.headers.get('x-school-slug')
            }
        };

        return new NextResponse(
            `<html>
                <head>
                    <title>Infrastructure Debug - School Nexus</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; background: #f8fafc; color: #0f172a; line-height: 1.5; }
                        .card { background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 800px; margin: 0 auto; }
                        h1 { font-weight: 900; margin-top: 0; color: #059669; }
                        pre { background: #1e293b; color: #f8fafc; padding: 1.5rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.875rem; }
                        .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
                        .success { background: #dcfce7; color: #166534; }
                        .error { background: #fee2e2; color: #991b1b; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Infrastructure Diagnostics</h1>
                        <p>Platform: <b>${platform}</b> | DB Provider: <b>${dbProvider}</b></p>
                        
                        <div style="margin: 2rem 0;">
                            <p>Database Connection: 
                                <span class="status ${dbStatus === 'connected' ? 'success' : 'error'}">
                                    ${dbStatus}
                                </span>
                            </p>
                        </div>

                        <h2>Environment Dump</h2>
                        <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
                        
                        <p style="margin-top: 2rem; font-size: 0.75rem; color: #64748b;">
                            Path: /api/debug | Architecture: Platform-Aware
                        </p>
                    </div>
                </body>
            </html>`,
            {
                headers: { 'Content-Type': 'text/html' }
            }
        );
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
