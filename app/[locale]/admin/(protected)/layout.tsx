import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 bg-navy p-4 text-white lg:w-64 lg:p-6">
        <Logo locale={locale as Locale} tone="inverted" href={`/${locale}/admin`} />
        <AdminNav locale={locale as Locale} dict={dict} />
        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
          <LanguageSwitcher locale={locale as Locale} tone="inverted" />
          <LogoutButton locale={locale as Locale} label={dict.nav.logout} />
        </div>
      </aside>
      <main className="flex-1 bg-brand-gray/30 p-4 lg:p-8">{children}</main>
    </div>
  );
}
