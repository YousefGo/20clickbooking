import { notFound } from "next/navigation";
import { getConfirmedAppointmentsInRange } from "@/lib/db/queries/appointments";
import { getAllDepartments } from "@/lib/db/queries/departments";
import { getDoctorsByDepartment } from "@/lib/db/queries/doctors";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hospitalConfig } from "@/lib/config";
import { firstDayOfMonth, lastDayOfMonth, monthParam, parseMonthParam } from "@/lib/utils/calendar";
import { nowInTimezone } from "@/lib/utils/datetime";
import { CalendarFilters } from "@/components/admin/calendar-filters";
import { MonthGrid, type DayCount } from "@/components/calendar/month-grid";
import { ArchiveTable } from "@/components/admin/archive-table";

export default async function AdminCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; day?: string; departmentId?: string; doctorId?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const raw = await searchParams;
  const dict = await getDictionary(locale as Locale);

  const { year, month } = parseMonthParam(raw.month, hospitalConfig.timezone);
  const from = firstDayOfMonth(year, month);
  const to = lastDayOfMonth(year, month);
  const today = nowInTimezone(hospitalConfig.timezone).date;
  const selectedDate = raw.day ?? (today >= from && today <= to ? today : undefined);

  const [rows, departments] = await Promise.all([getConfirmedAppointmentsInRange(from, to), getAllDepartments()]);
  const doctorLists = await Promise.all(departments.map((d) => getDoctorsByDepartment(d.id)));
  const allDoctors = doctorLists.flat().map((doctor) => ({
    id: doctor.id,
    nameEn: doctor.nameEn,
    nameAr: doctor.nameAr,
    departmentId: doctor.departmentId,
  }));

  const filtered = rows.filter((row) => {
    if (raw.departmentId && row.appointment.departmentId !== raw.departmentId) return false;
    if (raw.doctorId && row.appointment.doctorId !== raw.doctorId) return false;
    return true;
  });

  const countsByDate: Record<string, DayCount> = {};
  for (const row of filtered) {
    const date = row.appointment.appointmentDate;
    const counts = (countsByDate[date] ??= { pending: 0, confirmed: 0, other: 0 });
    if (row.appointment.status === "pending") counts.pending += 1;
    else if (row.appointment.status === "confirmed") counts.confirmed += 1;
    else counts.other += 1;
  }

  const dayItems = selectedDate ? filtered.filter((row) => row.appointment.appointmentDate === selectedDate) : [];

  const dayLabel = selectedDate
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${selectedDate}T00:00:00Z`))
    : null;

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-black text-navy">{dict.admin.calendar.title}</h1>
      <CalendarFilters locale={locale as Locale} dict={dict} departments={departments} doctors={allDoctors} />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <MonthGrid
          locale={locale as Locale}
          timezone={hospitalConfig.timezone}
          year={year}
          month={month}
          selectedDate={selectedDate}
          countsByDate={countsByDate}
          baseHref={`/${locale}/admin/calendar`}
          extraParams={{
            departmentId: raw.departmentId ?? "",
            doctorId: raw.doctorId ?? "",
            month: monthParam(year, month),
          }}
        />

        <div>
          <h2 className="mb-4 font-heading text-base font-bold text-navy">
            {dayLabel ?? dict.admin.calendar.selectDay}
          </h2>
          <ArchiveTable
            locale={locale as Locale}
            dict={dict}
            timezone={hospitalConfig.timezone}
            items={dayItems.map((row) => ({
              id: row.appointment.id,
              patientName: row.appointment.patientName,
              patientPhone: row.appointment.patientPhone,
              patientEmail: row.appointment.patientEmail,
              appointmentDate: row.appointment.appointmentDate,
              startTime: row.appointment.startTime,
              status: row.appointment.status,
              doctorName: locale === "ar" ? row.doctor.nameAr : row.doctor.nameEn,
              departmentName: locale === "ar" ? row.department.nameAr : row.department.nameEn,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
