import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthGrid, monthParam, shiftMonth } from "@/lib/utils/calendar";
import { nowInTimezone } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export interface DayCount {
  pending: number;
  confirmed: number;
  other: number;
}

export function MonthGrid({
  locale,
  timezone,
  year,
  month,
  selectedDate,
  countsByDate,
  baseHref,
  extraParams = {},
}: {
  locale: Locale;
  timezone: string;
  year: number;
  month: number;
  selectedDate?: string;
  countsByDate: Record<string, DayCount>;
  baseHref: string;
  extraParams?: Record<string, string>;
}) {
  const weeks = getMonthGrid(year, month);
  const today = nowInTimezone(timezone).date;

  const monthLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${monthParam(year, month)}-01T00:00:00Z`));

  const weekdayFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { weekday: "short", timeZone: "UTC" });
  const weekdayLabels = weeks[0].map((cell) => weekdayFormatter.format(new Date(`${cell.date}T00:00:00Z`)));

  function buildHref(params: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...extraParams, ...params })) {
      if (value) search.set(key, value);
    }
    const qs = search.toString();
    return qs ? `${baseHref}?${qs}` : baseHref;
  }

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={buildHref({ month: monthParam(prev.year, prev.month), day: undefined })}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-navy hover:bg-brand-gray/40"
          aria-label="previous month"
        >
          {locale === "ar" ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Link>
        <span className="font-heading text-base font-bold text-navy">{monthLabel}</span>
        <Link
          href={buildHref({ month: monthParam(next.year, next.month), day: undefined })}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-navy hover:bg-brand-gray/40"
          aria-label="next month"
        >
          {locale === "ar" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
        {weekdayLabels.map((label, index) => (
          <span key={index} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((cell) => {
          const counts = countsByDate[cell.date];
          const isSelected = cell.date === selectedDate;
          const isToday = cell.date === today;
          const dayNumber = Number(cell.date.slice(8, 10));

          return (
            <Link
              key={cell.date}
              href={buildHref({ month: monthParam(year, month), day: cell.date })}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-sm transition-colors",
                cell.inCurrentMonth ? "text-navy" : "text-muted-foreground/50",
                isSelected ? "border-gold bg-gold/10 font-bold" : "border-transparent hover:bg-brand-gray/40",
                isToday && !isSelected ? "border-navy/30" : "",
              )}
            >
              <span>{dayNumber}</span>
              {counts ? (
                <span className="flex gap-0.5">
                  {counts.pending > 0 ? <span className="size-1.5 rounded-full bg-gold" /> : null}
                  {counts.confirmed > 0 ? <span className="size-1.5 rounded-full bg-teal" /> : null}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
