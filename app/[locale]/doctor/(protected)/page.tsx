import { notFound, redirect } from "next/navigation";
import {
  getConfirmedAppointmentsByDoctor,
  getConfirmedAppointmentsByDoctorInRange,
  getPendingAppointmentsByDoctor,
} from "@/lib/db/queries/appointments";
import { getDoctorSession } from "@/lib/actions/doctor-auth";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hospitalConfig } from "@/lib/config";
import { firstDayOfMonth, lastDayOfMonth, monthParam, parseMonthParam } from "@/lib/utils/calendar";
import { nowInTimezone } from "@/lib/utils/datetime";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorRequestsTable } from "@/components/doctor/requests-table";
import { DoctorAppointmentsList } from "@/components/doctor/appointments-list";
import { MonthGrid, type DayCount } from "@/components/calendar/month-grid";

export default async function DoctorDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const raw = await searchParams;

  const doctorId = await getDoctorSession();
  if (!doctorId) redirect(`/${locale}/doctor/login`);

  const { year, month } = parseMonthParam(raw.month, hospitalConfig.timezone);
  const from = firstDayOfMonth(year, month);
  const to = lastDayOfMonth(year, month);
  const today = nowInTimezone(hospitalConfig.timezone).date;
  const selectedDate = raw.day ?? (today >= from && today <= to ? today : undefined);

  const [pending, confirmed, monthRows] = await Promise.all([
    getPendingAppointmentsByDoctor(doctorId),
    getConfirmedAppointmentsByDoctor(doctorId),
    getConfirmedAppointmentsByDoctorInRange(doctorId, from, to),
  ]);

  const countsByDate: Record<string, DayCount> = {};
  for (const row of monthRows) {
    const date = row.appointment.appointmentDate;
    const counts = (countsByDate[date] ??= { pending: 0, confirmed: 0, other: 0 });
    counts.confirmed += 1;
  }

  const dayConfirmed = selectedDate
    ? monthRows.filter((row) => row.appointment.appointmentDate === selectedDate)
    : [];

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
      <h1 className="mb-6 font-heading text-2xl font-black text-navy">{dict.doctor.dashboard.title}</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            {dict.admin.requests.title} ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            {dict.admin.appointments.title} ({confirmed.length})
          </TabsTrigger>
          <TabsTrigger value="calendar">{dict.admin.nav.calendar}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <DoctorRequestsTable
            locale={locale as Locale}
            dict={dict}
            timezone={hospitalConfig.timezone}
            items={pending.map((row) => ({
              id: row.appointment.id,
              patientName: row.appointment.patientName,
              patientPhone: row.appointment.patientPhone,
              patientEmail: row.appointment.patientEmail,
              notes: row.appointment.notes,
              appointmentDate: row.appointment.appointmentDate,
              startTime: row.appointment.startTime,
              departmentName: locale === "ar" ? row.department.nameAr : row.department.nameEn,
            }))}
          />
        </TabsContent>

        <TabsContent value="confirmed" className="mt-6">
          <DoctorAppointmentsList
            locale={locale as Locale}
            dict={dict}
            timezone={hospitalConfig.timezone}
            items={confirmed.map((row) => ({
              id: row.appointment.id,
              patientName: row.appointment.patientName,
              patientPhone: row.appointment.patientPhone,
              patientEmail: row.appointment.patientEmail,
              appointmentDate: row.appointment.appointmentDate,
              startTime: row.appointment.startTime,
              departmentName: locale === "ar" ? row.department.nameAr : row.department.nameEn,
            }))}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <MonthGrid
              locale={locale as Locale}
              timezone={hospitalConfig.timezone}
              year={year}
              month={month}
              selectedDate={selectedDate}
              countsByDate={countsByDate}
              baseHref={`/${locale}/doctor`}
              extraParams={{ month: monthParam(year, month) }}
            />
            <div>
              <h2 className="mb-4 font-heading text-base font-bold text-navy">
                {dayLabel ?? dict.admin.calendar.selectDay}
              </h2>
              {selectedDate && dayConfirmed.length === 0 ? (
                <p className="text-muted-foreground">{dict.admin.archive.empty}</p>
              ) : (
                <DoctorAppointmentsList
                  locale={locale as Locale}
                  dict={dict}
                  timezone={hospitalConfig.timezone}
                  items={dayConfirmed.map((row) => ({
                    id: row.appointment.id,
                    patientName: row.appointment.patientName,
                    patientPhone: row.appointment.patientPhone,
                    patientEmail: row.appointment.patientEmail,
                    appointmentDate: row.appointment.appointmentDate,
                    startTime: row.appointment.startTime,
                    departmentName: locale === "ar" ? row.department.nameAr : row.department.nameEn,
                  }))}
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
