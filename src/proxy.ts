import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    const url = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // Define roots and domains to ignore
    const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'schoolnexuspro.pages.dev';
    
    // Ignore internal Next.js paths and api
    if (
        url.pathname.startsWith('/_next') || 
        url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/favicon.ico') ||
        url.pathname.startsWith('/logo.png')
    ) {
        return NextResponse.next();
    }

    // Extract subdomain
    // Example: school1.schoolnexuspro.pages.dev -> school1
    let subdomain = '';
    
    if (hostname.endsWith('.' + PLATFORM_DOMAIN)) {
        subdomain = hostname.replace('.' + PLATFORM_DOMAIN, '');
    } else if (hostname === PLATFORM_DOMAIN) {
        subdomain = '';
    } else if (hostname.includes('localhost')) {
        // Handle local dev if needed
        const parts = hostname.split('.');
        if (parts.length > 1 && parts[parts.length - 1] === 'localhost') {
            subdomain = parts[0];
        }
    }

    // List of reserved subdomains that should NOT be treated as schools
    const reserved = ['app', 'www', 'platform', 'admin', 'mail'];
    
    const requestHeaders = new Headers(request.headers);
    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // 1. Identify School Context
    let schoolSlug = '';

    // A. Subdomain Strategy
    if (subdomain && !reserved.includes(subdomain)) {
        schoolSlug = subdomain;
    } 

    // B. Path-based Strategy (e.g., /schoolname/dashboard)
    const pathParts = url.pathname.split('/');
    const firstSegment = pathParts[1];
    
    const systemPaths = ['api', '_next', 'setup', 'super-admin', 'favicon.ico', 'logo.png', 'globals.css', 's'];
    const reservedRoutes = ['login', 'dashboard', 'teachers', 'students', 'classes', 'subjects', 'exams', 'attendance', 'fees', 'accounts', 'settings', 'reports', 'super-admin', 'setup'];

    if (firstSegment && !systemPaths.includes(firstSegment) && !reservedRoutes.includes(firstSegment)) {
        // It's a school slug! e.g., /demo
        schoolSlug = firstSegment;
        
        // Rewrite internally: /demo/dashboard -> /dashboard
        const newUrl = new URL(request.nextUrl);
        newUrl.pathname = '/' + pathParts.slice(2).join('/');
        
        const rewriteResponse = NextResponse.rewrite(newUrl, {
            request: {
                headers: requestHeaders,
            },
        });
        
        // Persist the school in a cookie
        rewriteResponse.cookies.set('x-school-slug', schoolSlug, { path: '/', maxAge: 60 * 60 * 24 }); // 24 hours
        rewriteResponse.headers.set('x-school-slug', schoolSlug);
        return rewriteResponse;
    }

    // C. Cookie-based Persistence (for subsequent requests like /dashboard)
    if (!schoolSlug) {
        schoolSlug = request.cookies.get('x-school-slug')?.value || '';
    }

    // 2. Finalize headers
    if (schoolSlug && !reserved.includes(schoolSlug)) {
        console.log(`[Middleware] School Context: ${schoolSlug}`);
        requestHeaders.set('x-school-slug', schoolSlug);
    } else {
        console.log(`[Middleware] Platform Mode`);
        requestHeaders.set('x-school-slug', 'platform');
    }

    // Apply headers to the response (Next.js 13+ requirement for middleware headers to reach components)
    const finalResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
    
    // If we have a school slug, ensure it's in the headers
    if (schoolSlug) {
        finalResponse.headers.set('x-school-slug', schoolSlug);
    }

    return finalResponse;
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
