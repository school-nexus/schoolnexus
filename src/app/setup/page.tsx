import { SetupPageContent } from "./setup-page-content"

export const runtime = 'edge';

export default async function SetupPage() {
    return <SetupPageContent slug="platform" />
}
