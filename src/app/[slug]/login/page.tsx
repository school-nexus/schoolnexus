import { LoginPageContent } from "../../login/login-page-content"

export const runtime = 'edge';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function SchoolLoginPage({ params }: PageProps) {
    const { slug } = await params;
    return <LoginPageContent slug={slug} />
}
