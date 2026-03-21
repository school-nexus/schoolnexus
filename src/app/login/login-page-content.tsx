import { redirect } from "next/navigation"
import { LoginClient } from "./login-client"
import { getWebDb } from "@/db/index-web"
import { repository } from "@/db/repository"
import { getRequestContext } from "@cloudflare/next-on-pages"

interface LoginPageContentProps {
    slug: string;
}

export async function LoginPageContent({ slug }: LoginPageContentProps) {
    const isPlatform = slug === 'platform' || !slug

    console.log(`[Login Content] Invoking ${isPlatform ? 'Platform' : 'School'} login logic for slug: ${slug}`)

    // 1. Initialize Database Context
    let env: CloudflareEnv;
    try {
        env = getRequestContext().env as unknown as CloudflareEnv;
    } catch (e) {
        // Fallback for local dev
        return <LoginClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : slug} />
    }

    if (!env || !env.DB) {
        return <LoginClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : slug} />
    }

    const db = getWebDb(env.DB)

    // 2. Determine School ID
    let schoolId = 1;
    if (!isPlatform) {
        const school = await repository.schools.getBySlug(db, slug);
        if (school) {
            schoolId = school.id;
        } else {
            // School not found, redirect to generic login
            redirect("/login")
        }
    }

    // 3. Verify Setup Status
    const hasSetup = await repository.settings.hasCompletedSetup(db, schoolId)
    
    if (!hasSetup) {
        console.log(`[Login Content] Setup incomplete for ${slug}. Redirecting to setup...`)
        redirect(isPlatform ? "/setup" : `/${slug}/setup`)
    }

    // 4. Render the Login UI
    return <LoginClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : slug} />
}
