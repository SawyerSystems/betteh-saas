import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "./AdminCard";
import { cn } from "@/lib/utils";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { AdminButton } from "./AdminButton";

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  className?: string;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

const sizeClasses = {
  // On mobile take ~90% viewport width; on sm+ fill available width up to the max
  sm: "w-[90vw] sm:w-full max-w-sm",
  md: "w-[90vw] sm:w-full max-w-md", 
  lg: "w-[90vw] sm:w-full max-w-lg",
  xl: "w-[90vw] sm:w-full max-w-xl",
  "2xl": "w-[90vw] sm:w-full max-w-2xl",
  "3xl": "w-[90vw] sm:w-full max-w-3xl", 
  "4xl": "w-[90vw] sm:w-full max-w-4xl",
  full: "w-[95vw] sm:w-full max-w-full"
};

export function AdminModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "2xl",
  className,
  showCloseButton = false, // Default to false since Dialog already provides a close button
  footer
}: AdminModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          "max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 gap-0 bg-transparent border-none shadow-none",
          "m-2 sm:m-0", // Add margin on mobile for better spacing
          className
        )}
      >
        <AdminCard className="w-full">
          <AdminCardHeader className="flex flex-row items-center justify-between pb-4 px-4 sm:px-6">
            <AdminCardTitle className="text-lg sm:text-xl">{title}</AdminCardTitle>
            {showCloseButton && (
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </AdminButton>
            )}
          </AdminCardHeader>
          <AdminCardContent className="pt-0 px-4 sm:px-6">
            {children}
          </AdminCardContent>
          {footer && (
            <div className="px-4 pb-4 sm:px-6 sm:pb-6">
              {footer}
            </div>
          )}
        </AdminCard>
      </DialogContent>
    </Dialog>
  );
}

export interface AdminModalSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  gradient?: "blue" | "purple" | "green" | "amber" | "red" | "gray";
  children: React.ReactNode;
  collapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const gradientClasses = {
  blue: "bg-gradient-to-r from-white to-blue-50 border-blue-100 dark:from-[#0F0276]/20 dark:to-[#0F0276]/30 dark:border-[#2A4A9B]/40",
  purple: "bg-gradient-to-r from-white to-purple-50 border-purple-100 dark:from-[#0F0276]/20 dark:to-[#0F0276]/30 dark:border-[#2A4A9B]/40", 
  green: "bg-gradient-to-r from-white to-green-50 border-green-100 dark:from-[#0F0276]/20 dark:to-[#0F0276]/30 dark:border-[#2A4A9B]/40",
  amber: "bg-gradient-to-r from-white to-amber-50 border-amber-100 dark:from-[#0F0276]/20 dark:to-[#0F0276]/30 dark:border-[#2A4A9B]/40",
  red: "bg-gradient-to-r from-white to-red-50 border-red-100 dark:from-[#0F0276]/20 dark:to-[#0F0276]/30 dark:border-[#2A4A9B]/40",
  gray: "bg-gradient-to-r from-white to-gray-50 border-gray-200 dark:from-[#0F0276]/20 dark:to-[#0F0276]/30 dark:border-[#2A4A9B]/40"
};

const titleColorClasses = {
  blue: "text-blue-800 dark:text-blue-200",
  purple: "text-purple-800 dark:text-blue-200",
  green: "text-green-800 dark:text-blue-200", 
  amber: "text-amber-800 dark:text-blue-200",
  red: "text-red-800 dark:text-blue-200",
  gray: "text-gray-800 dark:text-blue-200"
};

export function AdminModalSection({ 
  title, 
  icon, 
  gradient = "blue", 
  children, 
  className,
  collapsible = false,
  isExpanded = true,
  onToggle,
  ...props 
}: AdminModalSectionProps) {
  return (
    <div 
      className={cn(
        "p-3 sm:p-4 rounded-xl border shadow-sm",
        gradientClasses[gradient],
        className
      )}
      {...props}
    >
      <div 
        className={cn(
          "font-semibold flex items-center gap-2 mb-3 text-sm sm:text-base",
          titleColorClasses[gradient],
          collapsible && "cursor-pointer hover:opacity-75 transition-opacity"
        )}
        onClick={collapsible ? onToggle : undefined}
      >
        {icon}
        {title}
        {collapsible && (
          <div className="ml-auto">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
      {(!collapsible || isExpanded) && children}
    </div>
  );
}

export function AdminModalDetailRow({ 
  label, 
  value, 
  icon,
  className 
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white bg-opacity-70 p-2 sm:p-3 rounded-lg dark:bg-[#0F0276]/40 dark:bg-opacity-60 gap-1 sm:gap-0", className)}>
      <span className="font-medium text-gray-700 flex items-center gap-1.5 dark:text-blue-200 text-sm sm:text-base">
        {icon}
        {label}:
      </span>
      <span className="text-gray-900 text-left sm:text-right dark:text-blue-100 text-sm sm:text-base break-words">{value}</span>
    </div>
  );
}

export function AdminModalGrid({ 
  children, 
  cols = 1,
  className 
}: { 
  children: React.ReactNode; 
  cols?: 1 | 2 | 3;
  className?: string;
}) {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2", 
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
  };

  return (
    <div className={cn("grid gap-3 sm:gap-4 lg:gap-6", colClasses[cols], className)}>
      {children}
    </div>
  );
}
