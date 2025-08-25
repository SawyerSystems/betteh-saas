// Recurrence utilities implemented with Luxon for timezone-aware, DST-correct expansion.
import { DateTime, Interval } from 'luxon';

// RecurrenceInstance type definition
export interface RecurrenceInstance {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  isDeleted: boolean;
}
import type { Event } from "../shared/schema";

export type RecurrenceOptions = {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number; // default 1
  byweekday?: number[]; // 0-6 (Sun..Sat)
  bysetpos?: number; // e.g., 3rd Tuesday
  bymonthday?: number; // specific day of month
  until?: string | null; // ISO
};

export function parseRRule(rrule: string): RecurrenceOptions | null {
  try {
    const parts = Object.fromEntries(
      rrule
        .split(';')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          const [k, v] = p.split('=');
          return [k.toUpperCase(), v];
        })
    );
    const freq = String(parts['FREQ'] || '').toUpperCase();
    if (!freq) return null;
    const interval = parts['INTERVAL'] ? Number(parts['INTERVAL']) : 1;
    let byweekday: number[] | undefined;
    if (parts['BYDAY']) {
      const map: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
      byweekday = parts['BYDAY'].split(',').map(s => map[s as keyof typeof map]).filter(n => n != null);
    }
    const bysetpos = parts['BYSETPOS'] ? Number(parts['BYSETPOS']) : undefined;
    const bymonthday = parts['BYMONTHDAY'] ? Number(parts['BYMONTHDAY']) : undefined;
    const until = parts['UNTIL'] ? parts['UNTIL'] : null;
    return { freq: freq as any, interval, byweekday, bysetpos, bymonthday, until };
  } catch {
    return null;
  }
}

