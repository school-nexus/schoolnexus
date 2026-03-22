'use client';

import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./sidebar').then(mod => mod.Sidebar), { 
    ssr: false,
    loading: () => <div className="w-64 h-full bg-emerald-950 animate-pulse" />
});

const Header = dynamic(() => import('./header').then(mod => mod.Header), { 
    ssr: false,
    loading: () => <div className="h-12 w-full bg-emerald-600 animate-pulse" />
});

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-emerald-50">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4">
                    {children}
                </main>
            </div>
        </div>
    );
}


