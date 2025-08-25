import * as React from "react";
import { cn } from "@/lib/utils";

// Table shell styled like Bookings tab: separated, spaced, pill rows
export function AdminTable({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn(
        "w-full text-sm border-separate border-spacing-y-2",
        className
      )}
      {...props}
    />
  );
}

export function AdminThead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("", className)} {...props} />;
}

export function AdminTbody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("", className)} {...props} />;
}

// Header cell matches Bookings tab typography
export function AdminTh({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "text-left px-3 py-2 font-semibold text-[#0F0276] dark:text-white",
        className
      )}
      {...props}
    />
  );
}

// Data cell: glass pill per row, with rounded first/last
export function AdminTd({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent",
        className
      )}
      {...props}
    />
  );
}

// Table row with sensible defaults for header/body
export function AdminTr({ variant = "body", className, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { variant?: "head" | "body" }) {
  return (
    <tr
      className={cn(
        variant === "head" ? "border-transparent bg-transparent" : "transition-colors border-transparent",
        className
      )}
      {...props}
    />
  );
}
