import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export type PayoutRun = {
	id: number;
	period_start: string;
	period_end: string;
	status: string;
	total_sessions: number;
	total_owed_cents: number;
	generated_at: string;
	updated_at: string;
};

export function usePayoutRuns(limit = 12) {
	return useQuery<PayoutRun[]>({
		queryKey: ['/api/admin/payouts/runs', String(limit)],
		queryFn: async () => {
			const res = await apiRequest('GET', `/api/admin/payouts/runs?limit=${limit}`);
			if (!res.ok) throw new Error('Failed to load payout runs');
			return res.json();
		},
	});
}

export function useGeneratePayoutRun() {
	return useMutation({
		mutationFn: async (payload: { periodStart: string; periodEnd: string }) => {
			const res = await apiRequest('POST', '/api/admin/payouts/run', payload);
			if (!res.ok) throw new Error('Failed to generate payout run');
			return res.json();
		},
	});
}

export function useBackfillPayouts() {
	return useMutation({
		mutationFn: async (payload: { periodStart: string; periodEnd: string }) => {
			const res = await apiRequest('POST', '/api/admin/payouts/backfill', payload);
			if (!res.ok) throw new Error('Failed to backfill payouts');
			return res.json() as Promise<{ total: number; updated: number; skipped: number }>;
		},
	});
}

export function useLockPayoutRun() {
	return useMutation({
		mutationFn: async (id: number) => {
			const res = await apiRequest('POST', `/api/admin/payouts/runs/${id}/lock`);
			if (!res.ok) throw new Error('Failed to lock payout run');
			return res.json();
		},
	});
}

export function useDeletePayoutRun() {
	return useMutation({
		mutationFn: async (id: number) => {
			const res = await apiRequest('DELETE', `/api/admin/payouts/runs/${id}`);
			if (!res.ok) throw new Error('Failed to delete payout run');
			return res.json() as Promise<{ success: boolean }>; 
		},
	});
}

export function useClearPayouts() {
	return useMutation({
		mutationFn: async (payload: { periodStart: string; periodEnd: string }) => {
			const res = await apiRequest('POST', '/api/admin/payouts/clear', payload);
			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || 'Failed to clear payouts');
			}
			return res.json() as Promise<{ total: number; updated: number; locked?: boolean }>;
		},
	});
}

