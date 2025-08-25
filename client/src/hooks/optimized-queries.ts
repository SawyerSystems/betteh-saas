import { queryKeys } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Optimized auth hooks with shorter cache times
export function useAuthStatus() {
  return useQuery({
    queryKey: queryKeys.auth.status(),
    staleTime: 30 * 1000, // 30 seconds for auth status
    gcTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useParentAuthStatus() {
  return useQuery<{ loggedIn?: boolean; parentId?: number; email?: string }>({
    queryKey: queryKeys.auth.parentStatus(),
    staleTime: 30 * 1000, // 30 seconds for auth status
    gcTime: 1 * 60 * 1000, // 1 minute
    select: (data) => {
      // Ensure parentId is either a positive number or undefined (never 0)
      if (data && typeof data.parentId !== 'undefined') {
        return {
          ...data,
          parentId: data.parentId > 0 ? data.parentId : undefined
        };
      }
      return data;
    }
  });
}

// Content hooks with longer cache times
export function useBlogPosts() {
  return useQuery({
    queryKey: queryKeys.blog.all(),
    staleTime: 15 * 60 * 1000, // 15 minutes for blog posts
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useBlogPost(id: number) {
  return useQuery({
    queryKey: queryKeys.blog.detail(id),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!id,
  });
}

export function useTips() {
  return useQuery({
    queryKey: queryKeys.tips.all(),
    staleTime: 15 * 60 * 1000, // 15 minutes for tips
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useTip(id: number) {
  return useQuery({
    queryKey: queryKeys.tips.detail(id),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!id,
  });
}

// Stripe products with very long cache since they rarely change
export function useStripeProducts() {
  return useQuery({
    queryKey: queryKeys.stripe.products(),
    staleTime: 60 * 60 * 1000, // 1 hour for Stripe products
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

// Booking-related queries with medium cache
export function useAvailableTimes(date: string, lessonType: string) {
  return useQuery({
    queryKey: queryKeys.bookings.availableTimes(date, lessonType),
    staleTime: 2 * 60 * 1000, // 2 minutes for availability
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!date && !!lessonType,
  });
}

// Parent data hooks
export function useParentInfo() {
  return useQuery({
    queryKey: queryKeys.parent.info(),
    staleTime: 10 * 60 * 1000, // 10 minutes for parent info
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
}

export function useParentAthletes() {
  return useQuery({
    queryKey: queryKeys.parent.athletes(),
    staleTime: 5 * 60 * 1000, // 5 minutes for athlete data
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Optimized mutation hooks with proper cache invalidation
export function useOptimizedMutation<TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Call custom onSuccess
      options?.onSuccess?.(data, variables);
    },
  });
}

// Prefetching utilities
export function usePrefetchQueries() {
  const queryClient = useQueryClient();
  
  const prefetchBlogPosts = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.blog.all(),
      staleTime: 15 * 60 * 1000,
    });
  };
  
  const prefetchTips = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.tips.all(),
      staleTime: 15 * 60 * 1000,
    });
  };
  
  const prefetchStripeProducts = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.stripe.products(),
      staleTime: 60 * 60 * 1000,
    });
  };
  
  return {
    prefetchBlogPosts,
    prefetchTips,
    prefetchStripeProducts,
  };
}