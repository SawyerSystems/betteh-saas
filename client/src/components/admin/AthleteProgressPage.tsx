import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin-ui/AdminCard";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useApparatusList } from "@/hooks/useSkills";
import { SKILL_STATUSES, useAthleteSkills } from "@/hooks/useAthleteProgress";
import type { Athlete } from "@shared/schema";

type Apparatus = { id: number; name: string };

function useAthletes() {
  return useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/athletes");
      return res.json();
    },
  });
}

export default function AthleteProgressPage() {
  const { data: athletes = [], isLoading: loadingAthletes } = useAthletes();
  const { data: apparatus = [] } = useApparatusList();

  const [athleteId, setAthleteId] = useState<number | undefined>(undefined);
  const [apparatusId, setApparatusId] = useState<number | "all">("all");
  const [level, setLevel] = useState<string | "all">("all");
  const [search, setSearch] = useState("");

  const filteredAthletes = useMemo(() => {
    if (!search.trim()) return athletes;
    const q = search.toLowerCase();
    return athletes.filter(a => {
      const name = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
      return name.includes(q) || (a as any)?.name?.toLowerCase?.().includes(q);
    });
  }, [athletes, search]);

  const { data: athleteSkills = [], isLoading: loadingSkills } = useAthleteSkills(athleteId);

  // Collect levels present for the selected athlete to populate the level filter
  const availableLevels = useMemo(() => {
    const s = new Set<string>();
    (athleteSkills || []).forEach((as) => {
      const lvl = as.skill?.level?.toString()?.trim();
      if (lvl) s.add(lvl);
    });
    return Array.from(s).sort();
  }, [athleteSkills]);

  const apparatusById = useMemo(() => {
    const map = new Map<number, Apparatus>();
    (apparatus || []).forEach((ap) => map.set(ap.id, ap));
    return map;
  }, [apparatus]);

  // Filter skills based on selected apparatus and level
  const visibleSkills = useMemo(() => {
    return (athleteSkills || []).filter((as) => {
      if (apparatusId !== "all" && as.skill?.apparatusId !== apparatusId) return false;
      if (level !== "all") {
        const lvl = as.skill?.level?.toString?.();
        if (lvl !== level) return false;
      }
      return true;
    });
  }, [athleteSkills, apparatusId, level]);

  // Summary computations
  const overall = useMemo(() => {
    const total = visibleSkills.length;
    const counts: Record<string, number> = { prepping: 0, learning: 0, consistent: 0, mastered: 0 };
    visibleSkills.forEach((as) => {
      const raw = (as.status || '').toString().toLowerCase();
      const key = raw === 'working' ? 'prepping' : raw;
      if (key in counts) counts[key] += 1;
    });
    const mastered = counts["mastered"] || 0;
    const consistent = counts["consistent"] || 0;
    const masteredPct = total ? Math.round((mastered / total) * 100) : 0;
    const consistentPct = total ? Math.round(((mastered + consistent) / total) * 100) : 0;
    return { total, counts, masteredPct, consistentPct };
  }, [visibleSkills]);

  const perApparatus = useMemo(() => {
    const groups = new Map<number, typeof overall>();
    visibleSkills.forEach((as) => {
      const apId = as.skill?.apparatusId;
      if (!apId) return;
      if (!groups.has(apId)) groups.set(apId, { total: 0, counts: {}, masteredPct: 0, consistentPct: 0 } as any);
      const g: any = groups.get(apId)!;
      g.total += 1;
      const raw = (as.status || '').toString().toLowerCase();
      const key = raw === 'working' ? 'prepping' : raw;
      g.counts[key] = (g.counts[key] || 0) + 1;
    });
    // compute percentages
    const rows = Array.from(groups.entries()).map(([apId, g]: any) => {
      const mastered = g.counts["mastered"] || 0;
      const consistent = g.counts["consistent"] || 0;
      const masteredPct = g.total ? Math.round((mastered / g.total) * 100) : 0;
      const consistentPct = g.total ? Math.round(((mastered + consistent) / g.total) * 100) : 0;
      return {
        apparatusId: apId,
        total: g.total,
        counts: g.counts,
        masteredPct,
        consistentPct,
      };
    });
    // stable sort by apparatus name
    return rows.sort((a, b) => (apparatusById.get(a.apparatusId)?.name || "").localeCompare(apparatusById.get(b.apparatusId)?.name || ""));
  }, [visibleSkills, apparatusById]);

  const perApparatusLevel = useMemo(() => {
    const map = new Map<number, Map<string, { total: number; mastered: number; consistent: number; prepping: number; learning: number }>>();
    visibleSkills.forEach(as => {
      const ap = as.skill?.apparatusId; if (!ap) return;
      const lvl = (as.skill?.level || 'Unknown').toString();
      if (!map.has(ap)) map.set(ap, new Map());
          const inner = map.get(ap)!;
          if (!inner.has(lvl)) inner.set(lvl, { total: 0, mastered: 0, consistent: 0, prepping: 0, learning: 0 });
      const s = inner.get(lvl)!;
      s.total += 1;
      const raw = (as.status || '').toString().toLowerCase();
      const st = raw === 'working' ? 'prepping' : raw;
      if (st === 'mastered') s.mastered += 1;
      if (st === 'consistent') s.consistent += 1;
      if (st === 'prepping') s.prepping += 1;
      if (st === 'learning') s.learning += 1;
    });
    return Array.from(map.entries()).map(([ap, inner]) => ({
      apparatusId: ap,
      levels: Array.from(inner.entries()).map(([lvl, s]) => ({
        level: lvl,
        total: s.total,
        mastered: s.mastered,
        consistent: s.consistent,
            prepping: s.prepping,
        learning: s.learning,
        masteredPct: s.total ? Math.round((s.mastered / s.total) * 100) : 0,
        consistentPct: s.total ? Math.round(((s.consistent + s.mastered) / s.total) * 100) : 0,
      })).sort((a, b) => a.level.localeCompare(b.level))
    })).sort((a, b) => (apparatusById.get(a.apparatusId)?.name || '').localeCompare(apparatusById.get(b.apparatusId)?.name || ''));
  }, [visibleSkills, apparatusById]);

  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>Search Athletes</Label>
            <Input placeholder="Type a name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <Label>Select Athlete</Label>
            <Select value={athleteId ? String(athleteId) : undefined} onValueChange={(v) => setAthleteId(v ? Number(v) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder={loadingAthletes ? "Loading…" : "Choose an athlete"} />
              </SelectTrigger>
              <SelectContent>
                {filteredAthletes.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {`${a.firstName || ""} ${a.lastName || ""}`.trim() || (a as any)?.name || `Athlete #${a.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Apparatus</Label>
            <Select value={apparatusId === "all" ? "all" : String(apparatusId)} onValueChange={(v) => setApparatusId(v === "all" ? "all" : Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="All apparatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {apparatus.map((ap) => (
                  <SelectItem key={ap.id} value={String(ap.id)}>{ap.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3">
            <Label>Level</Label>
            <Select value={level === "all" ? "all" : level} onValueChange={(v) => setLevel(v)}>
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {availableLevels.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!athleteId ? (
        <AdminCard>
          <AdminCardContent className="py-10 text-center text-slate-600 dark:text-white/80">Select an athlete to see progress.</AdminCardContent>
        </AdminCard>
      ) : loadingSkills ? (
        <AdminCard>
          <AdminCardContent className="py-10 text-center text-slate-600 dark:text-white/80">Loading progress…</AdminCardContent>
        </AdminCard>
      ) : (
        <div className="space-y-6">
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Overall Progress</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              <div className="grid gap-4">
                {([
                  ['prepping','Prepping'],
                  ['learning','Learning'],
                  ['consistent','Consistent'],
                  ['mastered','Mastered']
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{label}</span>
                      <span className="text-slate-600">{Math.round(((overall.counts[key] || 0) / Math.max(overall.total, 1)) * 100)}%</span>
                    </div>
                    <Progress value={Math.round(((overall.counts[key] || 0) / Math.max(overall.total, 1)) * 100)} />
                  </div>
                ))}
                <div className="text-xs text-slate-600 mt-1">
                  Total skills: {overall.total} · Prepping: {overall.counts["prepping"] || 0} · Learning: {overall.counts["learning"] || 0} · Consistent: {overall.counts["consistent"] || 0} · Mastered: {overall.counts["mastered"] || 0}
                </div>
              </div>
            </AdminCardContent>
          </AdminCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {perApparatus.map((row) => (
              <AdminCard key={row.apparatusId}>
                <AdminCardHeader>
                  <AdminCardTitle>{apparatusById.get(row.apparatusId)?.name || `Apparatus #${row.apparatusId}`}</AdminCardTitle>
                </AdminCardHeader>
                <AdminCardContent>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700 dark:text-white/90">Mastered</span>
                    <span className="text-slate-600 dark:text-white/80">{row.masteredPct}%</span>
                  </div>
                  <Progress value={row.masteredPct} />
                  <div className="flex items-center justify-between text-sm mb-1 mt-3">
                    <span className="text-slate-700 dark:text-white/90">Consistent</span>
                    <span className="text-slate-600 dark:text-white/80">{Math.round((row.counts["consistent"] || 0) / Math.max(row.total, 1) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((row.counts["consistent"] || 0) / Math.max(row.total, 1) * 100)} />
                  <div className="flex items-center justify-between text-sm mb-1 mt-3">
                      <span className="text-slate-700 dark:text-white/90">Prepping</span>
                      <span className="text-slate-600 dark:text-white/80">{Math.round(((row.counts["prepping"] || 0)) / Math.max(row.total, 1) * 100)}%</span>
                  </div>
                    <Progress value={Math.round(((row.counts["prepping"] || 0)) / Math.max(row.total, 1) * 100)} />
                  <div className="flex items-center justify-between text-sm mb-1 mt-3">
                    <span className="text-slate-700 dark:text-white/90">Learning</span>
                    <span className="text-slate-600 dark:text-white/80">{Math.round((row.counts["learning"] || 0) / Math.max(row.total, 1) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((row.counts["learning"] || 0) / Math.max(row.total, 1) * 100)} />
                  <div className="text-xs text-slate-600 mt-1">
                      Total: {row.total} · M: {row.counts["mastered"] || 0} · C: {row.counts["consistent"] || 0} · L: {row.counts["learning"] || 0} · P: {(row.counts["prepping"] || 0)}
                  </div>
                </AdminCardContent>
              </AdminCard>
            ))}
            {!perApparatus.length && (
              <AdminCard className="md:col-span-2">
                <AdminCardContent className="py-10 text-center text-slate-600 dark:text-white/80">No skills match the selected filters.</AdminCardContent>
              </AdminCard>
            )}
          </div>
          {perApparatusLevel.length > 0 ? (
            <AdminCard>
              <AdminCardHeader>
                <AdminCardTitle>Progress by Level</AdminCardTitle>
              </AdminCardHeader>
              <AdminCardContent>
                <div className="space-y-4">
                  {perApparatusLevel.map(group => (
                    <div key={group.apparatusId}>
                      <div className="font-medium mb-2 text-[#0F0276] dark:text-white">{apparatusById.get(group.apparatusId)?.name || `Apparatus #${group.apparatusId}`}</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {group.levels.map(l => (
                          <div key={l.level} className="p-2 rounded border border-slate-200/60 bg-white/50 dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/50">
                            <div className="text-sm mb-1 text-[#0F0276] dark:text-white">Level {l.level}</div>
                            <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-700 dark:text-white/90">Mastered</span><span className="text-slate-600 dark:text-white/80">{l.masteredPct}%</span></div>
                            <Progress value={l.masteredPct} />
                            <div className="flex items-center justify-between text-xs mb-1 mt-2"><span>Consistent</span><span>{Math.round((l.consistent / Math.max(l.total, 1)) * 100)}%</span></div>
                            <Progress value={Math.round((l.consistent / Math.max(l.total, 1)) * 100)} />
                            <div className="flex items-center justify-between text-xs mb-1 mt-2"><span>Prepping</span><span>{Math.round((((l as any).prepping || 0) / Math.max(l.total, 1)) * 100)}%</span></div>
                            <Progress value={Math.round((((l as any).prepping || 0) / Math.max(l.total, 1)) * 100)} />
                            <div className="flex items-center justify-between text-xs mb-1 mt-2"><span>Learning</span><span>{Math.round((l.learning / Math.max(l.total, 1)) * 100)}%</span></div>
                            <Progress value={Math.round((l.learning / Math.max(l.total, 1)) * 100)} />
                            <div className="text-[11px] text-slate-600 mt-1">Total: {l.total} {l.masteredPct === 100 ? '· Completed' : ''}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AdminCardContent>
            </AdminCard>
          ) : null}
        </div>
      )}
    </div>
  );
}
