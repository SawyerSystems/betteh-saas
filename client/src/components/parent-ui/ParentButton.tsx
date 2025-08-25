import * as React from "react";
import { cn } from "@/lib/utils";

export type ParentButtonVariant =
  | "primary" // purple gradient primary
  | "secondary" // glass outline
  | "destructive" // red gradient
  | "ghost" // minimal
  | "success" // green gradient
  | "iconPurple" // purple icon button
  | "iconBlue" // blue icon button
  | "iconGreen" // green icon button
  | "iconRed"; // red icon button

export interface ParentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ParentButtonVariant;
  size?: "sm" | "md" | "lg" | "icon";
}

const base =
  "inline-flex items-center justify-center gap-2 select-none font-semibold transition-all duration-200 focus:outline-none disabled:opacity-60 disabled:pointer-events-none transform-gpu hover:scale-105 active:scale-95";

const sizes: Record<NonNullable<ParentButtonProps["size"]>, string> = {
  sm: "h-9 px-3 rounded-lg text-sm",
  md: "h-10 px-4 rounded-xl",
  lg: "h-12 px-6 rounded-2xl text-lg",
  icon: "h-9 w-9 p-0 rounded-xl text-sm",
};

const variants: Record<ParentButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 hover:from-[#0F0276]/90 hover:to-[#0F0276] text-white border-0 shadow-lg hover:shadow-xl",
  secondary:
    "border border-slate-200/60 bg-white/80 hover:bg-white/90 dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30 dark:hover:bg-[#0F0276]/50 backdrop-blur-sm text-[#0F0276] dark:text-white",
  destructive:
    "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md hover:shadow-lg",
  success:
    "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md hover:shadow-lg",
  ghost:
    "bg-transparent hover:bg-white/50 dark:hover:bg-white/10 text-[#0F0276] dark:text-white",
  iconPurple:
    "bg-white hover:bg-purple-50 text-purple-600 border-0 shadow-md hover:shadow-lg dark:bg-white/10 dark:hover:bg-white/20 dark:text-purple-300",
  iconBlue:
    "bg-white hover:bg-blue-50 text-blue-600 border-0 shadow-md hover:shadow-lg dark:bg-white/10 dark:hover:bg-white/20 dark:text-blue-300",
  iconGreen:
    "bg-white hover:bg-green-50 text-green-600 border-0 shadow-md hover:shadow-lg dark:bg-white/10 dark:hover:bg-white/20 dark:text-green-300",
  iconRed:
    "bg-white hover:bg-red-50 text-red-600 border-0 shadow-md hover:shadow-lg dark:bg-white/10 dark:hover:bg-white/20 dark:text-red-300",
};

export const ParentButton = React.forwardRef<HTMLButtonElement, ParentButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className)}
        {...props}
      />
    );
  }
);

ParentButton.displayName = "ParentButton";
