import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface EventRow {
  id: string;
  seriesId: string;
  parentEventId?: string | null;
  title: string;
  notes?: string | null;
  location?: string | null;
  // Address fields
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  isAllDay: boolean;
  timezone: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
  recurrenceExceptions?: string[];
  // Instance information for recurring events
  isInstance?: boolean;
  instanceDate?: string;
  // Availability blocking fields
  isAvailabilityBlock?: boolean;
  blockingReason?: string | null;
  // Category field for event classification and color coding
  category?: string | null;
  // Audit fields
  createdBy?: number | null;
  updatedBy?: number | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function useEvents(range?: { start: string; end: string }) {
  const qs = range ? `?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}&expand=true` : '?expand=true';
  return useQuery<EventRow[]>({
    queryKey: ["/api/events", range?.start, range?.end],
    queryFn: async () => apiRequest("GET", `/api/events${qs}`).then(r => r.json()),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EventRow>) => apiRequest("POST", "/api/events", input).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventRow> }) => apiRequest("PUT", `/api/events/${id}`, data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/events"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: string | { id: string; mode?: 'this' | 'future' | 'all'; instanceDate?: string }) => {
      if (typeof params === 'string') {
        // Legacy: simple ID string (defaults to 'all' mode)
        return apiRequest("DELETE", `/api/events/${params}`).then(r => r.json());
      } else {
        // Enhanced: object with deletion mode - send in request body
        const { id, mode = 'all', instanceDate } = params;
        
        const requestBody = {
          mode,
          ...(instanceDate && { instanceDate })
        };
        
        console.log("🗑️ [HOOK] Sending DELETE request:", { id, body: requestBody });
        
        return apiRequest("DELETE", `/api/events/${id}`, requestBody).then(r => r.json());
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/events"] }),
  });
}
