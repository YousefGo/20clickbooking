import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getAllDepartments } from "@/lib/db/queries/departments";
import { getDoctorsByDepartment } from "@/lib/db/queries/doctors";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoctorRowActions } from "@/components/admin/doctor-row-actions";

export default async function DoctorsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const departments = await getAllDepartments();
  const doctorsByDepartment = await Promise.all(
    departments.map(async (department) => ({
      department,
      doctors: await getDoctorsByDepartment(department.id),
    })),
  );
  const hasAnyDoctor = doctorsByDepartment.some((group) => group.doctors.length > 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-black text-navy">{dict.admin.doctors.title}</h1>
        <Button render={<Link href={`/${locale}/admin/doctors/new`} />}>
          <Plus className="size-4" />
          {dict.admin.doctors.add}
        </Button>
      </div>

      {!hasAnyDoctor ? (
        <p className="text-muted-foreground">{dict.admin.doctors.empty}</p>
      ) : (
        <div className="flex flex-col gap-8">
          {doctorsByDepartment
            .filter((group) => group.doctors.length > 0)
            .map((group) => (
              <div key={group.department.id}>
                <h2 className="mb-3 text-sm font-bold text-muted-foreground">
                  {locale === "ar" ? group.department.nameAr : group.department.nameEn}
                </h2>
                <div className="flex flex-col gap-3">
                  {group.doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-2 font-heading font-bold text-navy">
                          {locale === "ar" ? doctor.nameAr : doctor.nameEn}
                          {!doctor.isActive ? <Badge variant="secondary">{dict.common.inactive}</Badge> : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {locale === "ar" ? doctor.titleAr : doctor.titleEn}
                        </span>
                      </div>
                      <DoctorRowActions locale={locale as Locale} dict={dict} doctorId={doctor.id} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
