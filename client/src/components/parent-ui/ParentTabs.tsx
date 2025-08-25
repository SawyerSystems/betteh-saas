import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function ParentTabs({ className, ...props }: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs
      className={cn(
        "w-full",
        className
      )}
      {...props}
    />
  );
}

export function ParentTabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <TabsList
      className={cn(
        "grid w-full rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/60 p-2 dark:bg-[#0F0276]/30 dark:border-white/10",
        className
      )}
      {...props}
    />
  );
}

export interface ParentTabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function ParentTabsTrigger({ className, value, ...props }: ParentTabsTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "rounded-xl font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-yellow-500 data-[state=active]:text-[#0F0276] data-[state=active]:shadow-md text-yellow-600 dark:text-yellow-400 dark:data-[state=active]:text-[#0F0276]",
        className
      )}
      {...props}
    />
  );
}

export function ParentTabsContent({ className, ...props }: React.ComponentProps<typeof TabsContent>) {
  return (
    <TabsContent
      className={cn(
        "mt-6 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
