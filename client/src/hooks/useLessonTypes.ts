import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface LessonType {
  id: number;
  name: string;
  description?: string;
  price: number;
  reservationFee?: number;
  keyPoints?: string[];
  duration: number; // minutes
  isPrivate: boolean;
  maxAthletes: number;
  isActive: boolean;
}

export function useLessonTypes() {
  const query = useQuery<LessonType[]>({
    queryKey: ["/api/lesson-types"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/lesson-types");
      const data = await res.json();
      // Defensive normalize
      return (data || []).filter((lt: any) => lt && lt.isActive !== false);
    },
    staleTime: 60_000,
  });

  // Helpers
  const byKey = (key: string) => {
    // Our state.state.lessonType holds keys like 'quick-journey'. Map heuristically by name.
    const map: Record<string, string> = {
      "quick-journey": "Quick Journey",
      "dual-quest": "Dual Quest",
      "deep-dive": "Deep Dive",
      "partner-progression": "Partner Progression",
    };
    const name = map[key] || key;
    return (query.data || []).find((lt) => lt.name === name);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "";
    return minutes === 60 ? "60 minutes" : `${minutes} minutes`;
    };

  const maxFocusAreasFor = (lt?: LessonType) => {
    if (!lt) return 2;
    return lt.duration >= 60 ? 4 : 2;
  };

  return {
    ...query,
    byKey,
    formatDuration,
    maxFocusAreasFor,
  };
}
