import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getAppointmentById } from "@/lib/db/queries/appointments";
import { getDoctorById } from "@/lib/db/queries/doctors";
import { getDepartmentById } from "@/lib/db/queries/departments";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hospitalConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  const appointment = await getAppointmentById(id);
  if (!appointment) notFound();

  const [doctor, department] = await Promise.all([
    getDoctorById(appointment.doctorId),
    getDepartmentById(appointment.departmentId),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: hospitalConfig.timezone,
  });
  const [h, m] = appointment.startTime.split(":").map(Number);
  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6">
      <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-teal/10 text-teal">
        <CheckCircle2 className="size-9" />
      </span>
      <h1 className="mb-2 font-heading text-3xl font-black text-navy">{dict.booking.confirmationTitle}</h1>
      <p className="mb-8 text-muted-foreground">{dict.booking.confirmationPendingMessage}</p>

      <div className="w-full rounded-2xl border border-border p-6 text-start">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{dict.booking.reference}</dt>
            <dd className="font-mono font-semibold text-navy" dir="ltr">
              {appointment.id.slice(0, 8).toUpperCase()}
            </dd>
          </div>
          {doctor ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{dict.booking.appointmentWith}</dt>
              <dd className="font-semibold text-navy">{locale === "ar" ? doctor.nameAr : doctor.nameEn}</dd>
            </div>
          ) : null}
          {department ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{dict.admin.requests.department}</dt>
              <dd className="font-semibold text-navy">
                {locale === "ar" ? department.nameAr : department.nameEn}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{dict.booking.appointmentDate}</dt>
            <dd className="font-semibold text-navy">
              {dateFormatter.format(new Date(`${appointment.appointmentDate}T00:00:00Z`))}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{dict.booking.appointmentTime}</dt>
            <dd className="font-semibold text-navy">
              {timeFormatter.format(new Date(Date.UTC(2000, 0, 1, h, m)))}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{dict.admin.appointments.status}</dt>
            <dd className="font-semibold text-gold">{dict.status[appointment.status as "pending"]}</dd>
          </div>
        </dl>
      </div>

      <Button render={<Link href={`/${locale}`} />} variant="outline" className="mt-8">
        {dict.booking.backToHome}
      </Button>
    </div>
  );
}
