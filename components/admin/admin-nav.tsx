"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CalendarDays, Building2, Users } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function AdminNav({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();

  const items = [
    { href: `/${locale}/admin`, label: dict.admin.nav.requests, icon: ClipboardList, exact: true },
    { href: `/${locale}/admin/appointments`, label: dict.admin.nav.appointments, icon: CalendarDays },
    { href: `/${locale}/admin/departments`, label: dict.admin.nav.departments, icon: Building2 },
    { href: `/${locale}/admin/doctors`, label: dict.admin.nav.doctors, icon: Users },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              isActive ? "bg-white/10 text-gold" : "text-white/80 hover:bg-white/5 hover:text-white",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
