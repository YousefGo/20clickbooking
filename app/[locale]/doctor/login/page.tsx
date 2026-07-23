import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { DoctorLoginForm } from "@/components/doctor/login-form";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DoctorLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { from } = await searchParams;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-navy px-4 py-16">
      <div className="mb-8">
        <Logo locale={locale as Locale} tone="inverted" />
      </div>
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 font-heading text-xl font-bold text-navy">{dict.doctor.login.title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{dict.doctor.login.subtitle}</p>
        <DoctorLoginForm dict={dict} redirectTo={from && from.startsWith(`/${locale}/doctor`) ? from : `/${locale}/doctor`} />
      </div>
    </div>
  );
}
