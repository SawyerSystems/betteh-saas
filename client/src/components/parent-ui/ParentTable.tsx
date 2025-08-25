import * as React from "react";
import { cn } from "@/lib/utils";

export function ParentTable({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm dark:border-purple-400/20 dark:bg-purple-900/20">
      <table
        className={cn(
          "w-full border-collapse",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function ParentTableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/50 dark:to-blue-900/50",
        className
      )}
      {...props}
    />
  );
}

export function ParentTableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        "",
        className
      )}
      {...props}
    />
  );
}

export function ParentTableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-slate-200/60 hover:bg-white/50 transition-colors dark:border-purple-400/20 dark:hover:bg-purple-400/10",
        className
      )}
      {...props}
    />
  );
}

export function ParentTableHead({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-semibold text-blue-800 dark:text-white text-sm",
        className
      )}
      {...props}
    />
  );
}

export function ParentTableCell({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-blue-900 dark:text-purple-100 text-sm",
        className
      )}
      {...props}
    />
  );
}
