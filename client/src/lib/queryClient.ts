import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.clone().json();
        const errorMessage = errorData.error || errorData.message || res.statusText;
        const errorDetails = errorData.details ? `\nDetails: ${JSON.stringify(errorData.details)}` : '';
        throw new Error(`${res.status}: ${errorMessage}${errorDetails}`);
      } else {
        // Fallback to text if not JSON
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
    } catch (parseError) {
      // If parsing fails, use status text
      if (parseError instanceof Error && parseError.message.includes(res.status.toString())) {
        throw parseError;
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

// Get the API base URL based on environment
function getApiBaseUrl(): string {
  // For debugging purposes, we're using the direct backend URL
  // This bypasses the Vite proxy which might be causing issues with cookies
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:6001';
  }
  // In production, the API is served from the same origin
  return '';
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Ensure the URL always points to the API server
  const apiBaseUrl = getApiBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
  
  console.log(`🌐 API Request: ${method} ${fullUrl}`);
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // This ensures cookies are sent with the request
    });
    
    // Enhanced logging for debugging
    console.log(`📡 API Response: ${method} ${fullUrl} - ${res.status} ${res.statusText}`, {
      headers: {
        'content-type': res.headers.get('content-type'),
        'set-cookie': res.headers.get('set-cookie'),
      },
      cookies: document.cookie ? 'Present' : 'None'
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`❌ API Request Error: ${method} ${fullUrl}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Ensure the URL always points to the API server
    const apiBaseUrl = getApiBaseUrl();
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`;
    
    console.log(`🔍 Query Request: GET ${fullUrl}`);
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });
    
    // Log the response status for debugging
    console.log(`📥 Query Response: GET ${fullUrl} - ${res.status} ${res.statusText}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: 1, // Retry once for better UX
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Query key factories for better organization and invalidation
export const queryKeys = {
  // Auth queries - short cache since they change frequently
  auth: {
    status: () => ['/api/auth/status'] as const,
    parentStatus: () => ['/api/parent-auth/status'] as const,
  },
  // Content queries - longer cache since they change less frequently
  blog: {
    all: () => ['/api/blog-posts'] as const,
    detail: (id: number) => ['/api/blog-posts', id] as const,
  },
  tips: {
    all: () => ['/api/tips'] as const,
    detail: (id: number) => ['/api/tips', id] as const,
  },
  // Booking related queries - medium cache
  bookings: {
    all: () => ['/api/bookings'] as const,
    byId: (id: number) => ['/api/bookings', id] as const,
    availableTimes: (date: string, lessonType: string) => 
      ['/api/available-times', date, lessonType] as const,
  },
  // Parent and athlete data
  parent: {
    info: () => ['/api/parent/info'] as const,
    athletes: () => ['/api/parent/athletes'] as const,
  },
  // Stripe data - can be cached longer
  stripe: {
    products: () => ['/api/stripe/products'] as const,
  },
} as const;
