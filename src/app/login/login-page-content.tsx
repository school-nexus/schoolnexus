"use client"

import { useEffect, useState } from "react"
import { LoginClient } from "./login-client"
import { useRouter } from "next/navigation"

interface LoginPageContentProps {
    slug?: string;
}

export function LoginPageContent({ slug = 'platform' }: LoginPageContentProps) {
    const isPlatform = slug === 'platform' || !slug
    const router = useRouter()
    const [setupStatus, setSetupStatus] = useState<{ loading: boolean, hasSetup: boolean | null, error: string | null }>({
        loading: true,
        hasSetup: null,
        error: null
    })

    useEffect(() => {
        const verifySetup = async () => {
            try {
                // Use RPC to check setup status to avoid Drizzle bloat in edge worker
                const response = await fetch('/api/rpc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-school-slug': slug },
                    body: JSON.stringify({
                        channel: 'has-completed-setup',
                        args: []
                    })
                });
                
                if (!response.ok) throw new Error("Failed to verify setup");
                const hasSetup = await response.json() as boolean;
                setSetupStatus({ loading: false, hasSetup, error: null });
            } catch (err: any) {
                console.error("[Login Content] Verification error:", err);
                setSetupStatus({ loading: false, hasSetup: true, error: err.message }); // Fallback to showing login
            }
        }
        verifySetup();
    }, [slug]);

    if (setupStatus.loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
    }

    if (setupStatus.hasSetup === false) {
        window.location.href = "/setup";
        return null;
    }

    return (
        <>
            {/* DEPLOYMENT PROOF BANNER */}
            <div className="bg-emerald-600 text-white text-[10px] font-bold py-1 px-4 text-center animate-pulse fixed top-0 w-full z-50">
                ARCHITECTURE VERSION: NATIVE-PATH-V3 | CONTEXT: {isPlatform ? 'PLATFORM' : 'SCHOOL'} | SLUG: {slug} | CLIENT_OPTIMIZED
            </div>
            <LoginClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : slug} />
        </>
    )
}
