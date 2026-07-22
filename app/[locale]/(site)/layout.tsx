import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hospitalConfig } from "@/lib/config";
import { notFound } from "next/navigation";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const hospitalName = locale === "ar" ? hospitalConfig.nameAr : hospitalConfig.nameEn;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo locale={locale as Locale} href={`/${locale}`} />
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/admin`}
              className="hidden text-sm font-semibold text-muted-foreground hover:text-navy sm:inline"
            >
              {dict.nav.adminPanel}
            </Link>
            <LanguageSwitcher locale={locale as Locale} />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-border bg-brand-gray/40">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span className="font-semibold text-navy">{hospitalName}</span>
          {hospitalConfig.addressAr || hospitalConfig.addressEn ? (
            <span>{locale === "ar" ? hospitalConfig.addressAr : hospitalConfig.addressEn}</span>
          ) : null}
          {hospitalConfig.phone ? <span dir="ltr">{hospitalConfig.phone}</span> : null}
        </div>
      </footer>
    </div>
  );
}
