"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

// Special component for visually hidden but accessible elements
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    width: '1px',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
  }}>
    {children}
  </span>
)

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideAccessibilityTitle?: boolean;
  }
>(({ className, children, hideAccessibilityTitle = false, ...props }, ref) => {
  // Create a ref to store the original focus element before the dialog opens
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  // Check if the content includes DialogTitle and DialogDescription
  const [hasTitleElement, setHasTitleElement] = React.useState(false);
  const [hasDescriptionElement, setHasDescriptionElement] = React.useState(false);

  // Save the current focus element when the dialog opens and handle cleanup when it closes
  React.useEffect(() => {
    // Store the currently focused element when dialog opens
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Handle focus and aria-hidden issues
    const handleFocusIn = () => {
      const dialogElements = document.querySelectorAll('[role="dialog"][aria-hidden="true"]');
      dialogElements.forEach(el => {
        if (el.contains(document.activeElement) && document.activeElement !== el) {
          el.removeAttribute('aria-hidden');
          el.removeAttribute('data-aria-hidden');
        }
      });
    };
    
    document.addEventListener('focusin', handleFocusIn);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      
      // Return focus when the dialog closes
      if (previousFocusRef.current) {
        try {
          previousFocusRef.current.focus();
        } catch (e) {
          console.warn("Failed to restore focus", e);
        }
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Separate effect to scan for title/description elements
  React.useEffect(() => {
    // Reset state
    setHasTitleElement(false);
    setHasDescriptionElement(false);
    
    // Scan children for DialogTitle and DialogDescription elements
    React.Children.forEach(children, child => {
      if (React.isValidElement(child)) {
        // Check direct child
        if (child.type === DialogPrimitive.Title || child.type === DialogTitle) {
          setHasTitleElement(true);
        }
        if (child.type === DialogPrimitive.Description || child.type === DialogDescription) {
          setHasDescriptionElement(true);
        }
        
        // Check children of current child (like DialogHeader)
        if (child.props && child.props.children) {
          React.Children.forEach(child.props.children, grandchild => {
            if (React.isValidElement(grandchild)) {
              if (grandchild.type === DialogPrimitive.Title || grandchild.type === DialogTitle) {
                setHasTitleElement(true);
              }
              if (grandchild.type === DialogPrimitive.Description || grandchild.type === DialogDescription) {
                setHasDescriptionElement(true);
              }
            }
          });
        }
      }
    });
  }, [children]); // Keep children dependency only for accessibility scanning

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        // Force accessibility attributes to prevent nested dialogs issues
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        {...props}
      >
        {/* Add hidden but accessible title/description if not provided */}
        {!hasTitleElement && (
          <VisuallyHidden>
            <DialogPrimitive.Title>Dialog</DialogPrimitive.Title>
          </VisuallyHidden>
        )}
        {!hasDescriptionElement && (
          <VisuallyHidden>
            <DialogPrimitive.Description>Dialog content</DialogPrimitive.Description>
          </VisuallyHidden>
        )}
        
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
    Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, VisuallyHidden
}

