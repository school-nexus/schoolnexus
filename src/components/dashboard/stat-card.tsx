import React from 'react';
import { LucideIcon } from 'lucide-react';
;
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon?: React.ReactNode | LucideIcon;
    iconColor?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
    valueClassName?: string;
    titleClassName?: string;
    variant?: 'default' | 'solid' | 'gradient';
}

export function StatCard({
    title,
    value,
    change,
    icon,
    iconColor = 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    trend,
    className,
    valueClassName,
    titleClassName,
    variant = 'default',
}: StatCardProps) {
    const isSolid = variant === 'solid' || variant === 'gradient';

    // Helper to render icon whether it's a component or node
    const renderIcon = () => {
        if (!icon) return null;

        if (React.isValidElement(icon)) {
            return icon;
        }

        const IconComponent = icon as LucideIcon;
        return <IconComponent className={cn(
            "h-6 w-6",
            isSolid ? "text-white" : "text-white"
        )} />;
    };

    return (
        <Card className={cn(
            'relative rounded-2xl transition-all duration-500 border-0 flex flex-col justify-center overflow-hidden group min-h-[140px]',
            variant === 'default' && 'bg-white/70 backdrop-blur-xl ring-1 ring-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 hover:ring-emerald-200/50',
            variant === 'solid' && 'text-white shadow-xl hover:shadow-2xl transition-transform hover:-translate-y-1',
            variant === 'gradient' && 'text-white shadow-xl hover:shadow-2xl transition-transform hover:-translate-y-1',
            isSolid && iconColor,
            className
        )}>
            <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <p className={cn(
                            "text-[10px] font-bold tracking-[0.1em] uppercase truncate",
                            isSolid ? "text-white/70" : "text-slate-400",
                            titleClassName
                        )}>{title}</p>
                        <p className={cn(
                            "text-2xl font-black truncate tracking-tight flex items-baseline gap-1",
                            isSolid ? "text-white" : "text-slate-900",
                            valueClassName
                        )}>{value}</p>

                        {(change || trend) && (
                            <div className="mt-2 flex items-center gap-2">
                                <div className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
                                    isSolid
                                        ? 'bg-white/20 text-white backdrop-blur-sm'
                                        : trend?.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                )}>
                                    {trend ? (
                                        <>
                                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                                            <span>{Math.abs(trend.value)}%</span>
                                        </>
                                    ) : (
                                        change
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px]",
                                    isSolid ? "text-white/60" : "text-slate-400"
                                )}>vs last month</span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105',
                            isSolid ? 'bg-white/20 backdrop-blur-md' : iconColor
                        )}>
                            {renderIcon()}
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Decorative pattern for solid/gradient cards */}
            {isSolid && (
                <div className="absolute right-0 top-0 h-full w-1/3 overflow-hidden opacity-10 pointer-events-none">
                    <div className="absolute -right-4 -top-8 h-24 w-24 rounded-full bg-white blur-2xl" />
                    <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white blur-xl" />
                </div>
            )}
        </Card>
    );
}
