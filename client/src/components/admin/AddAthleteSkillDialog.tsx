import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AdminModal, AdminModalSection } from '@/components/admin-ui/AdminModal';
import { AdminButton } from '@/components/admin-ui/AdminButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Target, Award } from 'lucide-react';
import { useApparatusList, useSkills, type Skill } from '@/hooks/useSkills';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athleteId: number;
  onPickSkill?: (skill: Skill) => void;
};

export default function AddAthleteSkillDialog({ open, onOpenChange, athleteId, onPickSkill }: Props) {
  const { data: apparatus = [] } = useApparatusList();
  const [apparatusId, setApparatusId] = useState<number | 'all'>('all');
  const [level, setLevel] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  const { data: skills = [] } = useSkills({ apparatusId: apparatusId === 'all' ? undefined : apparatusId, level: level === 'all' ? undefined : level });
  const searchRef = useRef<HTMLInputElement | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (skills || []).filter(s => {
      if (!q) return true;
      return (s.name || '').toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0) || (a.name || '').localeCompare(b.name || ''));
  }, [skills, search]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  return (
    <AdminModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Add/Test a Skill"
      size="2xl"
      showCloseButton={false}
    >
      <AdminModalSection title="Skill Search & Filters" icon={<Search className="h-4 w-4" />} gradient="blue">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Search Skills</Label>
            <Input
              placeholder="Search by name, category, or description..."
              value={search}
              ref={searchRef}
              autoFocus
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setSearch(e.target.value);
              }}
              className="bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Apparatus</Label>
            <Select
              value={apparatusId === 'all' ? 'all' : String(apparatusId)}
              onValueChange={(v) => {
                setApparatusId(v === 'all' ? 'all' : Number(v));
                // Blur select trigger and focus search to capture typing
                const el = document.activeElement as HTMLElement | null;
                if (el && typeof el.blur === 'function') el.blur();
                requestAnimationFrame(() => searchRef.current?.focus());
              }}
            >
              <SelectTrigger className="bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Apparatus</SelectItem>
                {apparatus.map(ap => (<SelectItem key={ap.id} value={String(ap.id)}>{ap.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">Level</Label>
            <Select
              value={level === 'all' ? 'all' : level}
              onValueChange={(v) => {
                setLevel(v);
                const el = document.activeElement as HTMLElement | null;
                if (el && typeof el.blur === 'function') el.blur();
                requestAnimationFrame(() => searchRef.current?.focus());
              }}
            >
              <SelectTrigger className="bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Array.from(new Set((skills || []).map(s => (s.level || '').toString()).filter(Boolean))).sort().map(l => (
                  <SelectItem key={l} value={l}>Level {l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdminModalSection>

      <AdminModalSection title="Available Skills" icon={<Target className="h-4 w-4" />} gradient="green">
        <ScrollArea className="h-80 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
          <div className="p-3 grid grid-cols-1 gap-3">
            {visible.map(s => (
              <div key={s.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 flex items-center justify-between hover:bg-white/90 dark:hover:bg-slate-800/90 transition-colors">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">
                    {s.name || `Skill #${s.id}`}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {s.category || 'General'}{s.level ? ` • Level ${s.level}` : ''}
                  </div>
                  {s.description && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {s.description}
                    </div>
                  )}
                </div>
                <AdminButton
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    // Defuse focus before closing to avoid aria-hidden on focused element
                    const el = document.activeElement as HTMLElement | null;
                    if (el && typeof el.blur === 'function') el.blur();
                    // Close the picker, then open the tester after exit transition
                    onOpenChange(false);
                    setTimeout(() => onPickSkill?.(s), 250);
                  }}
                  className="ml-3"
                >
                  <Award className="h-4 w-4 mr-1" />
                  Test Skill
                </AdminButton>
              </div>
            ))}
            {!visible.length && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No skills found</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Try adjusting your search terms or filters to find skills.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </AdminModalSection>
    </AdminModal>
  );
}