// Generate instances in [start,end] range in the event's local timezone, preserving wall-clock times across DST.
export function expandSeries(opts: {
  timezone: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
  exceptions?: string[];
  rangeStart: string; // ISO
  rangeEnd: string;   // ISO
}): Array<{ startAt: string; endAt: string }> {
  const zone = opts.timezone || 'America/Los_Angeles';
  const durationMs = new Date(opts.endAt).getTime() - new Date(opts.startAt).getTime();
  const exceptionMillis = new Set((opts.exceptions || []).map(s => DateTime.fromISO(s).toUTC().toMillis()));
  const range = Interval.fromDateTimes(DateTime.fromISO(opts.rangeStart).toUTC(), DateTime.fromISO(opts.rangeEnd).toUTC());

  const dtStartLocal = DateTime.fromISO(opts.startAt, { zone });
  const rule = opts.recurrenceRule ? parseRRule(opts.recurrenceRule) : null;
  const untilLocal = (opts.recurrenceEndAt ? DateTime.fromISO(opts.recurrenceEndAt, { zone }) : null) || null;

  const results: Array<{ startAt: string; endAt: string }> = [];

  const pushIfInRange = (occStartLocal: any) => {
    const occEndLocal = occStartLocal.plus({ milliseconds: durationMs });
    const occStartUtc = occStartLocal.toUTC();
    const occEndUtc = occEndLocal.toUTC();
    const occInterval = Interval.fromDateTimes(occStartUtc, occEndUtc);
    if (occInterval.overlaps(range)) {
      const key = occStartUtc.toMillis();
      if (!exceptionMillis.has(key)) {
        const startIso = new Date(occStartUtc.toMillis()).toISOString();
        const endIso = new Date(occEndUtc.toMillis()).toISOString();
        results.push({ startAt: startIso, endAt: endIso });
      }
    }
  };

  if (!rule) {
    pushIfInRange(dtStartLocal);
    return results;
  }

  const interval = Math.max(1, rule.interval || 1);
  const hardEndLocal = DateTime.fromISO(opts.rangeEnd, { zone });
  const byweekday = rule.byweekday && rule.byweekday.length > 0 ? rule.byweekday : [dtStartLocal.weekday % 7];

  if (rule.freq === 'DAILY') {
    let cursor = dtStartLocal;
    while (cursor <= hardEndLocal) {
      if (!untilLocal || cursor <= untilLocal.endOf('day')) pushIfInRange(cursor);
      cursor = cursor.plus({ days: interval });
      if (untilLocal && cursor > untilLocal.endOf('day')) break;
    }
  } else if (rule.freq === 'WEEKLY') {
    let cursorWeek = dtStartLocal.startOf('week');
    if (cursorWeek > dtStartLocal) cursorWeek = cursorWeek.minus({ weeks: 1 });
    while (cursorWeek <= hardEndLocal) {
      for (const wd of byweekday) {
        const day = cursorWeek.plus({ days: wd });
        const occ = day.set({ hour: dtStartLocal.hour, minute: dtStartLocal.minute, second: dtStartLocal.second, millisecond: dtStartLocal.millisecond });
        if (occ < dtStartLocal) continue;
        if (untilLocal && occ > untilLocal.endOf('day')) continue;
        pushIfInRange(occ);
      }
      cursorWeek = cursorWeek.plus({ weeks: interval });
    }
  } else if (rule.freq === 'MONTHLY') {
  const hasByMonthDay = typeof rule.bymonthday === 'number' && !isNaN(rule.bymonthday as number);
    const nth = rule.bysetpos; // e.g., 3rd
    let cursor = dtStartLocal.startOf('month');
    while (cursor <= hardEndLocal) {
      let occ = dtStartLocal;
      if (hasByMonthDay) {
        const bymd = (rule.bymonthday as number) ?? dtStartLocal.day;
        const day = Math.min(cursor.daysInMonth, bymd);
        occ = cursor.set({ day, hour: dtStartLocal.hour, minute: dtStartLocal.minute, second: dtStartLocal.second, millisecond: dtStartLocal.millisecond });
      } else if (nth && byweekday.length > 0) {
        const targetWday = byweekday[0];
        let d = cursor.startOf('month');
        while (d.weekday % 7 !== targetWday) d = d.plus({ days: 1 });
        d = d.plus({ weeks: (nth - 1) });
        occ = d.set({ hour: dtStartLocal.hour, minute: dtStartLocal.minute, second: dtStartLocal.second, millisecond: dtStartLocal.millisecond });
      } else {
        const day = Math.min(cursor.daysInMonth || 28, dtStartLocal.day || 1);
        occ = cursor.set({ day, hour: dtStartLocal.hour, minute: dtStartLocal.minute, second: dtStartLocal.second, millisecond: dtStartLocal.millisecond });
      }
      if (occ >= dtStartLocal) {
        if (!untilLocal || occ <= untilLocal.endOf('day')) pushIfInRange(occ);
      }
      cursor = cursor.plus({ months: interval });
    }
  } else if (rule.freq === 'YEARLY') {
    let cursor = dtStartLocal.startOf('year');
    while (cursor <= hardEndLocal) {
      const occ = cursor.set({ month: dtStartLocal.month, day: dtStartLocal.day, hour: dtStartLocal.hour, minute: dtStartLocal.minute, second: dtStartLocal.second, millisecond: dtStartLocal.millisecond });
      if (occ >= dtStartLocal) {
        if (!untilLocal || occ <= untilLocal.endOf('day')) pushIfInRange(occ);
      }
      cursor = cursor.plus({ years: interval });
    }
  }

  return results;
}

