declare module 'luxon' {
  export class DateTime {
    static fromISO(s: string, opts?: any): DateTime;
    static fromJSDate(d: Date, opts?: any): DateTime;
    static fromMillis(ms: number): DateTime;
    static max(...dts: DateTime[]): DateTime;
    toUTC(): DateTime;
  toISO(): string | null;
  toFormat(fmt: string): string;
    toMillis(): number;
    plus(v: any): DateTime;
    minus(v: any): DateTime;
    set(v: any): DateTime;
    startOf(unit: string): DateTime;
    endOf(unit: string): DateTime;
    get year(): number;
    get month(): number;
    get day(): number;
    get hour(): number;
    get minute(): number;
    get second(): number;
    get millisecond(): number;
    get weekday(): number;
    get daysInMonth(): number;
    zoneName: string;
    static now(): DateTime;
  }
  export class Interval {
    static fromDateTimes(start: DateTime, end: DateTime): Interval;
    overlaps(other: Interval): boolean;
    start: DateTime;
    end: DateTime;
  }
}
