import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DoctorLogoutButton } from "@/components/doctor/logout-button";
import { getDoctorSession } from "@/lib/actions/doctor-auth";
import { getDoctorById } from "@/lib/db/queries/doctors";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DoctorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  const doctorId = await getDoctorSession();
  if (!doctorId) redirect(`/${locale}/doctor/login`);
  const doctor = await getDoctorById(doctorId);
  if (!doctor) redirect(`/${locale}/doctor/login`);

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 bg-navy p-4 text-white lg:w-64 lg:p-6">
        <Logo locale={locale as Locale} tone="inverted" />
        <div>
          <p className="text-xs text-white/60">{dict.doctor.dashboard.greeting}</p>
          <p className="font-heading text-base font-bold">
            {locale === "ar" ? doctor.nameAr : doctor.nameEn}
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
          <LanguageSwitcher locale={locale as Locale} tone="inverted" />
          <DoctorLogoutButton locale={locale as Locale} label={dict.nav.logout} />
        </div>
      </aside>
      <main className="flex-1 bg-brand-gray/30 p-4 lg:p-8">{children}</main>
    </div>
  );
}
