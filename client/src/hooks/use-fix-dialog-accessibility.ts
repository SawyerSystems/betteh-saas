import { useEffect } from 'react';

/**
 * A custom hook to fix the accessibility issue with Radix UI Dialog components
 * that causes "Blocked aria-hidden on an element because its descendant retained focus" errors
 * and missing title/description warnings
 */
export function useFixDialogAccessibility() {
  useEffect(() => {
    // Function to remove inappropriate aria-hidden attributes
    const fixAriaHiddenAttributes = () => {
      // Find all elements with aria-hidden="true" that contain focused elements
      const elements = document.querySelectorAll('[aria-hidden="true"]');
      
      elements.forEach((el) => {
        // Check if this element contains the activeElement (focused element)
        if (el.contains(document.activeElement) && document.activeElement !== el) {
          // Remove the problematic aria-hidden attribute
          el.removeAttribute('aria-hidden');
          el.removeAttribute('data-aria-hidden');
          
          // Optional: Mark this element as having been fixed
          el.setAttribute('data-fixed-aria', 'true');
          
          console.log('Fixed aria-hidden accessibility issue on element:', el);
        }
      });

      // Fix for dialogs without title/description
      const dialogElements = document.querySelectorAll('[role="dialog"]:not([aria-labelledby]):not([aria-label])');
      
      dialogElements.forEach((el) => {
        // If no aria-labelledby or aria-label, add an accessible label
        if (!el.hasAttribute('aria-labelledby') && !el.hasAttribute('aria-label')) {
          el.setAttribute('aria-label', 'Dialog');
        }
      });
    };

    // Watch for focus changes to detect when dialogs are opened
    const handleFocusChange = () => {
      // Use setTimeout to run after the browser has finished handling focus
      setTimeout(fixAriaHiddenAttributes, 0);
    };

    // For dialogs that might already be open
    fixAriaHiddenAttributes();

    // Listen for focus changes
    document.addEventListener('focusin', handleFocusChange);
    
    // Also watch for mutations to catch newly added dialogs
    const observer = new MutationObserver(() => {
      fixAriaHiddenAttributes();
    });
    
    observer.observe(document.body, { 
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'] 
    });

    // Clean up
    return () => {
      document.removeEventListener('focusin', handleFocusChange);
      observer.disconnect();
    };
  }, []);
}
