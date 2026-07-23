"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { doctorLogin } from "@/lib/actions/doctor-auth";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function DoctorLoginForm({ dict, redirectTo }: { dict: Dictionary; redirectTo: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const result = await doctorLogin(email, password);
      if (result.ok) {
        router.push(redirectTo);
        router.refresh();
      } else if (result.error === "rate_limited") {
        setError(dict.doctor.login.tooManyAttempts);
      } else {
        setError(dict.doctor.login.invalidCredentials);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{dict.doctor.login.email}</Label>
        <Input id="email" name="email" type="email" required autoFocus dir="ltr" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{dict.doctor.login.password}</Label>
        <Input id="password" name="password" type="password" required dir="ltr" />
      </div>
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {dict.doctor.login.submit}
      </Button>
    </form>
  );
}
