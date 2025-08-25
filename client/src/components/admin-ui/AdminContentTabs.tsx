import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type AdminContentTabItem = {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string;
  // Color scheme for this specific tab
  activeGradient?: string;
};

export interface AdminContentTabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
  items: AdminContentTabItem[];
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  children?: React.ReactNode;
}

// Content-focused tab system with gradient styling and badge support
export function AdminContentTabs({
  value,
  defaultValue,
  onValueChange,
  items,
  className,
  listClassName,
  triggerClassName,
  children,
}: AdminContentTabsProps) {
  const baseListClass = cn(
    "relative z-10 pointer-events-auto",
    "p-0.5 sm:p-1 rounded-lg sm:rounded-xl shadow-sm",
    // Match Settings tab behavior: take full width, no horizontal scroll, allow wrap
    "w-full sm:w-auto overflow-visible flex flex-wrap",
    "gap-1",
    // Dark mode background styling
    "bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-600/40",
    listClassName
  );

  const baseTriggerClass = cn(
    "rounded-lg px-2 sm:px-4 py-1 sm:py-2",
    "font-semibold text-xs sm:text-sm",
    "transition-all duration-200",
    // Allow wrapping and prevent forced minimum width so grid/rows can form
    "flex-1 sm:flex-none min-w-0",
    // Dark mode styling for inactive and active states
    "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white",
    "hover:bg-slate-200/50 dark:hover:bg-slate-700/50",
    "data-[state=active]:shadow-md data-[state=active]:text-white",
    "relative inline-flex items-center gap-2 justify-center",
    triggerClassName
  );

  return (
    <Tabs 
      value={value} 
      defaultValue={defaultValue} 
      onValueChange={onValueChange} 
      className={cn("relative isolate space-y-4 sm:space-y-6 w-full", className)}
    >
  <div className="flex items-center justify-center sm:justify-start w-full">
        <TabsList className={baseListClass}>
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              aria-label={item.ariaLabel || (typeof item.label === "string" ? item.label : undefined)}
              title={item.tooltip}
              className={cn(
                baseTriggerClass,
                // Default gradient when active
                item.activeGradient || "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600"
              )}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
              {item.badge != null && item.badge !== "" && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 dark:bg-black/20 rounded-full">
                  {item.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
  {children}
    </Tabs>
  );
}

export default AdminContentTabs;
