export const runtime = 'edge';
import { Suspense } from 'react';
import AddStudentForm from './AddStudentForm';

export default function AddStudentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddStudentForm />
        </Suspense>
    );
}

