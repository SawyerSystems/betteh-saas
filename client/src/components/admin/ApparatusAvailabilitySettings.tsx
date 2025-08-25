import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

type Apparatus = { id: number; name: string };

type AvailabilityState = {
  parent: number[]; // allowed apparatus ids for parents
  admin: number[];  // allowed apparatus ids for admins
};

export default function ApparatusAvailabilitySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: apparatus = [] } = useQuery<Apparatus[]>({
    queryKey: ['/api/apparatus'],
    queryFn: async () => (await apiRequest('GET', '/api/apparatus')).json(),
    staleTime: 60_000,
  });

  const { data: siteContent } = useQuery<any>({
    queryKey: ['/api/site-content'],
    queryFn: async () => (await apiRequest('GET', '/api/site-content')).json(),
    staleTime: 60_000,
  });

  const about = siteContent?.about || {};
  const initial: AvailabilityState = about?.apparatusAvailability || { parent: [], admin: [] };
  const [state, setState] = useState<AvailabilityState>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Hydrate when content loads
    setState(about?.apparatusAvailability || { parent: [], admin: [] });
  }, [about?.apparatusAvailability]);

  const toggle = (scope: keyof AvailabilityState, id: number) => {
    setState(prev => {
      const set = new Set(prev[scope]);
      if (set.has(id)) set.delete(id); else set.add(id);
      return { ...prev, [scope]: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const allIds = useMemo(() => apparatus.map(a => a.id), [apparatus]);
  const setAll = (scope: keyof AvailabilityState, checked: boolean) => {
    setState(prev => ({ ...prev, [scope]: checked ? [...allIds] : [] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const nextAbout = { ...(about || {}), apparatusAvailability: state };
      const res = await apiRequest('POST', '/api/admin/site-content/about', { about: nextAbout });
      if (!res.ok) throw new Error('Failed to save apparatus availability');
      const json = await res.json();
      const savedAbout = json?.about || nextAbout;
      const savedAvailability = savedAbout?.apparatusAvailability || { parent: [], admin: [] };
      setState(savedAvailability);
  // Refresh cached site content so toggles reflect persisted state on return
  await queryClient.invalidateQueries({ queryKey: ['/api/site-content'] });
  await queryClient.refetchQueries({ queryKey: ['/api/site-content'] });
      toast({ title: 'Saved', description: 'Apparatus availability updated.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!apparatus || apparatus.length === 0) {
    return (
      <div className="text-sm text-gray-600 dark:text-slate-300">No apparatus found. Add apparatus first in the Apparatus manager.</div>
    );
  }

  const renderGroup = (scope: keyof AvailabilityState, title: string, hint: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-medium">{title}</Label>
          <p className="text-xs text-gray-500">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAll(scope, true)}>Allow All</Button>
          <Button variant="outline" size="sm" onClick={() => setAll(scope, false)}>Allow None</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {apparatus.map(a => {
          const active = state[scope].includes(a.id);
          return (
            <button
              key={`${scope}-${a.id}`}
              type="button"
              onClick={() => toggle(scope, a.id)}
              className={`px-3 py-1.5 rounded-full border text-sm transition ${active ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              aria-pressed={active}
            >
              {a.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-semibold">Apparatus Availability</h4>
        <p className="text-sm text-gray-600 dark:text-slate-300">Choose which apparatus are available when selecting focus areas.</p>
      </div>
      {renderGroup('parent', 'Parent Portal', 'Controls apparatus parents can choose from during booking.')}
      {renderGroup('admin', 'Admin Dashboard', 'Controls apparatus shown to admins in edit/booking flows.')}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
