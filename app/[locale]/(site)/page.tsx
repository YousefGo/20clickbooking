import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck, ClipboardCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { hospitalConfig } from "@/lib/config";
import { notFound } from "next/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const hospitalName = locale === "ar" ? hospitalConfig.nameAr : hospitalConfig.nameEn;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const steps = [
    { icon: Stethoscope, title: dict.booking.step1Title },
    { icon: CalendarCheck, title: dict.booking.step3Title },
    { icon: ClipboardCheck, title: dict.booking.confirmationTitle },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-navy text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
          <span className="rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-gold-light">
            {hospitalName}
          </span>
          <h1 className="text-balance font-heading text-4xl font-black sm:text-5xl">{dict.home.title}</h1>
          <p className="max-w-xl text-balance text-lg text-white/80">{dict.home.subtitle}</p>
          <Button
            render={<Link href={`/${locale}/book`} />}
            size="lg"
            className="mt-2 bg-gold text-navy hover:bg-gold-light"
          >
            {dict.home.cta}
            <Arrow />
          </Button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-16 sm:grid-cols-3 sm:px-6">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col items-center gap-3 rounded-2xl border border-border p-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-navy text-gold">
              <step.icon className="size-6" />
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <h3 className="font-heading text-lg font-bold text-navy">{step.title}</h3>
          </div>
        ))}
      </section>
    </div>
  );
}
