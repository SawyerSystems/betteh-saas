import * as React from "react";
import { cn } from "@/lib/utils";

export interface ParentCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ParentCard({ className, ...props }: ParentCardProps) {
  return (
    <div
      className={cn(
        // Modern card design with glassmorphism matching admin theme
        "rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 dark:border-white/10 dark:bg-white/10",
        className
      )}
      {...props}
    />
  );
}

export function ParentCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-3 sm:px-6 sm:py-4", className)} {...props} />;
}

export function ParentCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-bold text-[#0F0276] dark:text-white", className)} {...props} />;
}

export function ParentCardSubtitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[#0F0276]/70 dark:text-white/70", className)} {...props} />;
}

export function ParentCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-6", className)} {...props} />;
}

export function ParentCardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200/60 dark:border-white/10", className)} {...props} />;
}
