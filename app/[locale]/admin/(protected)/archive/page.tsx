import { notFound } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { getAllAppointmentsWithDetails } from "@/lib/db/queries/appointments";
import { getAllDepartments } from "@/lib/db/queries/departments";
import { getDoctorsByDepartment } from "@/lib/db/queries/doctors";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hospitalConfig } from "@/lib/config";
import { filterArchiveRows, parseArchiveFilters } from "@/lib/archive-filters";
import { ArchiveFilters } from "@/components/admin/archive-filters";
import { ArchiveTable } from "@/components/admin/archive-table";
import { Button } from "@/components/ui/button";

export default async function ArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ departmentId?: string; doctorId?: string; status?: string; from?: string; to?: string; q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const rawSearchParams = await searchParams;
  const dict = await getDictionary(locale as Locale);

  const [allRows, departments] = await Promise.all([getAllAppointmentsWithDetails(), getAllDepartments()]);
  const doctorLists = await Promise.all(departments.map((d) => getDoctorsByDepartment(d.id)));
  const allDoctors = doctorLists.flat().map((doctor) => ({
    id: doctor.id,
    nameEn: doctor.nameEn,
    nameAr: doctor.nameAr,
    departmentId: doctor.departmentId,
  }));

  const filters = parseArchiveFilters(rawSearchParams);
  const filtered = filterArchiveRows(allRows, filters);

  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (value) exportParams.set(key, value);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-black text-navy">{dict.admin.archive.title}</h1>
          <p className="text-sm text-muted-foreground">
            {dict.admin.archive.subtitle.replace("{count}", String(filtered.length))}
          </p>
        </div>
        <Button render={<a href={`/api/admin/archive/export?${exportParams.toString()}`} />} variant="outline">
          <FileSpreadsheet className="size-4" />
          {dict.admin.archive.exportExcel}
        </Button>
      </div>

      <ArchiveFilters locale={locale as Locale} dict={dict} departments={departments} doctors={allDoctors} />

      <ArchiveTable
        locale={locale as Locale}
        dict={dict}
        timezone={hospitalConfig.timezone}
        items={filtered.map((row) => ({
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
  );
}
