import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { SelectTrigger } from "@/components/ui/select";

/**
 * Default styling for parent modal form inputs with light/dark mode support
 * Light mode: Standard gray borders with blue focus
 * Dark mode: Gold borders and text (#B8860B)
 */
const defaultInputClasses = "mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]";

/**
 * Parent Form Input component with consistent modal styling
 * - Light mode: Gray borders, blue focus
 * - Dark mode: Gold borders and text
 */
export const ParentFormInput = ({ className = "", ...props }: React.ComponentProps<typeof Input>) => (
  <Input
    className={cn(defaultInputClasses, className)}
    {...props}
  />
);

/**
 * Parent Form Textarea component with consistent modal styling
 * - Light mode: Gray borders, blue focus
 * - Dark mode: Gold borders and text
 */
export const ParentFormTextarea = ({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(
      "w-full min-h-[100px] rounded-md border px-3 py-2",
      defaultInputClasses,
      className
    )}
    {...props}
  />
);

/**
 * Parent Form Select component with consistent modal styling
 * - Light mode: Gray borders, blue focus
 * - Dark mode: Gold borders and text
 */
export const ParentFormSelect = ({ className = "", children, ...props }: React.ComponentProps<typeof SelectTrigger>) => (
  <SelectTrigger
    className={cn(defaultInputClasses, className)}
    {...props}
  >
    {children}
  </SelectTrigger>
);

/**
 * Parent Form Label component with consistent modal styling
 * - Light mode: Dark gray text
 * - Dark mode: Light gray text
 */
export const ParentFormLabel = ({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("text-sm font-medium text-gray-700 dark:text-gray-300", className)}
    {...props}
  />
);
