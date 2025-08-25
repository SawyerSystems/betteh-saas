import * as React from "react";
import { cn } from "@/lib/utils";

export function ParentContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full rounded-xl sm:rounded-2xl lg:rounded-3xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-purple-400/20 dark:bg-purple-900/20 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}
