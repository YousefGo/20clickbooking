import { notFound } from "next/navigation";
import { getConfirmedAppointments } from "@/lib/db/queries/appointments";
import { getAllDepartments } from "@/lib/db/queries/departments";
import { getDoctorsByDepartment } from "@/lib/db/queries/doctors";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hospitalConfig } from "@/lib/config";
import { AppointmentsFilters } from "@/components/admin/appointments-filters";
import { AppointmentsTable } from "@/components/admin/appointments-table";

export default async function AppointmentsAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ departmentId?: string; doctorId?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { departmentId, doctorId } = await searchParams;
  const dict = await getDictionary(locale as Locale);

  const [rows, departments] = await Promise.all([getConfirmedAppointments(), getAllDepartments()]);
  const doctorLists = await Promise.all(departments.map((d) => getDoctorsByDepartment(d.id)));
  const allDoctors = doctorLists.flat().map((doctor) => ({
    id: doctor.id,
    nameEn: doctor.nameEn,
    nameAr: doctor.nameAr,
    departmentId: doctor.departmentId,
  }));

  const filtered = rows.filter((row) => {
    if (departmentId && row.appointment.departmentId !== departmentId) return false;
    if (doctorId && row.appointment.doctorId !== doctorId) return false;
    return true;
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-black text-navy">{dict.admin.appointments.title}</h1>
      <AppointmentsFilters locale={locale as Locale} dict={dict} departments={departments} doctors={allDoctors} />
      <AppointmentsTable
        locale={locale as Locale}
        dict={dict}
        timezone={hospitalConfig.timezone}
        items={filtered.map((row) => ({
          id: row.appointment.id,
          patientName: row.appointment.patientName,
          patientEmail: row.appointment.patientEmail,
          appointmentDate: row.appointment.appointmentDate,
          startTime: row.appointment.startTime,
          doctorName: locale === "ar" ? row.doctor.nameAr : row.doctor.nameEn,
          departmentName: locale === "ar" ? row.department.nameAr : row.department.nameEn,
          emailSentAt: row.appointment.emailSentAt ? row.appointment.emailSentAt.toISOString() : null,
          emailError: row.appointment.emailError,
        }))}
      />
    </div>
  );
}
