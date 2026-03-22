import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
;
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    breadcrumbs,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}>
            <div className="space-y-1.5">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center text-xs text-muted-foreground mb-2">
                        {breadcrumbs.map((item, index) => (
                            <div key={index} className="flex items-center">
                                {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                                {item.href ? (
                                    <Link
                                        href={item.href}
                                        className="hover:text-primary transition-colors hover:underline underline-offset-4"
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className="font-medium text-foreground">{item.label}</span>
                                )}
                            </div>
                        ))}
                    </nav>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}

