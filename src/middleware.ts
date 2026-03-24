import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;

    // 1. Skip internal paths and all physical assets (anything with a dot)
    if (
        pathname.startsWith('/_next') || 
        pathname.startsWith('/api/') ||
        pathname === '/favicon.ico' ||
        pathname === '/logo.png' ||
        pathname.includes('.') ||
        pathname.startsWith('/assets/')
    ) {
        return NextResponse.next();
    }

    const requestHeaders = new Headers(request.headers);
    
    // Note: We used to protect /setup here, but it's now handled by the page component itself
    // to allow the first-run experience where no super_admin exists yet.

    // 2. Identify Tenant Slug from Path
    // Native Strategy: Next.js handles /[slug]/ natively via file system.
    // Middleware only needs to identify the slug to set the x-school-slug header.
    const pathParts = pathname.split('/').filter(Boolean);
    const firstSegment = pathParts[0];
    
    const reserved = [
        'super-admin', 'login', 'dashboard', 'teachers', 'students', 
        'classes', 'subjects', 'exams', 'attendance', 'fees', 'accounts', 
        'settings', 'reports', 'admin-setup', 'platform-setup'
    ];

    let schoolSlug = 'platform'; // Default to Platform/System

    if (firstSegment && !reserved.includes(firstSegment)) {
        // We are within a tenant path context (e.g. /demo/...)
        schoolSlug = firstSegment;
    }

    // 3. Propagate Context Header
    // CRITICAL: Set on both Request (for Page/API) and Cookie (for Client)
    requestHeaders.set('x-school-slug', schoolSlug);

    console.log(`[Middleware] Path: ${pathname} | Resolved Slug: ${schoolSlug}`);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Mirror to cookie for client components/RPC persistence
    response.cookies.set('x-school-slug', schoolSlug, { path: '/', maxAge: 60 * 60 * 24 });
    
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * 1. /api (API routes)
         * 2. /_next (Next.js internals)
         * 3. Static files (favicon.ico, logo.png, etc.)
         * 4. Files with extensions (detected by presence of a dot)
         */
        '/((?!api|_next|favicon.ico|logo.png|.*\\.).*)',
    ],
};
