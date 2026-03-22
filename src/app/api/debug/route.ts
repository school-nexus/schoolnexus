import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const context = getRequestContext();
        const env = (context?.env || {}) as any;
        const envKeys = Object.keys(env);
        
        const debugInfo = {
            timestamp: new Date().toISOString(),
            runtime: 'edge',
            hasRequestContext: !!context,
            availableEnvKeys: envKeys,
            dbBindingFound: envKeys.includes('DB'),
            bucketBindingFound: envKeys.includes('BUCKET'),
            platformDomain: env.NEXT_PUBLIC_PLATFORM_DOMAIN || env.PLATFORM_DOMAIN || 'Not found',
            nodeEnv: process.env.NODE_ENV,
            headers: {
                host: request.headers.get('host'),
                userAgent: request.headers.get('user-agent'),
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
                        .instruction { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; margin-top: 2rem; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>Infrastructure Diagnostics</h1>
                        <p>This page directly probes the Cloudflare Edge environment.</p>
                        
                        <div style="margin: 2rem 0;">
                            <p>D1 Database Connection: 
                                <span class="status ${debugInfo.dbBindingFound ? 'success' : 'error'}">
                                    ${debugInfo.dbBindingFound ? 'Linked' : 'Missing'}
                                </span>
                            </p>
                            <p>R2 Bucket Connection: 
                                <span class="status ${debugInfo.bucketBindingFound ? 'success' : 'error'}">
                                    ${debugInfo.bucketBindingFound ? 'Linked' : 'Missing'}
                                </span>
                            </p>
                        </div>

                        <h2>Environment Dump (Keys Only)</h2>
                        <pre>${JSON.stringify(debugInfo, null, 2)}</pre>

                        ${!debugInfo.dbBindingFound ? `
                            <div class="instruction">
                                <b>Action Required:</b> Link your D1 database in the Cloudflare Pages Dashboard. 
                                <ol>
                                    <li>Pages Dashboard &rarr; Settings &rarr; Functions</li>
                                    <li>Link <b>school-nexus-db</b> with variable name <b>DB</b></li>
                                </ol>
                            </div>
                        ` : ''}
                        
                        <p style="margin-top: 2rem; font-size: 0.75rem; color: #64748b;">
                            Path: /api/debug | Architecture: Native-Path-V3
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
