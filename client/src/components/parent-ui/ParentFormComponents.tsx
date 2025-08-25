import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Default modal form styling - consistent across all modals
const defaultInputClasses = "mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]";

interface ParentFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const ParentFormInput = React.forwardRef<HTMLInputElement, ParentFormInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn(defaultInputClasses, className)}
        {...props}
      />
    );
  }
);

ParentFormInput.displayName = "ParentFormInput";

interface ParentFormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const ParentFormTextarea = React.forwardRef<HTMLTextAreaElement, ParentFormTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        className={cn(defaultInputClasses, className)}
        {...props}
      />
    );
  }
);

ParentFormTextarea.displayName = "ParentFormTextarea";

interface ParentFormSelectTriggerProps extends React.ComponentProps<typeof SelectTrigger> {
  className?: string;
}

export const ParentFormSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  ParentFormSelectTriggerProps
>(({ className, children, ...props }, ref) => {
  return (
    <SelectTrigger
      ref={ref}
  className={cn("select-trigger", defaultInputClasses, className)}
      {...props}
    >
      {children}
    </SelectTrigger>
  );
});

ParentFormSelectTrigger.displayName = "ParentFormSelectTrigger";

// Re-export other Select components for convenience
export { Select, SelectContent, SelectItem, SelectValue };
