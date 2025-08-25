import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export function useAvailableTimes(date: string, lessonType: string) {
  return useQuery({
    queryKey: ['/api/available-times', date, lessonType],
    queryFn: async (): Promise<string[]> => {
      const response = await apiRequest("GET", `/api/available-times/${date}/${lessonType}`);
      if (!response.ok) {
        console.warn('[useAvailableTimes] API response not ok', { date, lessonType, status: response.status });
        throw new Error('Failed to fetch available times');
      }
      const data = await response.json();
      return data.availableTimes || [];
    },
    enabled: !!date && !!lessonType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

