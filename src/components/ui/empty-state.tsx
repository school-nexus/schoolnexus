import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center animate-in fade-in-50",
            className
        )}>
            {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 mb-4">
                    <Icon className="h-6 w-6 text-gray-400" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto mb-6">
                {description}
            </p>
            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
}

