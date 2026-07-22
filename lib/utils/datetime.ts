import { formatInTimeZone } from "date-fns-tz";

/** Minutes since midnight for a "HH:MM" or "HH:MM:SS" time string. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** "HH:MM" string from minutes since midnight. */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

/** Day of week (0 = Sunday .. 6 = Saturday) for a "YYYY-MM-DD" calendar date, timezone-agnostic. */
export function dayOfWeekForDate(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

/** "YYYY-MM-DD" for `date` plus `days`, timezone-agnostic. */
export function addDaysToDateString(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Inclusive list of "YYYY-MM-DD" dates from `from` to `to`. */
export function dateRangeStrings(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = addDaysToDateString(cursor, 1);
  }
  return dates;
}

/** Current "YYYY-MM-DD" date and minutes-since-midnight in the given IANA timezone. */
export function nowInTimezone(timezone: string, now: Date = new Date()) {
  return {
    date: formatInTimeZone(now, timezone, "yyyy-MM-dd"),
    minutes: timeToMinutes(formatInTimeZone(now, timezone, "HH:mm")),
  };
}
