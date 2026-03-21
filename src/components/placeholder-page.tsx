import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
    description?: string;
}

export function PlaceholderPage({ title, description = "This page is currently under construction. Please check back later." }: PlaceholderPageProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="p-6 bg-emerald-50 rounded-full ring-8 ring-emerald-50/50">
                <Construction className="w-12 h-12 text-emerald-600" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
                <p className="text-slate-500 max-w-md mx-auto text-lg">{description}</p>
            </div>
        </div>
    );
}

