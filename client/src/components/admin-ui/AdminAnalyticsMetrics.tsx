import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricCard {
  key: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "orange" | "slate" | "indigo" | "red" | "amber";
}

    const colorMap = {
      blue: {
        wrapper: 'bg-blue-50 border-blue-200',
        title: 'text-blue-600 font-medium',
        iconColor: 'text-blue-600',
        value: 'text-2xl font-bold text-blue-700',
        hint: 'text-blue-500 text-xs'
      },
      green: {
        wrapper: 'bg-green-50 border-green-200',
        title: 'text-green-600 font-medium',
        iconColor: 'text-green-600',
        value: 'text-2xl font-bold text-green-700',
        hint: 'text-green-500 text-xs'
      },
      orange: {
        wrapper: 'bg-orange-50 border-orange-200',
        title: 'text-orange-600 font-medium',
        iconColor: 'text-orange-600',
        value: 'text-2xl font-bold text-orange-700',
        hint: 'text-orange-500 text-xs'
      },
      slate: {
        wrapper: 'bg-slate-50 border-slate-200',
        title: 'text-slate-600 font-medium',
        iconColor: 'text-slate-600',
        value: 'text-2xl font-bold text-slate-700',
        hint: 'text-slate-500 text-xs'
      },
      indigo: {
        wrapper: 'bg-indigo-50 border-indigo-200',
        title: 'text-indigo-600 font-medium',
        iconColor: 'text-indigo-600',
        value: 'text-2xl font-bold text-indigo-700',
        hint: 'text-indigo-500 text-xs'
      },
      red: {
        wrapper: 'bg-red-50 border-red-200',
        title: 'text-red-600 font-medium',
        iconColor: 'text-red-600',
        value: 'text-2xl font-bold text-red-700',
        hint: 'text-red-500 text-xs'
      },
      amber: {
        wrapper: 'bg-amber-50 border-amber-200',
        title: 'text-amber-600 font-medium',
        iconColor: 'text-amber-600',
        value: 'text-2xl font-bold text-amber-700',
        hint: 'text-amber-500 text-xs'
      }
    } as const;

export interface AdminAnalyticsMetricsProps extends React.HTMLAttributes<HTMLDivElement> {
  metrics: MetricCard[];
  columns?: { base?: number; sm?: number; lg?: number };
}

export function AdminAnalyticsMetrics({ metrics, columns, className, ...props }: AdminAnalyticsMetricsProps) {
  const colClasses = cn(
    `grid grid-cols-${columns?.base || 1} sm:grid-cols-${columns?.sm || 2} lg:grid-cols-${columns?.lg || 4} gap-6`,
  );

  return (
    <div className={cn(colClasses, className)} {...props}>
      {metrics.map((m) => {
        const c = colorMap[m.color || "slate"];
        return (
          <div key={m.key} className={cn("relative rounded-xl border-0 bg-gradient-to-br shadow-lg hover:shadow-xl transition-all duration-300", c.wrapper)}>
            <div className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5">
              <div>
                <div className={cn("text-sm font-semibold", c.title)}>{m.label}</div>
              </div>
              {m.icon && <div className={cn(c.iconColor)}>{m.icon}</div>}
            </div>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <div className={cn("text-3xl font-black", c.value)}>{m.value}</div>
              {m.hint && <p className={cn("text-xs mt-1 font-medium", c.hint)}>{m.hint}</p>}
            </div>
            {/* Optional pulse dot for live metrics */}
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-gray-400/70 rounded-full"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
