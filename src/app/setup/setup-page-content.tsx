import { redirect } from "next/navigation"
import { SetupWizardClient } from "./setup-wizard-client"
import { getWebDb } from "@/db/index-web"
import { repository } from "@/db/repository"
import { getRequestContext } from "@cloudflare/next-on-pages"

interface SetupPageContentProps {
    slug: string;
}

export async function SetupPageContent({ slug }: SetupPageContentProps) {
    const isPlatform = slug === 'platform' || !slug

    // 1. Initialize Database Context
    let env: CloudflareEnv;
    let isContextError = false;
    try {
        env = getRequestContext().env as unknown as CloudflareEnv;
    } catch (e) {
        // Fallback for local dev
        isContextError = true;
    }

    const db = (env && env.DB) ? getWebDb(env.DB) : null;

    if (!db && !isContextError) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#014737] text-white p-8 text-center">
                <h1 className="text-xl font-bold mb-4 text-emerald-400 uppercase tracking-widest">Infrastructure Error</h1>
                <p className="max-w-md opacity-70 mb-8 leading-relaxed">
                    Database binding (D1) not found. Please link a D1 database in the Cloudflare Dashboard.
                </p>
            </div>
        )
    }

    // 2. Determine School ID
    let schoolId = 1;
    if (!isPlatform && db) {
        const school = await repository.schools.getBySlug(db, slug);
        if (school) {
            schoolId = school.id;
        } else {
            redirect("/setup")
        }
    }

    // 3. Verify Setup Status
    if (db) {
        const hasSetup = await repository.settings.hasCompletedSetup(db, schoolId)
        if (hasSetup) {
            redirect(isPlatform ? "/super-admin" : `/${slug}`)
        }
    }

    // 4. Render the Wizard with Debug Banner
    return (
        <div className="flex flex-col h-screen">
            {/* DEPLOYMENT PROOF BANNER - REMOVE AFTER VERIFICATION */}
            <div className="bg-red-600 text-white text-[10px] font-bold py-1 px-4 text-center animate-pulse z-50">
                ARCHITECTURE VERSION: NATIVE-PATH-V3 | CONTEXT: {isPlatform ? 'PLATFORM' : 'SCHOOL'} | SLUG: {slug} | {isContextError ? 'LOCAL_DEV' : 'CLOUDFLARE'}
            </div>
            <div className="flex-1 overflow-hidden">
                <SetupWizardClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : slug} />
            </div>
        </div>
    )
}
