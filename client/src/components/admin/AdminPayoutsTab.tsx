import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, DollarSign, Filter, RefreshCw, Calendar as CalendarIcon, Plus, Trash2, Users, BarChart3, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AdminAnalyticsMetrics, type MetricCard } from '@/components/admin-ui/AdminAnalyticsMetrics';
import { AdminModal, AdminModalSection, AdminModalDetailRow, AdminModalGrid } from '@/components/admin-ui/AdminModal';
import { AdminButton } from '@/components/admin-ui/AdminButton';
import { apiRequest } from '@/lib/queryClient';
import { useBackfillPayouts, useDeletePayoutRun, useGeneratePayoutRun, useLockPayoutRun, usePayoutRuns, useClearPayouts } from '@/hooks/useAdminPayouts';
import { usePayoutRates, useCreatePayoutRate, useRetirePayoutRate } from '@/hooks/usePayoutRates';
import { Switch } from '@/components/ui/switch';
// Removed booking details modal and related imports; not used in payouts tab

type MembershipFilter = 'all' | 'member' | 'non-member';
type AttendanceFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | 'manual';

type PayoutSummary = {
	totalSessions: number;
	totalOwedCents: number;
	uniqueAthletes: number;
};

type PayoutListRow = {
	id: number;
	booking_id: number;
	athlete_id: number;
	duration_minutes?: number | null;
	gym_payout_owed_cents: number | null;
	gym_rate_applied_cents: number | null;
	gym_member_at_booking: boolean;
	created_at: string;
	bookings: { preferred_date: string } | null;
	athletes?: { first_name?: string | null; last_name?: string | null; name?: string | null } | null;
};

