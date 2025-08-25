import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";
type Variant = "solid" | "soft" | "outline";

export type AdminTabItem = {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string;
};

export interface AdminTabButtonsProps {
  value: string;
  onValueChange?: (val: string) => void;
  items: AdminTabItem[];
  size?: Size;
  variant?: Variant;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
}

// Glassmorphism tab buttons styled to match AdminButton look-and-feel
export function AdminTabButtons({
  value,
  onValueChange,
  items,
  size = "md",
  variant = "solid",
  className,
  listClassName,
  triggerClassName,
}: AdminTabButtonsProps) {
  const sizeClasses: Record<Size, string> = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };

  const baseTrigger = cn(
    "rounded-xl border transition-all duration-200 inline-flex items-center gap-2",
    "supports-[backdrop-filter]:bg-white/40 backdrop-blur-md",
    "relative", // Removed z-index to prevent overlay issues
    // default state (unselected)
    "bg-white/70 border-slate-200/60 text-[#0F0276]",
    "dark:bg-[#0F0276]/60 dark:text-white dark:border-[#2A4A9B]/40",
    // hover
    "hover:shadow-lg",
    // active state
    variant === "solid" && cn(
      "data-[state=active]:bg-[#0F0276] data-[state=active]:text-white",
      "data-[state=active]:border-[#2A4A9B]/60 data-[state=active]:shadow-xl"
    ),
    variant === "soft" && cn(
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0F0276]/90 data-[state=active]:to-[#2A4A9B]",
      "data-[state=active]:text-white data-[state=active]:shadow-xl",
      "data-[state=active]:border-transparent"
    ),
    variant === "outline" && cn(
      "bg-transparent",
      "data-[state=active]:bg-white/80 data-[state=active]:text-[#0F0276] data-[state=active]:shadow-lg",
      "dark:data-[state=active]:bg-[#0F0276]/70 dark:data-[state=active]:text-white"
    ),
    triggerClassName
  );

  const badgeBase = cn(
    "ml-1 rounded-full text-[10px] leading-none font-bold px-1.5 py-0.5",
    "bg-gradient-to-br from-[#D8BD2A] to-[#D8BD2A]/80 text-[#0F0276] shadow-sm"
  );

  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("w-full", className)}>
      <TabsList
        className={cn(
          "flex flex-wrap gap-2 bg-transparent p-1",
          "relative", // Removed z-index to prevent overlay issues
          "w-full overflow-x-auto", // Allow horizontal scrolling on small screens
          "scrollbar-hide", // Hide scrollbar for cleaner look
          "justify-start items-center",
          listClassName
        )}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            aria-label={item.ariaLabel || (typeof item.label === "string" ? item.label : undefined)}
            title={item.tooltip}
            className={cn(
              baseTrigger, 
              sizeClasses[size],
              "flex-shrink-0", // Prevent tabs from shrinking too much
              "min-w-max" // Ensure tabs maintain readable width
            )}
          >
            {item.icon}
            <span className="font-semibold truncate max-w-[14ch] sm:max-w-none">{item.label}</span>
            {item.badge != null && item.badge !== "" && (
              <span className={badgeBase}>{item.badge}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export default AdminTabButtons;

// Row-only variant for use INSIDE an existing <Tabs> provider
export interface AdminTabButtonsRowProps {
  items: AdminTabItem[];
  size?: Size;
  variant?: Variant;
  listClassName?: string;
  triggerClassName?: string;
}

export function AdminTabButtonsRow({
  items,
  size = "md",
  variant = "solid",
  listClassName,
  triggerClassName,
}: AdminTabButtonsRowProps) {
  const sizeClasses: Record<Size, string> = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };

  const baseTrigger = cn(
    "rounded-xl border transition-all duration-200 inline-flex items-center gap-2",
    "supports-[backdrop-filter]:bg-white/40 backdrop-blur-md",
    "relative", // Remove explicit z-index that might interfere
    "bg-white/70 border-slate-200/60 text-[#0F0276]",
    "dark:bg-[#0F0276]/60 dark:text-white dark:border-[#2A4A9B]/40",
    "hover:shadow-lg",
    variant === "solid" && cn(
      "data-[state=active]:bg-[#0F0276] data-[state=active]:text-white",
      "data-[state=active]:border-[#2A4A9B]/60 data-[state=active]:shadow-xl"
    ),
    variant === "soft" && cn(
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0F0276]/90 data-[state=active]:to-[#2A4A9B]",
      "data-[state=active]:text-white data-[state=active]:shadow-xl",
      "data-[state=active]:border-transparent"
    ),
    variant === "outline" && cn(
      "bg-transparent",
      "data-[state=active]:bg-white/80 data-[state=active]:text-[#0F0276] data-[state=active]:shadow-lg",
      "dark:data-[state=active]:bg-[#0F0276]/70 dark:data-[state=active]:text-white"
    ),
    triggerClassName
  );

  const badgeBase = cn(
    "ml-1 rounded-full text-[10px] leading-none font-bold px-1.5 py-0.5",
    "bg-gradient-to-br from-[#D8BD2A] to-[#D8BD2A]/80 text-[#0F0276] shadow-sm"
  );

  return (
    <TabsList className={cn(
      "grid gap-2 bg-transparent p-1",
      "relative", // Remove explicit z-index
      "w-full", // Full width for grid
      listClassName
    )}>
      {items.map((item) => (
        <TabsTrigger
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          aria-label={item.ariaLabel || (typeof item.label === "string" ? item.label : undefined)}
          title={item.tooltip}
          className={cn(
            baseTrigger, 
            sizeClasses[size],
            "text-center justify-center", // Center content in grid cells
            "min-h-[48px] flex items-center" // Ensure minimum touch target size and proper centering
          )}
        >
          {item.icon}
          <span className="font-semibold truncate">{item.label}</span>
          {item.badge != null && item.badge !== "" && (
            <span className={badgeBase}>{item.badge}</span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
