"use client"

import { useEffect, useState } from "react"
import { invokeIPC } from "@/lib/electron"
import { SetupWizard } from "@/components/setup-wizard/setup-wizard"

interface SetupPageContentProps {
    slug: string;
}

export function SetupPageContent({ slug }: SetupPageContentProps) {
    // Platform if slug is literally 'platform' or if it's missing (root)
    const isPlatform = slug === 'platform' || !slug || slug === 'null';
    
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
                if (err.message.includes("Database binding not found")) {
                    setSetupStatus({ loading: false, hasSetup: null, error: err.message });
                } else {
                    setSetupStatus({ loading: false, hasSetup: false, error: err.message });
                }
            }
        }
        verifySetup();
    }, [slug]);

    const handleSetupComplete = async (data: any, isInitialized?: boolean) => {
        console.log("[Setup Page] Finalizing setup:", { data, isInitialized, isPlatform });
        try {
            const result = await invokeIPC('complete-setup', isPlatform ? 1 : 0);
            if (result) {
                window.location.href = isPlatform ? "/super-admin" : `/${slug}`;
            }
        } catch (error) {
            console.error("Setup completion failed:", error);
        }
    }

    if (setupStatus.loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
    }

    if (setupStatus.hasSetup) {
        window.location.href = isPlatform ? "/super-admin" : `/${slug}`;
        return null;
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Debug Banner */}
            <div className="bg-emerald-600 text-white text-[10px] font-bold py-1 px-4 text-center z-50">
                ARCHITECTURE VERSION: NATIVE-PATH-V3 | {isPlatform ? 'PLATFORM' : 'SCHOOL'} SETUP | CONTEXT: {slug || 'platform'}
            </div>
            <div className="flex-1 overflow-hidden">
                <SetupWizard 
                    isPlatform={isPlatform} 
                    onComplete={handleSetupComplete} 
                />
            </div>
        </div>
    )
}
