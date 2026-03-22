"use client"

import { useEffect, useState } from "react"
import { invokeIPC } from "@/lib/electron"
import { SetupWizardClient } from "./setup-wizard-client"

interface SetupPageContentProps {
    slug: string;
}

export function SetupPageContent({ slug }: SetupPageContentProps) {
    const isPlatform = slug === 'platform' || !slug
    console.log("[Setup Page] Context Check:", { slug, isPlatform });
    const [setupStatus, setSetupStatus] = useState<{ loading: boolean, hasSetup: boolean | null, error: string | null }>({
        loading: true,
        hasSetup: null,
        error: null
    })

    useEffect(() => {
        const verifySetup = async () => {
            try {
                // Use resilient invokeIPC
                const hasSetup = await invokeIPC<boolean>('has-completed-setup');
                setSetupStatus({ loading: false, hasSetup, error: null });
            } catch (err: any) {
                console.error("[Setup Content] Verification error:", err);
                // If it's a critical infrastructure error, keep loading=false but set error
                if (err.message.includes("Database binding not found")) {
                    setSetupStatus({ loading: false, hasSetup: null, error: err.message });
                } else {
                    setSetupStatus({ loading: false, hasSetup: false, error: err.message });
                }
            }
        }
        verifySetup();
    }, [slug]);

    if (setupStatus.loading) {
        return <div className="min-h-screen bg-[#014737] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        </div>
    }

    if (setupStatus.hasSetup) {
        window.location.href = isPlatform ? "/super-admin" : `/${slug}`;
        return null;
    }

    return (
        <div className="flex flex-col h-screen">
            <div className="bg-red-600 text-white text-[10px] font-bold py-1 px-4 text-center animate-pulse z-50">
                ARCHITECTURE VERSION: NATIVE-PATH-V3 | CONTEXT: {isPlatform ? 'PLATFORM' : 'SCHOOL'} | SLUG: {slug} | CLIENT_OPTIMIZED
            </div>
            <div className="flex-1 overflow-hidden">
                <SetupWizardClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : slug} />
            </div>
        </div>
    )
}
