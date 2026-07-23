import { addDaysToDateString } from "@/lib/utils/datetime";

export interface CalendarCell {
  date: string;
  inCurrentMonth: boolean;
}

/** Sunday-first month grid (matches the doctor_availability dayOfWeek convention), padded to full weeks. */
export function getMonthGrid(year: number, month: number): CalendarCell[][] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const firstCellDate = addDaysToDateString(firstOfMonth.toISOString().slice(0, 10), -startWeekday);

  const cells: CalendarCell[] = [];
  let cursor = firstCellDate;
  const lastDayOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  while (cursor <= lastDayOfMonth || cells.length % 7 !== 0) {
    cells.push({ date: cursor, inCurrentMonth: cursor.slice(0, 7) === `${year}-${String(month).padStart(2, "0")}` });
    cursor = addDaysToDateString(cursor, 1);
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthParam(param: string | undefined, timezone: string): { year: number; month: number } {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [year, month] = param.split("-").map(Number);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit" }).format(new Date());
  const [year, month] = todayStr.split("-").map(Number);
  return { year, month };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function lastDayOfMonth(year: number, month: number): string {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
}
