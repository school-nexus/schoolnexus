"use client"

import { useEffect, useState } from "react"
import { LoginClient } from "@/app/login/login-client"
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

    if (setupStatus.error && setupStatus.error.includes("Database binding not found")) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border-2 border-red-100 p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Incomplete Infrastructure</h2>
                    <p className="text-slate-500 font-medium">The Cloudflare D1 database binding "<b>DB</b>" was not found in this environment.</p>
                    <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3 border border-slate-200">
                        <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">Next Steps:</p>
                        <ol className="text-sm text-slate-600 space-y-2 list-decimal ml-4 font-medium">
                            <li>Go to <b>Cloudflare Pages Dashboard</b></li>
                            <li>Navigate to <b>Settings &rarr; Functions</b></li>
                            <li>Find <b>D1 database bindings</b></li>
                            <li>Link a database with name <b>DB</b></li>
                        </ol>
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        I've fixed it, Refresh
                    </button>
                    <p className="text-[10px] text-slate-300 uppercase font-black tracking-tighter">Architecture Native-Path-V3</p>
                </div>
            </div>
        )
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
