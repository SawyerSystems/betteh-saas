import * as React from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** CSS selector to auto-focus when the modal opens (e.g. '#athlete-allergies') */
  autoFocusSelector?: string;
  /** Allow closing the dialog with the Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Allow closing the dialog by clicking outside (default: true) */
  closeOnOutsideClick?: boolean;
}

const sizeClasses = {
  sm: "max-w-md w-[calc(100%-2rem)] sm:w-full mx-auto",
  md: "max-w-lg w-[calc(100%-2rem)] sm:w-full mx-auto", 
  lg: "max-w-2xl w-[calc(100%-2rem)] sm:w-full mx-auto",
  xl: "max-w-4xl w-[calc(100%-2rem)] sm:w-full mx-auto",
  full: "max-w-7xl w-[calc(100%-2rem)] sm:w-full mx-auto",
};

export function ParentModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  size = "md",
  autoFocusSelector,
  closeOnEscape = true,
  closeOnOutsideClick = true,
}: ParentModalProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Helper to focus target element inside the dialog
  const focusTarget = React.useCallback(() => {
    const root = contentRef.current;
    if (!root) return false;
    let el: HTMLElement | null = null;
    if (autoFocusSelector) {
      el = root.querySelector(autoFocusSelector) as HTMLElement | null;
    }
    if (!el) {
      // Fallback to first focusable input/textarea/select/button
      el = root.querySelector(
        'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement | null;
    }
    if (el) {
      el.focus();
      return true;
    }
    return false;
  }, [autoFocusSelector]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only invoke onClose when the dialog is actually closing to avoid
      // accidental close calls on internal state updates/focus changes.
      if (!open) onClose();
    }}>
      <DialogContent 
        ref={contentRef as any}
        className={cn(
          "rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-white/10 dark:bg-white/10",
          // Constrain height but allow scrolling, especially on desktop
          "max-h-[85vh] sm:max-h-[90vh] overflow-y-auto",
          sizeClasses[size]
        )}
        onMouseDownCapture={(e) => {
          if (!contentRef.current) return;
          const target = e.target as HTMLElement;
          if (!contentRef.current.contains(target)) return;
          
          const interactiveSelector = [
            'input', 'textarea', 'select', 'button', 'a[href]',
            '[tabindex]:not([tabindex="-1"])', '[role="button"]',
            '[role="switch"]', '[role="checkbox"]', '[contenteditable="true"]',
            '.select-trigger'
          ].join(',');

          // If user clicked an interactive element directly, allow default behavior
          const clickedInteractive = (target as HTMLElement).closest(interactiveSelector);
          if (clickedInteractive) return;

          // If user clicked a label, try to focus its associated control
          const label = target.closest('label') as HTMLLabelElement | null;
          if (label) {
            let control: HTMLElement | null = null;
            const forId = label.htmlFor;
            if (forId) control = document.getElementById(forId) as HTMLElement | null;
            if (!control) control = label.querySelector(interactiveSelector) as HTMLElement | null;
            if (control) {
              // Don't prevent default for label clicks - let natural label behavior work
              control.focus();
              return;
            }
          }

          // For clicks in empty areas of form sections, focus the nearest field
          const group = target.closest('[data-autofocus-group]') as HTMLElement | null;
          if (!group) return;

          // Only auto-focus if no field in this group currently has focus
          const activeElement = document.activeElement as HTMLElement | null;
          if (activeElement && group.contains(activeElement)) {
            // User is already working in this section, don't interfere
            return;
          }

          // Walk up from the click target towards the group, selecting the first field found
          const fieldSelector = 'input:not([type="hidden"]), textarea, select, [contenteditable="true"], [role="textbox"]';
          let node: HTMLElement | null = target;
          let field: HTMLElement | null = null;
          while (node && group.contains(node)) {
            // Prefer a field within the current node's subtree
            field = node.querySelector(fieldSelector) as HTMLElement | null;
            if (field) break;
            node = node.parentElement as HTMLElement | null;
          }
          // Fallback to the first field in the group
          if (!field) field = group.querySelector(fieldSelector) as HTMLElement | null;
          
          if (field) {
            e.preventDefault();
            field.focus();
          }
        }}
        // Prevent closing on Escape if disabled
        onEscapeKeyDown={(e) => {
          if (!closeOnEscape) e.preventDefault();
        }}
        // Respect close on outside click setting
        onPointerDownOutside={(e) => {
          if (!closeOnOutsideClick) e.preventDefault();
        }}
        // Prevent auto-focus on open - keep modal completely neutral
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          // Don't focus anything - let user click to focus what they want
        }}
        // Keep focus inside dialog when user clicks within content
        onMouseDown={(e) => {
          // Remove automatic focus management - let natural focus behavior work
        }}
        // Make content focusable but don't auto-focus it
        tabIndex={-1}
      >
        <DialogHeader>
          <DialogTitle className="text-[#0F0276] dark:text-white font-bold text-xl">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function ParentModalSection({ className, title, children, ...props }: {
  className?: string;
  title?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
  <div data-autofocus-group className={cn("space-y-2 sm:space-y-4", className)} {...props}>
      {title && (
        <h3 className="font-semibold text-[#0F0276] dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1 sm:pb-2 text-sm sm:text-base">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function ParentModalGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4",
        className
      )}
      {...props}
    />
  );
}

export function ParentModalDetailRow({ label, value, className }: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4", className)}>
      <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
        {label}
      </span>
      <span className="text-[#0F0276] dark:text-white text-sm sm:text-right">
        {value}
      </span>
    </div>
  );
}
