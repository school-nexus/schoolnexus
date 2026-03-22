import { Suspense } from 'react';
import InvoicesPageContent from './InvoicesPageContent';

export default function InvoicesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InvoicesPageContent />
        </Suspense>
    );
}