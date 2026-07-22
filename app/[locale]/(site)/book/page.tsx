import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Stethoscope } from "lucide-react";
import { getActiveDepartments } from "@/lib/db/queries/departments";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DepartmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const departments = await getActiveDepartments();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-heading text-3xl font-black text-navy">{dict.booking.step1Title}</h1>

      {departments.length === 0 ? (
        <p className="text-muted-foreground">{dict.booking.noDepartments}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <Link
              key={department.id}
              href={`/${locale}/book/${department.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-border p-6 transition-colors hover:border-navy"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-gold">
                <Stethoscope className="size-5" />
              </span>
              <h2 className="font-heading text-lg font-bold text-navy">
                {locale === "ar" ? department.nameAr : department.nameEn}
              </h2>
              {(locale === "ar" ? department.descriptionAr : department.descriptionEn) ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? department.descriptionAr : department.descriptionEn}
                </p>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-gold">
                {dict.booking.step2Title}
                <Arrow className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
