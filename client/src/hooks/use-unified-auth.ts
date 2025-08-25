import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

/**
 * Unified authentication hook that checks both parent and admin authentication
 * Returns the appropriate parentId for waiver creation
 */
export function useUnifiedAuth() {
  // Check parent auth
  const { data: parentAuth } = useQuery<{ loggedIn: boolean; parentId?: number; email?: string }>({
    queryKey: ['/api/parent-auth/status'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/parent-auth/status");
      return response.json();
    },
    staleTime: 30 * 1000,
  });

  // Check admin auth
  const { data: adminAuth } = useQuery<{ loggedIn: boolean; adminId?: number; email?: string }>({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/status");
      return response.json();
    },
    staleTime: 30 * 1000,
  });

  // Determine authentication status and parentId
  const isAuthenticated = !!(parentAuth?.loggedIn || adminAuth?.loggedIn);
  
  // For waivers, we need a parentId. If admin is logged in, we'll need to handle this differently
  let parentId: number | undefined;
  
  if (parentAuth?.loggedIn && parentAuth.parentId && parentAuth.parentId > 0) {
    parentId = parentAuth.parentId;
    console.log('✅ Parent authenticated with ID:', parentId);
  } else if (parentAuth?.loggedIn) {
    console.warn('⚠️ Parent is logged in but has invalid parentId:', parentAuth.parentId);
  }
  
  return {
    isAuthenticated,
    isParent: !!parentAuth?.loggedIn,
    isAdmin: !!adminAuth?.loggedIn,
    parentId,
    adminId: adminAuth?.adminId,
    email: parentAuth?.email || adminAuth?.email,
    authData: {
      parent: parentAuth,
      admin: adminAuth
    }
  };
}