function formatCents(cents: number | null | undefined) {
	const n = (cents ?? 0) / 100;
	return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function firstDayOfMonthISO(d = new Date()) {
	return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function lastDayOfMonthISO(d = new Date()) {
	return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export default function AdminPayoutsTab() {
	const { toast } = useToast();

	// Filters
	const [start, setStart] = useState<string>(firstDayOfMonthISO());
	const [end, setEnd] = useState<string>(lastDayOfMonthISO());
	const [membership, setMembership] = useState<MembershipFilter>('all');
	const [athleteId, setAthleteId] = useState<string>('');
	const [state, setState] = useState<AttendanceFilter>('all');
	const [duration, setDuration] = useState<string>('all');

	// Derived query string
	const queryParams = useMemo(() => {
		const params = new URLSearchParams();
		if (start) params.set('start', start);
		if (end) params.set('end', end);
		if (membership !== 'all') params.set('membership', membership);
		if (athleteId) params.set('athleteId', athleteId);
    if (state !== 'all') params.set('state', state);
    if (duration !== 'all') params.set('duration', duration);
		return params.toString();
	}, [start, end, membership, athleteId, state, duration]);

	// Summary
	const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery<PayoutSummary>({
		queryKey: ['/api/admin/payouts/summary', queryParams],
		queryFn: async () => {
			const res = await apiRequest('GET', `/api/admin/payouts/summary?${queryParams}`);
			if (!res.ok) throw new Error('Failed to fetch payout summary');
			return res.json();
		},
	});

	// List
	const { data: list = [], isLoading: loadingList, refetch: refetchList } = useQuery<PayoutListRow[]>({
		queryKey: ['/api/admin/payouts/list', queryParams],
		queryFn: async () => {
			const res = await apiRequest('GET', `/api/admin/payouts/list?${queryParams}`);
			if (!res.ok) throw new Error('Failed to fetch payout list');
			return res.json();
		},
	});
	// Removed booking details modal state and loader; not needed in payouts tab

	const onRefresh = async () => {
		await Promise.all([refetchSummary(), refetchList()]);
		toast({ title: 'Refreshed', description: 'Payout data reloaded.' });
	};

	// Metrics for AdminAnalyticsMetrics component
	const metrics: MetricCard[] = useMemo(() => [
		{
			key: 'total-sessions',
			label: 'Total Sessions',
			value: loadingSummary ? '—' : (summary?.totalSessions ?? 0).toLocaleString(),
			hint: 'Coaching sessions in period',
			icon: <BarChart3 className="h-4 w-4" />,
			color: 'blue'
		},
		{
			key: 'total-owed',
			label: 'Total Owed',
			value: loadingSummary ? '—' : formatCents(summary?.totalOwedCents ?? 0),
			hint: 'Amount owed to gym',
			icon: <DollarSign className="h-4 w-4" />,
			color: 'green'
		},
		{
			key: 'unique-athletes',
			label: 'Unique Athletes',
			value: loadingSummary ? '—' : (summary?.uniqueAthletes ?? 0).toLocaleString(),
			hint: 'Individual athletes coached',
			icon: <Users className="h-4 w-4" />,
			color: 'indigo'
		}
	], [summary, loadingSummary]);

	const onExportCsv = async () => {
		try {
			const url = `/api/admin/payouts/export.csv?${queryParams}`;
			// Use a hidden link to trigger download
			const a = document.createElement('a');
			a.href = url;
			a.download = `payouts-${start}_to_${end}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
		} catch (e: any) {
			toast({ title: 'Export failed', description: e?.message || 'Could not export CSV', variant: 'destructive' });
		}
	};

	const onExportPdf = async () => {
		try {
			const url = `/api/admin/payouts/export.pdf?${queryParams}`;
			const a = document.createElement('a');
			a.href = url;
			a.download = `payouts-${start}_to_${end}.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
		} catch (e: any) {
			toast({ title: 'Export failed', description: e?.message || 'Could not export PDF', variant: 'destructive' });
		}
	};

	// Simple totals by membership for table footer
	const totals = useMemo(() => {
		const all = (list || []).reduce((acc, r) => acc + (r.gym_payout_owed_cents || 0), 0);
		const members = (list || [])
			.filter((r) => r.gym_member_at_booking)
			.reduce((acc, r) => acc + (r.gym_payout_owed_cents || 0), 0);
		const nonMembers = all - members;
		return { all, members, nonMembers };
	}, [list]);

	useEffect(() => {
		// ensure start <= end
		if (start && end && start > end) {
			setEnd(start);
		}
	}, [start, end]);

	return (
		<div className="space-y-6 sm:space-y-8">
			{/* Top toolbar */}
			<div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full max-w-screen-sm mx-auto px-4 sm:max-w-none sm:px-0">
				<Button className="w-full sm:w-auto" variant="secondary" onClick={onRefresh}>
					<RefreshCw className="h-4 w-4 mr-2" /> Refresh
				</Button>
				<Button className="w-full sm:w-auto" onClick={onExportCsv}>
					<Download className="h-4 w-4 mr-2" /> CSV
				</Button>
				<Button className="w-full sm:w-auto" onClick={onExportPdf}>
					<Download className="h-4 w-4 mr-2" /> PDF
				</Button>
				<ManualPayoutDialog defaultStart={start} defaultEnd={end} />
			</div>

			{/* Filters */}
			<Card className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
				<CardHeader className="pb-4">
					<CardTitle className="text-lg font-bold text-[#0F0276] dark:text-white flex items-center gap-2">
						<Filter className="h-5 w-5 text-[#D8BD2A]" />
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
						<div className="space-y-1">
							<Label htmlFor="start-date" className="text-slate-700 dark:text-white">Start</Label>
							<Input 
								id="start-date" 
								type="date" 
								value={start} 
								onChange={(e) => setStart(e.target.value)} 
								className="bg-white/50 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-600"
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="end-date" className="text-slate-700 dark:text-white">End</Label>
							<Input 
								id="end-date" 
								type="date" 
								value={end} 
								onChange={(e) => setEnd(e.target.value)} 
								className="bg-white/50 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-600"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-slate-700 dark:text-white">Membership</Label>
							<Select value={membership} onValueChange={(v: MembershipFilter) => setMembership(v)}>
								<SelectTrigger className="bg-white/50 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-600">
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="member">Member</SelectItem>
									<SelectItem value="non-member">Non-member</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="athlete-id" className="text-slate-700 dark:text-white">Athlete ID (optional)</Label>
							<Input
								id="athlete-id"
								name="athlete-id"
								autoComplete="off"
								autoCorrect="off"
								autoCapitalize="off"
								spellCheck={false}
								aria-autocomplete="none"
								inputMode="tel"
								pattern="[0-9]*"
								data-lpignore="true"
								data-1p-ignore="true"
								data-form-type="other"
								data-gramm="false"
								value={athleteId}
								onChange={(e) => setAthleteId(e.target.value)}
								placeholder="e.g. 123"
								className="bg-white/50 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-600"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-slate-700 dark:text-white">Attendance</Label>
							<Select value={state} onValueChange={(v: AttendanceFilter) => setState(v)}>
								<SelectTrigger className="bg-white/50 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-600">
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="confirmed">Confirmed</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
									<SelectItem value="no-show">No-show</SelectItem>
									<SelectItem value="manual">Manual</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label className="text-slate-700 dark:text-white">Duration</Label>
							<Select value={duration} onValueChange={(v: string) => setDuration(v)}>
								<SelectTrigger className="bg-white/50 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-600">
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="30">30 min</SelectItem>
									<SelectItem value="60">60 min</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Payout Analytics Metrics */}
			<AdminAnalyticsMetrics 
				metrics={metrics}
				columns={{ base: 1, sm: 2, lg: 3 }}
				className="mb-6"
			/>

			{/* Table */}
			<Card className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-sm border-separate border-spacing-y-2">
							<thead>
								<tr className="border-transparent">
									<th className="text-left px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Date</th>
									<th className="text-left px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Athlete</th>
									<th className="text-left px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Membership</th>
									<th className="text-left px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Duration</th>
									<th className="text-right px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Owed</th>
									<th className="text-right px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Rate</th>
								</tr>
							</thead>
							<tbody>
								{loadingList ? (
									<tr>
										<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent" colSpan={6}>Loading…</td>
									</tr>
								) : list.length === 0 ? (
									<tr>
										<td className="py-6 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276]/80 border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white/80 dark:border-transparent" colSpan={6}>No payout rows for the selected filters.</td>
									</tr>
								) : (
									list.map((row) => {
										const athleteName = row.athletes?.name || [row.athletes?.first_name, row.athletes?.last_name].filter(Boolean).join(' ');
										const date = row.bookings?.preferred_date || '';
										return (
											<tr key={row.id} className="transition-colors border-transparent">
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent whitespace-nowrap">{date}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{athleteName || `Athlete #${row.athlete_id}`}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{row.gym_member_at_booking ? 'Member' : 'Non-member'}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{row.duration_minutes ? `${row.duration_minutes} min` : '—'}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent text-right font-semibold">{formatCents(row.gym_payout_owed_cents)}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent text-right text-[#0F0276]/80 dark:text-white/80">{formatCents(row.gym_rate_applied_cents)}</td>
											</tr>
										);
									})
								)}
							</tbody>
			    <tfoot className="bg-[#0F0276]/10 dark:bg-slate-800/50 border-t border-slate-200/60 dark:border-slate-600/60">
								<tr>
				    <td className="px-4 py-3 font-semibold text-[#0F0276] dark:text-white" colSpan={4}>Totals (visible)</td>
									<td className="px-4 py-3 text-right font-bold text-[#0F0276] dark:text-white">{formatCents(totals.all)}</td>
									<td className="px-4 py-3 text-right text-[#0F0276]/80 dark:text-white/80">
										<span className="mr-2">Members: {formatCents(totals.members)}</span>
										<span>Non-members: {formatCents(totals.nonMembers)}</span>
									</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* Payout runs */}
			<PayoutRunsPanel start={start} end={end} onDataChanged={onRefresh} />
			<PayoutRatesPanel />
		</div>
	);
}

		function PayoutRunsPanel({ start, end, onDataChanged }: { start: string; end: string; onDataChanged?: () => Promise<void> | void }) {
			const { data: runs = [], refetch } = usePayoutRuns(6);
			const gen = useGeneratePayoutRun();
			const backfill = useBackfillPayouts();
			const clearPayouts = useClearPayouts();
			const { toast } = useToast();

			const onGenerate = async () => {
				try {
					await gen.mutateAsync({ periodStart: start, periodEnd: end });
					await refetch();
					await onDataChanged?.();
					toast({ title: 'Payout run updated', description: `${start} → ${end}` });
				} catch (e: any) {
					toast({ title: 'Failed to generate payout run', description: e?.message || 'Unknown error', variant: 'destructive' });
				}
			};

			return (
				<Card className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
					<CardHeader className="pb-4">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<CardTitle className="text-lg font-bold text-[#0F0276] dark:text-white flex items-center gap-2">
								<CalendarIcon className="h-5 w-5 text-[#D8BD2A]" />
								Recent payout runs
							</CardTitle>
							<div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap sm:justify-end">
								<Button className="w-full sm:w-auto" onClick={onGenerate} disabled={gen.isPending} size="sm">
									{gen.isPending ? 'Updating…' : 'Generate/Refresh current period'}
								</Button>
								<Button className="w-full sm:w-auto" variant="secondary" size="sm" onClick={async () => {
									try {
										const result = await backfill.mutateAsync({ periodStart: start, periodEnd: end });
										await refetch();
										await onDataChanged?.();
										toast({ title: 'Backfill complete', description: `Updated ${result.updated} / ${result.total} rows` });
									} catch (e: any) {
										toast({ title: 'Backfill failed', description: e?.message || 'Unknown error', variant: 'destructive' });
									}
								}} disabled={backfill.isPending}>
									{backfill.isPending ? 'Backfilling…' : 'Backfill current period'}
								</Button>
								<Button className="w-full sm:w-auto" variant="destructive" size="sm" onClick={async () => {
									if (!confirm(`Clear payout calculations for ${start} → ${end}? This will reset owed and applied rate values for this period. You can backfill again later.`)) return;
									try {
										const result = await clearPayouts.mutateAsync({ periodStart: start, periodEnd: end });
										await refetch();
										await onDataChanged?.();
										toast({ title: 'Payouts cleared', description: `Reset ${result.updated} rows` });
									} catch (e: any) {
										toast({ title: 'Clear failed', description: e?.message || 'Unknown error', variant: 'destructive' });
									}
								}} disabled={clearPayouts.isPending}>
									{clearPayouts.isPending ? 'Clearing…' : 'Clear current period'}
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full text-sm border-separate border-spacing-y-2">
								<thead>
									<tr className="border-transparent">
										<th className="text-left px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Period</th>
										<th className="text-left px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Status</th>
										<th className="text-right px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Sessions</th>
										<th className="text-right px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Total Owed</th>
										<th className="text-left px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Updated</th>
										<th className="text-right px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Actions</th>
									</tr>
								</thead>
								<tbody>
									{runs.length === 0 ? (
										<tr>
											<td className="py-6 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276]/80 border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white/80 dark:border-transparent" colSpan={6}>No runs yet. Generate one for the current period.</td>
										</tr>
									) : (
										runs.map((r) => (
											<tr key={r.id} className="transition-colors border-transparent">
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{r.period_start} → {r.period_end}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent capitalize">{r.status}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent text-right">{r.total_sessions}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent text-right font-semibold">{formatCents(r.total_owed_cents)}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{new Date(r.updated_at).toLocaleString()}</td>
												<td className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent text-right">
			                    <RunActions r={r} onChanged={async () => { await refetch(); await onDataChanged?.(); }} />
			                  </td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			);
		}

		function RunActions({ r, onChanged }: { r: { id: number; status: string }; onChanged?: () => void | Promise<void> }) {
			const lockRun = useLockPayoutRun();
			const deleteRun = useDeletePayoutRun();
			const { toast } = useToast();
			const isLocked = r.status === 'locked';

			return (
				<div className="flex items-center justify-end gap-2">
					<Button size="sm" variant={isLocked ? 'secondary' : 'default'} disabled={isLocked || lockRun.isPending} onClick={async () => {
						try {
							await lockRun.mutateAsync(r.id);
							await onChanged?.();
							toast({ title: 'Run locked' });
						} catch (e: any) {
							toast({ title: 'Failed to lock', description: e?.message || 'Unknown error', variant: 'destructive' });
						}
					}}>Lock</Button>
					<Button size="sm" variant="destructive" disabled={deleteRun.isPending} onClick={async () => {
						if (!confirm('Delete this payout run? This cannot be undone.')) return;
						try {
							await deleteRun.mutateAsync(r.id);
							await onChanged?.();
							toast({ title: 'Run deleted' });
						} catch (e: any) {
							toast({ title: 'Failed to delete', description: e?.message || 'Unknown error', variant: 'destructive' });
						}
					}}>Delete</Button>
				</div>
			);
		}

// ———————————————————————————————
// Manual Invoice Dialog UI
// ———————————————————————————————

type AdminAthlete = { id: number; name?: string | null; first_name?: string | null; last_name?: string | null };
type PayoutLine = {
	athleteId?: number;
	athleteName?: string;
	date: string; // YYYY-MM-DD
	time?: string; // HH:MM
	durationMinutes?: number;
	member?: boolean;
	rateDollars?: string; // UI only; convert to cents
	owedDollars?: string; // UI only; convert to cents (renamed from amountDollars)
	// internal flags
	_userEditedRate?: boolean;
};

function ManualPayoutDialog({ defaultStart, defaultEnd }: { defaultStart: string; defaultEnd: string }) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [invoiceTitle, setInvoiceTitle] = useState<string>('Manual Payout');
	const [periodStart, setPeriodStart] = useState<string>(defaultStart);
	const [periodEnd, setPeriodEnd] = useState<string>(defaultEnd);
	const [timezone, setTimezone] = useState<string>('America/Los_Angeles');
	const [notes, setNotes] = useState<string>('');

	// Athletes list for selection
	const { data: athletes = [] } = useQuery<AdminAthlete[]>({
		queryKey: ['/api/athletes'],
		queryFn: async () => {
			const res = await apiRequest('GET', '/api/athletes');
			if (!res.ok) throw new Error('Failed to load athletes');
			return res.json();
		},
		enabled: open, // only fetch when dialog opens
		staleTime: 60_000,
	});

	const athleteLabel = (a: AdminAthlete) => a?.name || [a?.first_name, a?.last_name].filter(Boolean).join(' ') || `Athlete #${a?.id}`;

	const todayISO = new Date().toISOString().slice(0, 10);
	const [lines, setLines] = useState<PayoutLine[]>([{ date: todayISO }]);

	const addLine = () => setLines((ls) => [...ls, { date: todayISO }]);
	const removeLine = (idx: number) => setLines((ls) => ls.filter((_, i) => i !== idx));
	const updateLine = (idx: number, patch: Partial<PayoutLine>) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

	// Fetch active payout rates to auto-fill rate when duration+member are chosen
	const { data: activeRates = [] } = usePayoutRates('active');
	const rateLookup = useMemo(() => {
		const m = new Map<string, number>();
		for (const r of activeRates) {
			const key = `${r.duration_minutes}:${r.is_member ? '1' : '0'}`;
			m.set(key, r.rate_cents);
		}
		return m;
	}, [activeRates]);
	const getRateDollars = (duration?: number, member?: boolean): string | undefined => {
		if (!duration || typeof member !== 'boolean') return undefined;
		const cents = rateLookup.get(`${duration}:${member ? '1' : '0'}`);
		if (typeof cents === 'number') return (cents / 100).toFixed(2);
		return undefined;
	};

	function getApiBaseUrl() {
		if (import.meta.env.MODE === 'development') return 'http://localhost:6001';
		return '';
	}

	function parseFilenameFromDisposition(header: string | null): string | null {
		if (!header) return null;
		const match = /filename\*=UTF-8''([^;]+)|filename="?([^;"]+)"?/i.exec(header);
		return decodeURIComponent((match?.[1] || match?.[2] || '').trim() || '');
	}

	const onSubmit = async () => {
		try {
			if (!lines.length) {
				toast({ title: 'Add at least one line', variant: 'destructive' });
				return;
			}
			// Map dollars -> cents (integers)
			const lineItems = lines.map((l) => ({
				athleteId: l.athleteId || undefined,
				athleteName: l.athleteName?.trim() ? l.athleteName.trim() : undefined,
				date: l.date,
				time: l.time?.trim() || undefined,
				durationMinutes: l.durationMinutes || undefined,
				member: typeof l.member === 'boolean' ? l.member : undefined,
				rateCents: l.rateDollars && l.rateDollars.trim() !== '' ? Math.round(parseFloat(l.rateDollars) * 100) : undefined,
				owedCents: l.owedDollars && l.owedDollars.trim() !== '' ? Math.round(parseFloat(l.owedDollars) * 100) : undefined,
			}));

			const payload = {
				invoiceTitle: invoiceTitle?.trim() || undefined,
				periodStart: periodStart || undefined,
				periodEnd: periodEnd || undefined,
				timezone: timezone || undefined,
				notes: notes?.trim() || undefined,
				lineItems,
			};

			const res = await fetch(`${getApiBaseUrl()}/api/admin/invoices/manual/export.pdf`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				credentials: 'include',
			});
			if (!res.ok) {
				let message = `Request failed: ${res.status}`;
				try {
					if (res.headers.get('content-type')?.includes('application/json')) {
						const err = await res.json();
						message = err?.error || err?.message || message;
					} else {
						const txt = await res.text();
						if (txt) message = txt;
					}
				} catch {}
				throw new Error(message);
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			const disp = res.headers.get('Content-Disposition');
			const fileName = parseFilenameFromDisposition(disp) || `manual-invoice-${periodStart || ''}_to_${periodEnd || ''}.pdf`;
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			setOpen(false);
			toast({ title: 'Invoice generated', description: 'Downloaded PDF' });
		} catch (e: any) {
			toast({ title: 'Failed to generate invoice', description: e?.message || 'Unknown error', variant: 'destructive' });
		}
	};

	return (
		<>
			<Button className="w-full sm:w-auto" variant="outline" onClick={() => setOpen(true)}>
				<Plus className="h-4 w-4 mr-2" /> Manual Payout
			</Button>
			<AdminModal
				isOpen={open}
				onClose={() => setOpen(false)}
				title="Create Manual Payout"
				size="3xl"
				className="[&_.absolute.right-4.top-4]:hidden"
				footer={
					<div className="flex items-center justify-between w-full">
						<p className="text-xs text-slate-600 dark:text-slate-400">
							All currency values should be entered in dollars (will be converted to cents).
						</p>
						<AdminButton onClick={onSubmit}>
							Generate PDF
						</AdminButton>
					</div>
				}
			>
				<AdminModalSection title="Payout Settings" icon={<FileText className="h-5 w-5" />}>
					<AdminModalGrid cols={2}>
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
								Title
							</label>
							<Input
								value={invoiceTitle}
								onChange={(e) => setInvoiceTitle(e.target.value)}
								placeholder="Manual Payout"
								className="w-full"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
								Timezone
							</label>
							<Input
								value={timezone}
								onChange={(e) => setTimezone(e.target.value)}
								placeholder="America/Los_Angeles"
								className="w-full"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
								Period Start
							</label>
							<Input
								type="date"
								value={periodStart}
								onChange={(e) => setPeriodStart(e.target.value)}
								className="w-full"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
								Period End
							</label>
							<Input
								type="date"
								value={periodEnd}
								onChange={(e) => setPeriodEnd(e.target.value)}
								className="w-full"
							/>
						</div>
					</AdminModalGrid>
					<div className="mt-4">
						<label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
							Notes
						</label>
						<Textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Optional notes that appear beneath the header"
							className="w-full min-h-[60px]"
						/>
					</div>
				</AdminModalSection>

				<AdminModalSection title="Line Items" icon={<Plus className="h-5 w-5" />} className="mt-6">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="text-sm font-medium text-slate-700 dark:text-slate-300">Session Details</div>
							<AdminButton size="sm" variant="secondary" onClick={addLine}>
								<Plus className="h-4 w-4 mr-1" /> Add Line
							</AdminButton>
						</div>
						
						{/* Mobile-first responsive design */}
						<div className="space-y-3">
							{lines.map((l, idx) => (
								<div key={idx} className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										<div>
											<label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
												Athlete
											</label>
											<Select value={l.athleteId ? String(l.athleteId) : 'none'} onValueChange={(v) => updateLine(idx, { athleteId: v === 'none' ? undefined : Number(v) })}>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select athlete" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">—</SelectItem>
													{athletes.map((a) => (
														<SelectItem key={a.id} value={String(a.id)}>{athleteLabel(a)}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										
										<div>
											<label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
												Custom Name
											</label>
											<Input 
												value={l.athleteName || ''} 
												onChange={(e) => updateLine(idx, { athleteName: e.target.value })} 
												placeholder="Or type custom name" 
												className="w-full"
											/>
										</div>
										
										<div>
											<label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
												Date
											</label>
											<Input 
												type="date" 
												value={l.date} 
												onChange={(e) => updateLine(idx, { date: e.target.value })} 
												className="w-full"
											/>
										</div>
										
										<div>
											<label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
												Time
											</label>
											<Input 
												type="time" 
												value={l.time || ''} 
												onChange={(e) => updateLine(idx, { time: e.target.value })} 
												className="w-full"
											/>
										</div>
										
										<div>
											<label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
												Duration
											</label>
											<Select
												value={l.durationMinutes ? String(l.durationMinutes) : 'none'}
												onValueChange={(v) => {
													const dur = v === 'none' ? undefined : Number(v);
													const autoRate = (!l._userEditedRate) ? getRateDollars(dur, l.member) : undefined;
													updateLine(idx, {
														durationMinutes: dur,
														...(autoRate ? { rateDollars: autoRate } : {}),
													});
												}}
											>
												<SelectTrigger>
													<SelectValue placeholder="Duration" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">—</SelectItem>
													<SelectItem value="30">30 min</SelectItem>
													<SelectItem value="60">60 min</SelectItem>
												</SelectContent>
											</Select>
										</div>
										
										<div>
											<label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
												Member
											</label>
											<div className="flex items-center justify-center h-9">
												<Switch
													checked={!!l.member}
													onCheckedChange={(v) => {
														const autoRate = (!l._userEditedRate) ? getRateDollars(l.durationMinutes, v) : undefined;
														updateLine(idx, {
															member: v,
															...(autoRate ? { rateDollars: autoRate } : {}),
														});
													}}
												/>
											</div>
										</div>
										
										<div>
											<label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
												Rate ($)
											</label>
											<Input
												inputMode="decimal"
												placeholder="0.00"
												value={l.rateDollars || ''}
												onChange={(e) => {
													updateLine(idx, { rateDollars: e.target.value, _userEditedRate: true });
												}}
												className="w-full"
											/>
										</div>
									</div>
									
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
										<div>
											<label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
												Owed ($)
											</label>
											<Input
												inputMode="decimal"
												placeholder="0.00"
												value={l.owedDollars || ''}
												onChange={(e) => updateLine(idx, { owedDollars: e.target.value })}
												className="w-full"
											/>
										</div>
										
										<div className="flex items-end">
											<AdminButton
												size="sm"
												variant="destructive"
												onClick={() => removeLine(idx)}
												className="px-3 h-9"
											>
												<Trash2 className="h-4 w-4 mr-1" /> Remove
											</AdminButton>
										</div>
									</div>
								</div>
							))}
						</div>
						
						{lines.length === 0 && (
							<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600">
								No line items — click "Add Line" to begin.
							</div>
						)}
					</div>
				</AdminModalSection>
			</AdminModal>
		</>
	);
}

// Payout Rates Management Panel
function PayoutRatesPanel() {
	const { data: rates = [], refetch, isLoading } = usePayoutRates('all');
	const createRate = useCreatePayoutRate();
	const retireRate = useRetirePayoutRate();
	const { toast } = useToast();
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({ durationMinutes: '30', isMember: 'true', rateDollars: '', effectiveFrom: '' });

	const onSubmit = async () => {
		try {
			const durationMinutes = parseInt(form.durationMinutes, 10);
			const isMember = form.isMember === 'true';
			const rateCents = Math.round(parseFloat(form.rateDollars) * 100);
			if (!durationMinutes || !rateCents) {
				toast({ title: 'Missing fields', description: 'Duration and rate required', variant: 'destructive' });
				return;
			}
			await createRate.mutateAsync({ durationMinutes, isMember, rateCents, effectiveFrom: form.effectiveFrom || undefined });
			toast({ title: 'Rate created', description: `${durationMinutes}m ${isMember ? 'Member' : 'Non-member'}` });
			setShowForm(false);
			setForm({ durationMinutes: '30', isMember: 'true', rateDollars: '', effectiveFrom: '' });
			await refetch();
		} catch (e: any) {
			toast({ title: 'Create failed', description: e?.message || 'Error', variant: 'destructive' });
		}
	};

	const now = Date.now();

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="font-semibold text-slate-700 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Payout Rates</div>
				<div className="flex gap-2">
					<Button variant={showForm ? 'secondary' : 'default'} onClick={() => setShowForm(v => !v)}>{showForm ? 'Cancel' : 'New Rate'}</Button>
				</div>
			</div>
			{showForm && (
				<div className="rounded-xl border bg-white p-4 space-y-3">
					<div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
						<div>
							<Label className="text-xs">Duration</Label>
							<select className="w-full border rounded px-2 py-1" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}>
								<option value="30">30 min</option>
								<option value="60">60 min</option>
							</select>
						</div>
						<div>
							<Label className="text-xs">Membership</Label>
							<select className="w-full border rounded px-2 py-1" value={form.isMember} onChange={e => setForm(f => ({ ...f, isMember: e.target.value }))}>
								<option value="true">Member</option>
								<option value="false">Non-member</option>
							</select>
						</div>
						<div>
							<Label className="text-xs">Rate (USD)</Label>
							<Input type="number" step="0.01" value={form.rateDollars} placeholder="e.g. 150.00" onChange={e => setForm(f => ({ ...f, rateDollars: e.target.value }))} />
						</div>
						<div>
							<Label className="text-xs">Effective From (optional)</Label>
							<Input type="datetime-local" value={form.effectiveFrom ? form.effectiveFrom.slice(0,16) : ''} onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
						</div>
						<div className="flex items-end">
							<Button className="w-full" disabled={createRate.isPending} onClick={onSubmit}>{createRate.isPending ? 'Saving…' : 'Save'}</Button>
						</div>
					</div>
					<p className="text-xs text-slate-500">Creating a new rate automatically retires the previous active rate for the same duration & membership.</p>
				</div>
			)}
			<div className="overflow-x-auto">
				<table className="w-full text-sm border-separate border-spacing-y-2">
					<thead>
						<tr className="text-[#0F0276] dark:text-white">
							<th className="text-left px-4 py-3 font-semibold bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent">Duration</th>
							<th className="text-left px-4 py-3 font-semibold bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent">Membership</th>
							<th className="text-right px-4 py-3 font-semibold bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent">Rate</th>
							<th className="text-left px-4 py-3 font-semibold bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent">Effective From</th>
							<th className="text-left px-4 py-3 font-semibold bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent">Effective To</th>
							<th className="text-left px-4 py-3 font-semibold bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent">Status</th>
							<th className="text-right px-4 py-3 font-semibold bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent">Actions</th>
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr><td className="px-4 py-4 text-center text-slate-500" colSpan={7}>Loading…</td></tr>
						) : rates.length === 0 ? (
							<tr><td className="px-4 py-6 text-center text-slate-500" colSpan={7}>No rates configured.</td></tr>
						) : (
							rates.map(r => {
								const active = !r.effective_to || new Date(r.effective_to).getTime() > now;
								return (
									<tr key={r.id}>
										<td className="px-4 py-3 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{r.duration_minutes} min</td>
										<td className="px-4 py-3 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{r.is_member ? 'Member' : 'Non-member'}</td>
										<td className="px-4 py-3 text-right bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{(r.rate_cents/100).toLocaleString(undefined,{style:'currency',currency:'USD'})}</td>
										<td className="px-4 py-3 whitespace-nowrap bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{r.effective_from}</td>
										<td className="px-4 py-3 whitespace-nowrap bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{r.effective_to || '—'}</td>
										<td className="px-4 py-3 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{active ? <span className="text-green-600 font-medium dark:text-green-400">Active</span> : <span className="text-slate-500">Historical</span>}</td>
										<td className="px-4 py-3 text-right bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
											{active && !r.effective_to && (
												<Button size="sm" variant="secondary" disabled={retireRate.isPending} onClick={async () => {
													try {
														await retireRate.mutateAsync({ id: r.id });
														toast({ title: 'Rate retired', description: `${r.duration_minutes}m ${r.is_member ? 'Member' : 'Non-member'}` });
														await refetch();
													} catch (e: any) {
														toast({ title: 'Retire failed', description: e?.message || 'Error', variant: 'destructive' });
													}
												}}>Retire</Button>
											)}
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

