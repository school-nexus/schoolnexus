"use client"
export const runtime = 'edge';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AcademicYearPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/settings/years');
    }, [router]);

    return null;
}

