import { useParentAuthStatus } from "@/hooks/optimized-queries";

/**
 * Custom hook to get a valid parent ID from the authentication state
 * Returns undefined if no valid parent ID is found (never returns 0 or negative values)
 */
export function useValidParentId() {
  const { data: parentAuth } = useParentAuthStatus();
  
  // Only return parentId if it's valid (not 0, undefined, or negative)
  const parentId = parentAuth?.parentId;
  return (parentId && parentId > 0) ? parentId : undefined;
}
