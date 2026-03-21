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

    console.log(`[Setup Content] Invoking ${isPlatform ? 'Platform' : 'School'} setup logic for slug: ${slug}`)

    // 1. Initialize Database Context
    let env: CloudflareEnv;
    try {
        env = getRequestContext().env as unknown as CloudflareEnv;
    } catch (e) {
        // Fallback for local dev
        return <SetupWizardClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : slug} />
    }

    if (!env || !env.DB) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#014737] text-white p-8 text-center">
                <h1 className="text-xl font-bold mb-4 text-emerald-400 uppercase tracking-widest">Infrastructure Error</h1>
                <p className="max-w-md opacity-70 mb-8 leading-relaxed">
                    Database binding (D1) not found. Please link a D1 database in the Cloudflare Dashboard.
                </p>
            </div>
        )
    }

    const db = getWebDb(env.DB)

    // 2. Determine School ID
    let schoolId = 1;
    if (!isPlatform) {
        const school = await repository.schools.getBySlug(db, slug);
        if (school) {
            schoolId = school.id;
        } else {
            console.error(`[Setup Content] School not found for slug: ${slug}`);
            // If the school doesn't exist, we can't onboard it here
            redirect("/setup")
        }
    }

    // 3. Verify Setup Status
    const hasSetup = await repository.settings.hasCompletedSetup(db, schoolId)
    
    if (hasSetup) {
        console.log(`[Setup Content] Setup complete for ${slug}. Redirecting...`)
        redirect(isPlatform ? "/super-admin" : `/${slug}`)
    }

    // 4. Render the Wizard
    return <SetupWizardClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : slug} />
}
