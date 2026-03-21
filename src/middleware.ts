import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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

    // Support path-based fallback for school access: schoolnexuspro.pages.dev/s/school-slug
    if (url.pathname.startsWith('/s/')) {
        const pathParts = url.pathname.split('/');
        const pathSlug = pathParts[2]; // /s/[slug]
        if (pathSlug) {
            console.log(`[Middleware] Path-based School detected: ${pathSlug}`);
            requestHeaders.set('x-school-slug', pathSlug);
            
            // Rewrite internally to the root login/dashboard but keep the header
            // This allows accessing schools without a custom domain!
            const newUrl = new URL(request.nextUrl);
            newUrl.pathname = '/' + pathParts.slice(3).join('/');
            return NextResponse.rewrite(newUrl, {
                request: {
                    headers: requestHeaders,
                },
            });
        }
    }

    if (subdomain && !reserved.includes(subdomain)) {
        // It's a school subdomain!
        console.log(`[Middleware] School detected: ${subdomain}`);
        requestHeaders.set('x-school-slug', subdomain);
    } else {
        // platform or reserved
        console.log(`[Middleware] Platform mode`);
        requestHeaders.set('x-school-slug', 'platform');
    }

    // Return response with Modified Headers
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
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
