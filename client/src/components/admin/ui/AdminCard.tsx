import * as React from "react";
import { cn } from "@/lib/utils";
import { glass } from "./theme";

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "plain";
}

export function AdminCard({ className, variant = "glass", ...props }: AdminCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        variant === "glass" ? cn(glass.base, glass.dark) : "",
        className
      )}
      {...props}
    />
  );
}

export function AdminCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-6", className)} {...props} />;
}

export function AdminCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xl font-bold text-[#0F0276] dark:text-white", className)} {...props} />;
}

export function AdminCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-6", className)} {...props} />;
}
