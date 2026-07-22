import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { getDepartmentBySlug } from "@/lib/db/queries/departments";
import { getDoctorById } from "@/lib/db/queries/doctors";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hospitalConfig } from "@/lib/config";
import { BookingFlow } from "@/components/booking/booking-flow";

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ locale: string; departmentSlug: string; doctorId: string }>;
}) {
  const { locale, departmentSlug, doctorId } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  const department = await getDepartmentBySlug(departmentSlug);
  if (!department || !department.isActive) notFound();

  const doctor = await getDoctorById(doctorId);
  if (!doctor || !doctor.isActive || doctor.departmentId !== department.id) notFound();

  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <Link
        href={`/${locale}/book/${department.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-navy"
      >
        <BackArrow className="size-4" />
        {dict.common.back}
      </Link>

      <h1 className="mb-1 font-heading text-3xl font-black text-navy">
        {locale === "ar" ? doctor.nameAr : doctor.nameEn}
      </h1>
      <p className="mb-8 text-muted-foreground">
        {locale === "ar" ? doctor.titleAr : doctor.titleEn}
        {" · "}
        {locale === "ar" ? department.nameAr : department.nameEn}
      </p>

      <BookingFlow
        locale={locale as Locale}
        dict={dict}
        timezone={hospitalConfig.timezone}
        doctor={{
          id: doctor.id,
          nameAr: doctor.nameAr,
          nameEn: doctor.nameEn,
          slotDurationMinutes: doctor.slotDurationMinutes,
        }}
      />
    </div>
  );
}
