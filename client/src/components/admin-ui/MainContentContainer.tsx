import * as React from "react";
import { cn } from "@/lib/utils";

type MainContentContainerProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  heading?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Bottom layer container for admin sections.
 * - Dark mode: brand dark blue background (#0F0276) with subtle border
 * - Light mode: soft white/70 with blur, to match existing aesthetic
 * Place AdminCards as children inside to create the layered look.
 */
export function MainContentContainer({ heading, icon, actions, className, children, ...props }: MainContentContainerProps) {
  return (
    <section
      className={cn(
        // Base container shell
        "w-full rounded-3xl border bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md",
        // Borders
        "border-slate-200/60 dark:border-[#2A4A9B]/60",
        // Dark brand background
        "dark:bg-[#0F0276]/90",
        // Spacing and shadow
        "shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8",
        className
      )}
      {...props}
    >
  {(heading || actions) && (
        <header className="mb-4 sm:mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon}
    {heading && (
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#0F0276] dark:text-white">
        {heading}
              </h2>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </header>
      )}

      <div className="space-y-4 sm:space-y-6">
        {children}
      </div>
    </section>
  );
}

export default MainContentContainer;
