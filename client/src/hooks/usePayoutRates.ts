import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export type GymPayoutRate = {
  id: number;
  duration_minutes: number;
  is_member: boolean;
  rate_cents: number;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
};

export function usePayoutRates(include: 'active' | 'all' = 'active') {
  return useQuery<GymPayoutRate[]>({
    queryKey: ['/api/admin/payout-rates', include],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/admin/payout-rates?include=${include}`);
      if (!res.ok) throw new Error('Failed to load payout rates');
      return res.json();
    },
  });
}

export function useCreatePayoutRate() {
  return useMutation({
    mutationFn: async (payload: { durationMinutes: number; isMember: boolean; rateCents: number; effectiveFrom?: string }) => {
      const res = await apiRequest('POST', '/api/admin/payout-rates', payload);
      if (!res.ok) throw new Error(await res.text() || 'Failed to create rate');
      return res.json();
    },
  });
}

export function useRetirePayoutRate() {
  return useMutation({
    mutationFn: async (payload: { id: number; effectiveTo?: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/payout-rates/${payload.id}/retire`, { effectiveTo: payload.effectiveTo });
      if (!res.ok) throw new Error(await res.text() || 'Failed to retire rate');
      return res.json();
    },
  });
}
