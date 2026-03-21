import { LoginPageContent } from "./login-page-content"

export const runtime = 'edge';

export default async function LoginPage() {
    return <LoginPageContent slug="platform" />
}
