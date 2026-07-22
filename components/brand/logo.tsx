import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

export function Logo({
  locale,
  tone = "solid",
  withTagline = false,
  href,
  className,
}: {
  locale: Locale;
  tone?: "solid" | "inverted";
  withTagline?: boolean;
  href?: string;
  className?: string;
}) {
  const name = locale === "ar" ? siteConfig.nameAr : siteConfig.nameEn;
  const tagline = locale === "ar" ? siteConfig.taglineAr : siteConfig.taglineEn;
  const textClass = tone === "solid" ? "text-navy dark:text-white" : "text-white";

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} className="size-9" />
      <span className="flex flex-col leading-tight">
        <span className={cn("font-heading text-xl font-black", textClass)}>{name}</span>
        {withTagline ? (
          <span className={cn("text-xs font-semibold", tone === "solid" ? "text-gold" : "text-gold-light")}>
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}
