import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'experimental-edge';

export default function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;

    // 1. Skip internal paths and assets
    if (
        pathname.startsWith('/_next') || 
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/logo.png') ||
        pathname.includes('.') 
    ) {
        return NextResponse.next();
    }

    const requestHeaders = new Headers(request.headers);
    
    // 2. Identify Tenant (Pure Path Strategy)
    const pathParts = pathname.split('/').filter(Boolean);
    const firstSegment = pathParts[0];
    
    const reserved = [
        'setup', 'super-admin', 'login', 'dashboard', 'teachers', 'students', 
        'classes', 'subjects', 'exams', 'attendance', 'fees', 'accounts', 
        'settings', 'reports', 'admin-setup', 'platform-setup'
    ];

    let schoolSlug = 'platform';
    let shouldRewrite = false;

    if (firstSegment && !reserved.includes(firstSegment)) {
        schoolSlug = firstSegment;
        shouldRewrite = true;
    }

    // 3. Set Context Headers
    requestHeaders.set('x-school-slug', schoolSlug);

    // 4. Determine Active Page and Redirection Policy
    // NOTE: In Next.js Middleware on Cloudflare, we can't easily query D1 synchronous.
    // Instead, we let the Server Page (/login, /dashboard) handle the setup check.
    // However, we MUST ensure /[slug]/login rewrites to /login correctly.

    if (shouldRewrite) {
        // Internal rewrite: /demo/login -> /login
        const newUrl = new URL(request.nextUrl);
        newUrl.pathname = '/' + pathParts.slice(1).join('/') || '/';
        
        const response = NextResponse.rewrite(newUrl, {
            request: {
                headers: requestHeaders,
            },
        });
        
        response.cookies.set('x-school-slug', schoolSlug, { path: '/', maxAge: 60 * 60 * 24 });
        return response;
    }

    // Platform mode (Root)
    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
    
    response.headers.set('x-school-slug', 'platform');
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
