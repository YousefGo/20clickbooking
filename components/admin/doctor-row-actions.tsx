"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteDoctor } from "@/lib/actions/admin-doctors";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export function DoctorRowActions({
  locale,
  dict,
  doctorId,
}: {
  locale: Locale;
  dict: Dictionary;
  doctorId: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button render={<Link href={`/${locale}/admin/doctors/${doctorId}`} />} variant="ghost" size="icon">
        <Pencil className="size-4" />
      </Button>
      <DeleteButton
        confirmMessage={dict.admin.doctors.deleteConfirm}
        action={() => deleteDoctor(doctorId)}
        errorMessages={{ has_appointments: dict.common.error }}
        fallbackErrorMessage={dict.common.error}
        successMessage={dict.admin.doctors.deleteSuccess}
      />
    </div>
  );
}
