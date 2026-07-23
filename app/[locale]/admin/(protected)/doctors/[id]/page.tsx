import { notFound } from "next/navigation";
import { getAllDepartments } from "@/lib/db/queries/departments";
import { getAllDoctorAvailability, getDoctorById, getDoctorExceptions } from "@/lib/db/queries/doctors";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { DoctorForm } from "@/components/admin/doctor-form";
import { AvailabilityEditor } from "@/components/admin/availability-editor";
import { ExceptionsEditor } from "@/components/admin/exceptions-editor";
import { Separator } from "@/components/ui/separator";

export default async function EditDoctorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  const doctor = await getDoctorById(id);
  if (!doctor) notFound();

  const [departments, availability, exceptions] = await Promise.all([
    getAllDepartments(),
    getAllDoctorAvailability(id),
    getDoctorExceptions(id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-6 font-heading text-2xl font-black text-navy">{dict.admin.doctors.edit}</h1>
        <DoctorForm
          locale={locale as Locale}
          dict={dict}
          departments={departments}
          initial={{
            id: doctor.id,
            departmentId: doctor.departmentId,
            nameEn: doctor.nameEn,
            nameAr: doctor.nameAr,
            titleEn: doctor.titleEn,
            titleAr: doctor.titleAr,
            bioEn: doctor.bioEn,
            bioAr: doctor.bioAr,
            slotDurationMinutes: doctor.slotDurationMinutes,
            isActive: doctor.isActive,
            email: doctor.email,
          }}
        />
      </div>

      <Separator />

      <div>
        <h2 className="mb-4 font-heading text-lg font-bold text-navy">{dict.admin.doctors.availability}</h2>
        <AvailabilityEditor doctorId={doctor.id} dict={dict} rows={availability} />
      </div>

      <Separator />

      <div>
        <h2 className="mb-4 font-heading text-lg font-bold text-navy">{dict.admin.doctors.exceptions}</h2>
        <ExceptionsEditor doctorId={doctor.id} dict={dict} rows={exceptions} />
      </div>
    </div>
  );
}
