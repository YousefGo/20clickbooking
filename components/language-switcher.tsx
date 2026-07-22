"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const labels: Record<Locale, string> = { ar: "العربية", en: "English" };

function persistLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export function LanguageSwitcher({ locale, tone = "solid" }: { locale: Locale; tone?: "solid" | "inverted" }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    const rest = pathname.split("/").slice(2).join("/");
    persistLocaleCookie(next);
    router.push(`/${next}/${rest}`);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-current/15 p-1">
      {locales.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={code === locale ? "default" : "ghost"}
          onClick={() => switchTo(code)}
          className={cn(
            "h-7 rounded-full px-3 text-xs",
            code !== locale && tone === "inverted" && "text-white hover:bg-white/10 hover:text-white",
          )}
        >
          {labels[code]}
        </Button>
      ))}
    </div>
  );
}
