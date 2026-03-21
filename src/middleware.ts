import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    // Define the platform domain (where the Super Admin lives)
    // In production this would be schoolnexus.com
    // In local development, it's usually localhost:3000
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'localhost:3000';
    
    // Check if we are on a subdomain
    const isSubdomain = hostname !== platformDomain && !hostname.startsWith('www.');

    if (isSubdomain) {
        const subdomain = hostname.split('.')[0];
        
        // Rewrite the internal path to include the school slug
        // This allows us to handle school-specific logic in pages
        // For example: /dashboard -> /(schools)/[schoolSlug]/dashboard
        
        // However, we need to be careful with established paths like /api or /_next
        if (
            url.pathname.startsWith('/_next') ||
            url.pathname.startsWith('/api') ||
            url.pathname.startsWith('/static') ||
            url.pathname.includes('.') // for files like favicon.ico
        ) {
            return NextResponse.next();
        }

        // We can inject the school slug into a header or just use the hostname in components
        // For School Nexus, we'll let the SchoolContext handle the identification from the window.location
        // But for server-side logic, we can use a rewrite or a header.
        
        const response = NextResponse.next();
        response.headers.set('x-school-slug', subdomain);
        return response;
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
