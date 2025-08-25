import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type SubTab = {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export interface AdminSubTabsProps {
  value: string;
  onValueChange?: (val: string) => void;
  tabs: SubTab[];
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

// Nested sub-tabs with glassmorphism, used within Admin cards
export function AdminSubTabs({
  value,
  onValueChange,
  tabs,
  className,
  listClassName,
  triggerClassName,
  contentClassName,
}: AdminSubTabsProps) {
  const triggerBase = cn(
    "rounded-lg border transition-all duration-200 inline-flex items-center gap-2",
    "px-3 py-1.5 text-xs sm:text-sm",
    "bg-white/70 border-slate-200/60 text-[#0F0276]",
    "supports-[backdrop-filter]:bg-white/40 backdrop-blur-md",
    "dark:bg-[#0F0276]/60 dark:text-white dark:border-[#2A4A9B]/40",
    "hover:shadow-md",
    "data-[state=active]:bg-[#0F0276] data-[state=active]:text-white data-[state=active]:border-[#2A4A9B]/60 data-[state=active]:shadow-lg",
    triggerClassName
  );

  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("w-full", className)}>
      <TabsList className={cn("flex flex-wrap gap-2 bg-transparent p-1", listClassName)}>
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value} disabled={t.disabled} className={triggerBase}>
            {t.icon}
            <span className="font-medium truncate max-w-[16ch] sm:max-w-none">{t.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value} className={cn("pt-2", contentClassName)}>
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default AdminSubTabs;
