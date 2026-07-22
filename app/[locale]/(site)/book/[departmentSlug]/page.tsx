import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { getDepartmentBySlug } from "@/lib/db/queries/departments";
import { getActiveDoctorsByDepartment } from "@/lib/db/queries/doctors";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DoctorsPage({
  params,
}: {
  params: Promise<{ locale: string; departmentSlug: string }>;
}) {
  const { locale, departmentSlug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  const department = await getDepartmentBySlug(departmentSlug);
  if (!department || !department.isActive) notFound();

  const doctors = await getActiveDoctorsByDepartment(department.id);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
      <Link
        href={`/${locale}/book`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-navy"
      >
        <BackArrow className="size-4" />
        {dict.common.back}
      </Link>

      <h1 className="mb-1 font-heading text-3xl font-black text-navy">
        {locale === "ar" ? department.nameAr : department.nameEn}
      </h1>
      <p className="mb-8 text-muted-foreground">{dict.booking.step2Title}</p>

      {doctors.length === 0 ? (
        <p className="text-muted-foreground">{dict.booking.noDoctors}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              href={`/${locale}/book/${department.slug}/${doctor.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-border p-6 transition-colors hover:border-navy"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-gold">
                <User className="size-5" />
              </span>
              <h2 className="font-heading text-lg font-bold text-navy">
                {locale === "ar" ? doctor.nameAr : doctor.nameEn}
              </h2>
              {(locale === "ar" ? doctor.titleAr : doctor.titleEn) ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? doctor.titleAr : doctor.titleEn}
                </p>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-gold">
                {dict.booking.step3Title}
                <Arrow className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
