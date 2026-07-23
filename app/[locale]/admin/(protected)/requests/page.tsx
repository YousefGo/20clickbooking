import { notFound } from "next/navigation";
import { getPendingAppointments } from "@/lib/db/queries/appointments";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hospitalConfig } from "@/lib/config";
import { RequestsTable } from "@/components/admin/requests-table";

export default async function AdminRequestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const rows = await getPendingAppointments();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-black text-navy">{dict.admin.requests.title}</h1>
      <RequestsTable
        locale={locale as Locale}
        dict={dict}
        timezone={hospitalConfig.timezone}
        items={rows.map((row) => ({
          id: row.appointment.id,
          patientName: row.appointment.patientName,
          patientPhone: row.appointment.patientPhone,
          patientEmail: row.appointment.patientEmail,
          notes: row.appointment.notes,
          appointmentDate: row.appointment.appointmentDate,
          startTime: row.appointment.startTime,
          doctorName: locale === "ar" ? row.doctor.nameAr : row.doctor.nameEn,
          departmentName: locale === "ar" ? row.department.nameAr : row.department.nameEn,
        }))}
      />
    </div>
  );
}