export function buildRRuleFromUi(opts: {
  frequency: 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY';
  weekdays?: number[]; // 0-6 Sun..Sat for WEEKLY
  monthlyMode?: 'DATE' | 'WEEKDAY_POS';
  byMonthDay?: number; // for DATE
  bySetPos?: number; // for WEEKDAY_POS (1..5)
  until?: string | null; // ISO end date (inclusive of start)
  dtstart?: string; // ISO
}): string | null {
  if (opts.frequency === 'NONE') return null;
  const parts: string[] = [];
  const mapIdxToByday = ['SU','MO','TU','WE','TH','FR','SA'];
  if (opts.frequency === 'DAILY') {
    parts.push('FREQ=DAILY');
  } else if (opts.frequency === 'WEEKLY' || opts.frequency === 'BIWEEKLY') {
    parts.push('FREQ=WEEKLY');
    parts.push(`INTERVAL=${opts.frequency === 'BIWEEKLY' ? 2 : 1}`);
    const days = (opts.weekdays && opts.weekdays.length > 0) ? opts.weekdays : undefined;
    if (days) parts.push(`BYDAY=${days.map(i => mapIdxToByday[i]).join(',')}`);
  } else if (opts.frequency === 'MONTHLY') {
    parts.push('FREQ=MONTHLY');
    if (opts.monthlyMode === 'DATE' && opts.byMonthDay) parts.push(`BYMONTHDAY=${opts.byMonthDay}`);
    if (opts.monthlyMode === 'WEEKDAY_POS' && opts.bySetPos && opts.weekdays && opts.weekdays[0] != null) {
      parts.push(`BYDAY=${mapIdxToByday[opts.weekdays[0]]}`);
      parts.push(`BYSETPOS=${opts.bySetPos}`);
    }
  } else if (opts.frequency === 'YEARLY') {
    parts.push('FREQ=YEARLY');
  }
  if (opts.until) {
    const d = new Date(opts.until);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const u = `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    parts.push(`UNTIL=${u}`);
  }
  return parts.join(';');
}

export function expandSeriesForRange(events: Event[], startIso: string, endIso: string) {
  console.log(`🔍 [EXPAND] Starting expansion with ${events.length} events, range: ${startIso} to ${endIso}`);
  const masters = events.filter(e => e.parentEventId === null && !e.isDeleted);
  console.log(`🔍 [EXPAND] Found ${masters.length} master events`);
  const overrides = events.filter(e => e.parentEventId && !e.isDeleted);
  console.log(`🔍 [EXPAND] Found ${overrides.length} override events`);
  
  for (const m of masters) {
    console.log(`🔍 [EXPAND] Master: ${m.id}, recurrenceRule: ${m.recurrenceRule}, startAt: ${(m as any).startAt}`);
  }
  const ovBySeries = new Map<string, Event[]>();
  for (const ov of overrides) {
    const sid = ov.seriesId as string;
    const arr = ovBySeries.get(sid) || [];
    arr.push(ov);
    ovBySeries.set(sid, arr);
  }
  const instances: Event[] = [] as Event[];
  for (const m of masters) {
    const occs = expandSeries({
      timezone: (m as any).timezone || 'America/Los_Angeles',
      startAt: (m as any).startAt,
      endAt: (m as any).endAt,
      recurrenceRule: (m as any).recurrenceRule || undefined,
      recurrenceEndAt: (m as any).recurrenceEndAt || undefined,
      exceptions: (m as any).recurrenceExceptions || [],
      rangeStart: startIso,
      rangeEnd: endIso,
    });
    const seriesOverrides = ovBySeries.get(m.seriesId as string) || [];
    for (const occ of occs) {
      const occStartMs = DateTime.fromISO(occ.startAt).toMillis();
      const match = seriesOverrides.find(ov => {
        const ms = DateTime.fromISO((ov as any).startAt).toMillis();
        return Math.abs(ms - occStartMs) < 60_000;
      });
      if (match) {
        instances.push(match);
      } else {
        instances.push({
          ...(m as any),
          id: `${m.id}:${occ.startAt}` as any,
          startAt: occ.startAt as any,
          endAt: occ.endAt as any,
        } as Event);
      }
    }
  }
  return instances;
}
// Recurrence utilities (placeholder): will use rrule and luxon for proper expansion and timezone handling.
// For now, define types and a stub resolver so we can integrate progressively without breaking builds.

// (legacy placeholder removed)
