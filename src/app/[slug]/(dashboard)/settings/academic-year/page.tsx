export const runtime = 'edge';
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AcademicYearPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/settings/years');
    }, [router]);

    return null;
}

