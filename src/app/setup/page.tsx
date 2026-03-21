import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { SetupWizardClient } from "./setup-wizard-client"
import { getWebDb } from "@/db/index-web"
import { repository } from "@/db/repository"
import { getRequestContext } from "@cloudflare/next-on-pages"
import { Loader2 } from "lucide-react"

export const runtime = 'edge';

export default async function SetupPage() {
    const headerList = await headers()
    const schoolSlug = headerList.get('x-school-slug') || 'platform'
    const isPlatform = schoolSlug === 'platform'

    console.log(`[Setup Server] Entering ${isPlatform ? 'Platform' : 'School'} setup for slug: ${schoolSlug}`)

    // 1. Initialize Database Context
    let env: CloudflareEnv;
    try {
        env = getRequestContext().env as unknown as CloudflareEnv;
    } catch (e) {
        console.warn("[Setup Server] Could not get request context, likely local dev without bindings.")
        // In local dev without getRequestContext, we fall through to the wizard
        return <SetupWizardClient isPlatform={isPlatform} schoolSlug={schoolSlug === 'platform' ? '' : schoolSlug} />
    }

    if (!env || !env.DB) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#014737] text-white p-8 text-center">
                <h1 className="text-xl font-bold mb-4 text-emerald-400 uppercase tracking-widest">Infrastructure Error</h1>
                <p className="max-w-md opacity-70 mb-8 leading-relaxed">
                    Database binding (D1) was not found in the current environment. Please ensure you have linked a D1 database in the Cloudflare Dashboard.
                </p>
                <div className="p-4 bg-black/20 rounded-xl border border-white/5 font-mono text-xs opacity-50">
                    Expected Binding: DB
                </div>
            </div>
        )
    }

    const db = getWebDb(env.DB)

    // 2. Determine School ID
    let schoolId = 1;
    if (!isPlatform) {
        const school = await repository.schools.getBySlug(db, schoolSlug);
        if (school) {
            schoolId = school.id;
        } else {
            console.error(`[Setup Server] School not found for slug: ${schoolSlug}`);
            // If the school doesn't exist, we can't onboard it. 
            // This might happen if someone types a random slug.
            redirect("/setup") // Fallback to platform setup or generic error
        }
    }

    // 3. Verify Setup Status
    const hasSetup = await repository.settings.hasCompletedSetup(db, schoolId)
    
    if (hasSetup) {
        console.log(`[Setup Server] Setup already complete for ${schoolSlug}. Redirecting...`)
        redirect(isPlatform ? "/super-admin" : `/${schoolSlug}`)
    }

    // 4. Render the Wizard
    return <SetupWizardClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : schoolSlug} />
}
