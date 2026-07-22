"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminLogout } from "@/lib/actions/admin-auth";
import type { Locale } from "@/lib/i18n/config";

export function LogoutButton({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await adminLogout();
      router.push(`/${locale}/admin/login`);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleLogout}
      disabled={isPending}
      className="justify-start gap-2.5 text-white/80 hover:bg-white/5 hover:text-white"
    >
      <LogOut className="size-4" />
      {label}
    </Button>
  );
}
