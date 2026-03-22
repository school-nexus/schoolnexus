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
        if (isPlatform) {
            console.log(`[Login Content] Setup incomplete for platform. Redirecting to setup...`)
            redirect("/setup")
        } else {
            console.log(`[Login Content] Setup pending for school ${slug}. Showing pending message.`)
            return (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                    <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-4">Setup Pending</h2>
                        <p className="text-slate-600 font-medium mb-8">
                            Your school's system setup is currently being processed by the system administration team. You will receive your login credentials once the setup is complete.
                        </p>
                        <a href="/" className="inline-block bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition-colors">
                            Return to Home
                        </a>
                    </div>
                </div>
            )
        }
    }

    // 4. Render the Login UI
    return <LoginClient isPlatform={isPlatform} schoolSlug={isPlatform ? '' : slug} />
}
