// Client-side recurrence utilities - matches server-side implementation
// Used for building RRULE strings from UI selections

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
