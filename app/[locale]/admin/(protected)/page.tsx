import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Mail,
  Phone,
  Search,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getActiveAppointmentCountInRange,
  getDailyBookingCounts,
  getDepartmentBreakdown,
  getPendingAppointments,
  getStatusCounts,
  searchAppointments,
} from "@/lib/db/queries/appointments";
import { hospitalConfig } from "@/lib/config";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/get-dictionary";
import { addDaysToDateString, dateRangeStrings, nowInTimezone } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { q } = await searchParams;
  const dict = await getDictionary(locale as Locale);
  const hospitalName = locale === "ar" ? hospitalConfig.nameAr : hospitalConfig.nameEn;

  const today = nowInTimezone(hospitalConfig.timezone).date;
  const weekEnd = addDaysToDateString(today, 6);
  const trendStart = addDaysToDateString(today, -13);
  const query = q?.trim() ?? "";

  const [statusCounts, todayCount, weekCount, dailyRows, departmentRows, pendingRows, searchResults] =
    await Promise.all([
      getStatusCounts(),
      getActiveAppointmentCountInRange(today, today),
      getActiveAppointmentCountInRange(today, weekEnd),
      getDailyBookingCounts(trendStart, today, hospitalConfig.timezone),
      getDepartmentBreakdown(),
      getPendingAppointments(),
      query ? searchAppointments(query) : Promise.resolve(null),
    ]);

  const dailyCountByDate = new Map(dailyRows.map((row) => [row.date, row.count]));
  const trend = dateRangeStrings(trendStart, today).map((date) => ({
    date,
    count: dailyCountByDate.get(date) ?? 0,
  }));
  const trendMax = Math.max(1, ...trend.map((day) => day.count));
  const departmentMax = Math.max(1, ...departmentRows.map((row) => row.count));

  const weekdayFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    weekday: "narrow",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-black text-navy">{dict.admin.dashboard.title}</h1>
        <p className="text-sm text-muted-foreground">
          {dict.admin.dashboard.subtitle.replace("{hospital}", hospitalName)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={ClipboardList}
          label={dict.admin.dashboard.statPending}
          value={statusCounts.pending}
          href={`/${locale}/admin/requests`}
          tone="gold"
        />
        <StatCard icon={CalendarClock} label={dict.admin.dashboard.statToday} value={todayCount} tone="navy" />
        <StatCard icon={CalendarRange} label={dict.admin.dashboard.statWeek} value={weekCount} tone="navy" />
        <StatCard
          icon={CheckCircle2}
          label={dict.admin.dashboard.statConfirmedTotal}
          value={statusCounts.confirmed}
          tone="teal"
        />
        <StatCard
          icon={XCircle}
          label={dict.admin.dashboard.statRejectedCancelled}
          value={statusCounts.rejected + statusCounts.cancelled}
          tone="muted"
        />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-navy">
          <Search className="size-4 text-gold" />
          {dict.admin.dashboard.search.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{dict.admin.dashboard.search.subtitle}</p>
        <form className="mt-4 flex flex-wrap gap-2" action={`/${locale}/admin`}>
          <Input
            name="q"
            defaultValue={query}
            dir="ltr"
            placeholder={dict.admin.dashboard.search.placeholder}
            className="h-9 max-w-sm"
          />
          <Button type="submit" size="lg">
            <Search className="size-4" />
            {dict.admin.dashboard.search.button}
          </Button>
        </form>

        {searchResults ? (
          <div className="mt-5 border-t border-border pt-5">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict.admin.dashboard.search.noResults}</p>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  {dict.admin.dashboard.search.resultsCount.replace("{count}", String(searchResults.length))}
                </p>
                {searchResults.map((row) => (
                  <SearchResultCard key={row.appointment.id} locale={locale as Locale} dict={dict} row={row} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-heading text-base font-bold text-navy">{dict.admin.dashboard.byDepartment}</h2>
          {departmentRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{dict.admin.dashboard.byDepartmentEmpty}</p>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {departmentRows.map((row) => (
                <div key={row.departmentId} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm font-medium text-navy">
                    {locale === "ar" ? row.nameAr : row.nameEn}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-gray/60">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${Math.max(4, (row.count / departmentMax) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-end text-sm font-semibold text-navy">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-heading text-base font-bold text-navy">{dict.admin.dashboard.trendTitle}</h2>
          <div className="mt-6 flex h-32 items-end gap-1.5" dir="ltr">
            {trend.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-24 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-navy transition-all"
                    style={{ height: `${Math.max(4, (day.count / trendMax) * 100)}%` }}
                    title={`${day.date}: ${day.count}`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {weekdayFormatter.format(new Date(`${day.date}T00:00:00Z`))}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-base font-bold text-navy">{dict.admin.dashboard.pendingPreviewTitle}</h2>
          <Link
            href={`/${locale}/admin/requests`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:underline"
          >
            {dict.admin.dashboard.viewAll}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        {pendingRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.admin.dashboard.pendingPreviewEmpty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingRows.slice(0, 5).map((row) => (
              <div
                key={row.appointment.id}
                className="flex flex-col gap-1 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-navy">{row.appointment.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? row.doctor.nameAr : row.doctor.nameEn} ·{" "}
                    {locale === "ar" ? row.department.nameAr : row.department.nameEn}
                  </p>
                </div>
                <Badge className="w-fit bg-gold text-navy">{dict.status.pending}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const toneClasses = {
  navy: "bg-navy text-white",
  gold: "bg-gold text-navy",
  teal: "bg-teal text-white",
  muted: "bg-brand-gray text-navy",
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href?: string;
  tone: keyof typeof toneClasses;
}) {
  const content = (
    <>
      <span className={cn("flex size-10 items-center justify-center rounded-xl", toneClasses[tone])}>
        <Icon className="size-5" />
      </span>
      <span className="font-heading text-2xl font-black text-navy">{value}</span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </>
  );

  const className = "flex flex-col gap-2 rounded-2xl border border-border bg-white p-5 transition-colors";

  if (href) {
    return (
      <Link href={href} className={cn(className, "hover:border-gold/60")}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

type AppointmentSearchRow = NonNullable<Awaited<ReturnType<typeof searchAppointments>>>[number];

function SearchResultCard({
  locale,
  dict,
  row,
}: {
  locale: Locale;
  dict: Dictionary;
  row: AppointmentSearchRow;
}) {
  const { appointment, doctor, department } = row;
  const statusBadge: Record<string, string> = {
    pending: "bg-gold text-navy",
    confirmed: "bg-teal text-white",
    rejected: "bg-destructive/10 text-destructive",
    cancelled: "bg-brand-gray text-navy",
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-navy">{appointment.patientName}</p>
          <span className="font-mono text-xs text-muted-foreground" dir="ltr">
            {dict.admin.dashboard.search.reference}: {appointment.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {locale === "ar" ? doctor.nameAr : doctor.nameEn} · {locale === "ar" ? department.nameAr : department.nameEn}
          {" · "}
          {appointment.appointmentDate}
        </p>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {appointment.patientPhone ? (
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Phone className="size-3.5" />
              {appointment.patientPhone}
            </span>
          ) : null}
          {appointment.patientEmail ? (
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Mail className="size-3.5" />
              {appointment.patientEmail}
            </span>
          ) : null}
        </div>
      </div>
      <Badge className={cn("w-fit", statusBadge[appointment.status])}>
        {dict.status[appointment.status as keyof typeof dict.status]}
      </Badge>
    </div>
  );
}
