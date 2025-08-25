import React, { useEffect, useState } from 'react';
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from '@/components/admin-ui/AdminCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

type ProgressSettings = {
  requiredMasteredPerLevel: Record<ExperienceLevel, number>;
};

const DEFAULTS: ProgressSettings = {
  requiredMasteredPerLevel: {
    beginner: 5,
    intermediate: 8,
    advanced: 12,
    elite: 16,
  },
};

export function AdminProgressSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<ProgressSettings>(DEFAULTS);
  const [about, setAbout] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest('GET', '/api/site-content');
        const content = await res.json();
        const ps: ProgressSettings | undefined = content?.about?.progressSettings;
        setAbout(content?.about || {});
        if (ps?.requiredMasteredPerLevel) {
          setValues({
            requiredMasteredPerLevel: {
              ...DEFAULTS.requiredMasteredPerLevel,
              ...ps.requiredMasteredPerLevel,
            },
          });
        }
      } catch (_) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (level: ExperienceLevel, val: number) => {
    setValues(v => ({
      ...v,
      requiredMasteredPerLevel: { ...v.requiredMasteredPerLevel, [level]: Math.max(0, Math.floor(val || 0)) },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const nextAbout = { ...(about || {}), progressSettings: values };
      const res = await apiRequest('POST', '/api/admin/site-content/about', { about: nextAbout });
      if (!res.ok) throw new Error('Failed to save');
      toast({ title: 'Saved', description: 'Progress settings updated.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard>
      <AdminCardHeader>
        <AdminCardTitle>Progress Settings</AdminCardTitle>
      </AdminCardHeader>
      <AdminCardContent>
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-white/80">
            Set how many skills an athlete must Master at each experience level before auto-upgrading to the next level.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['beginner','intermediate','advanced','elite'] as ExperienceLevel[]).map(level => (
              <div key={level}>
                <Label className="capitalize">{level}</Label>
                <Input
                  type="number"
                  min={0}
                  value={values.requiredMasteredPerLevel[level]}
                  onChange={(e) => update(level, Number(e.target.value))}
                  disabled={loading}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button disabled={saving || loading} onClick={save}>{saving ? 'Saving…' : 'Save Settings'}</Button>
          </div>
        </div>
      </AdminCardContent>
    </AdminCard>
  );
}

export default AdminProgressSettings;
