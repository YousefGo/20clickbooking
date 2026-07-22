import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Toaster } from "@/components/ui/sonner";
import { directionForLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { siteConfig } from "@/lib/site";
import "../globals.css";

const montserratArabic = localFont({
  variable: "--font-montserrat-arabic",
  display: "swap",
  src: [
    { path: "../fonts/Montserrat-Arabic Light 300.otf", weight: "300", style: "normal" },
    { path: "../fonts/Montserrat-Arabic SemiBold 600.otf", weight: "600", style: "normal" },
    { path: "../fonts/Montserrat-Arabic Black 900.otf", weight: "900", style: "normal" },
  ],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Every page under [locale] reads live data (departments, doctors, slots,
// appointments) straight from the database, so nothing here should be
// statically prerendered at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const name = locale === "ar" ? siteConfig.nameAr : siteConfig.nameEn;
  const description = locale === "ar" ? siteConfig.descriptionAr : siteConfig.descriptionEn;

  return {
    title: { default: name, template: `%s | ${name}` },
    description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const direction = directionForLocale(locale as Locale);
  // Ensures the dictionary is valid for this locale before rendering any child page.
  await getDictionary(locale as Locale);

  return (
    <html lang={locale} dir={direction} className={`${montserratArabic.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <DirectionProvider direction={direction}>
          {children}
          <Toaster position={direction === "rtl" ? "top-left" : "top-right"} dir={direction} />
        </DirectionProvider>
      </body>
    </html>
  );
}
