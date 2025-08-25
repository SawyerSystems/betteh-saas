import * as React from "react";
import { cn } from "@/lib/utils";

export function AdminFormRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)} {...props} />
  );
}

export function AdminField({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "space-y-2 border border-slate-200/60 rounded-lg p-3 bg-white/60 supports-[backdrop-filter]:bg-white/30 backdrop-blur-sm dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30",
        className
      )}
      {...props}
    />
  );
}

export function AdminLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[#0F0276] dark:text-white font-medium", className)} {...props} />;
}
