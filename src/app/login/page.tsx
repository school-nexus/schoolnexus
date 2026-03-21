import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { LoginClient } from "./login-client"
import { getWebDb } from "@/db/index-web"
import { repository } from "@/db/repository"
import { getRequestContext } from "@cloudflare/next-on-pages"

export const runtime = 'edge';

export default async function LoginPage() {
    const headerList = await headers()
    const schoolSlug = headerList.get('x-school-slug') || 'platform'
    const isPlatform = schoolSlug === 'platform'

    // 1. Initialize Database Context
    let env: CloudflareEnv;
    try {
        env = getRequestContext().env as unknown as CloudflareEnv;
    } catch (e) {
        // Local dev fallback
        return <LoginClient isPlatform={isPlatform} schoolSlug={schoolSlug === 'platform' ? '' : schoolSlug} />
    }

    if (!env || !env.DB) {
        // Fallback to client rendering if DB is missing (will show error in client if needed)
        return <LoginClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : schoolSlug} />
    }

    const db = getWebDb(env.DB)

    // 2. Determine School ID
    let schoolId = 1;
    if (!isPlatform) {
        const school = await repository.schools.getBySlug(db, schoolSlug);
        if (school) {
            schoolId = school.id;
        } else {
            // School doesn't exist, redirect to root login or setup
            redirect("/login")
        }
    }

    // 3. Verify Setup Status
    const hasSetup = await repository.settings.hasCompletedSetup(db, schoolId)
    
    if (!hasSetup) {
        console.log(`[Login Server] Setup INCOMPLETE for ${schoolSlug}. Redirecting to setup wizard...`)
        redirect(isPlatform ? "/setup" : `/${schoolSlug}/setup`)
    }

    // 4. Render the Login UI
    return <LoginClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : schoolSlug} />
}
