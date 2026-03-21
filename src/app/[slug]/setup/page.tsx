import { SetupPageContent } from "../../setup/setup-page-content"

export const runtime = 'edge';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function SchoolSetupPage({ params }: PageProps) {
    const { slug } = await params;
    return <SetupPageContent slug={slug} />
}
