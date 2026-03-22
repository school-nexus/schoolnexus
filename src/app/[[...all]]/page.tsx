import ClientRouter from './client-router';

export const runtime = 'edge';

export default function Page(props: any) {
    return <ClientRouter {...props} />;
}
