"use client"

import { useEffect, useState } from "react"
import { invokeIPC } from "@/lib/electron"
import { SetupWizard } from "@/components/setup-wizard/setup-wizard"

interface SetupPageContentProps {
    slug: string;
}

export function SetupPageContent({ slug }: SetupPageContentProps) {
    // Detect environment and context
    const isPlatform = slug === 'platform' || slug === 'setup' || !slug || slug === 'null';
    const isElectron = typeof window !== 'undefined' && window.process?.versions?.electron;
    
    // Determine the unified setup mode
    const mode: 'electron' | 'web-platform' | 'web-school' = isElectron 
        ? 'electron' 
        : (isPlatform ? 'web-platform' : 'web-school');
    
    console.log("[Setup Page] Context Check:", { slug, isPlatform, isElectron, mode });
    
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
        console.log("[Setup Page] Finalizing setup:", { data, isInitialized, mode });
        try {
            // mode-aware completion logic
            const result = await invokeIPC('complete-setup', { 
                schoolId: isPlatform ? 1 : 0, // 1 is platform school, 0 is auto-detect or fresh
                data: data 
            });
            
            if (result) {
                // REDIRECTION RULE: 
                // On completion: Redirect to Platform Login for platform, or School Dashboard for school
                window.location.href = isPlatform ? "/login" : `/${slug}`;
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
        // REDIRECTION RULE:
        // If already setup: Redirect to Landing Page for platform, or School Dashboard for school
        window.location.href = isPlatform ? "/" : `/${slug}`;
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
                    mode={mode} 
                    onComplete={handleSetupComplete} 
                />
            </div>
        </div>
    )
}
