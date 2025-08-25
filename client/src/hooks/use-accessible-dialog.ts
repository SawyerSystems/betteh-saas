import { useEffect, useRef } from 'react';

/**
 * A custom hook that handles focus trapping for dialogs and modals
 * to ensure proper accessibility in nested dialogs
 * 
 * @returns A ref that should be assigned to the dialog container
 */
export function useAccessibleDialog() {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (!dialogElement) return;

    // Make sure the dialog can receive focus
    if (!dialogElement.hasAttribute('tabIndex')) {
      dialogElement.setAttribute('tabIndex', '-1');
    }

    // Find all focusable elements within the dialog
    const focusableElements = dialogElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus the first element when the dialog opens
    if (firstFocusable) {
      setTimeout(() => {
        firstFocusable.focus();
      }, 50);
    } else {
      // If no focusable elements, focus the dialog itself
      dialogElement.focus();
    }

    // Handle keyboard navigation
    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      
      // If Shift+Tab on first element, move to last element
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
      // If Tab on last element, move to first element
      else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }

    // Add keydown listener
    dialogElement.addEventListener('keydown', handleTabKey);

    return () => {
      dialogElement.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return dialogRef;
}
