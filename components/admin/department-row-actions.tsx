"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteDepartment } from "@/lib/actions/admin-departments";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export function DepartmentRowActions({
  locale,
  dict,
  departmentId,
}: {
  locale: Locale;
  dict: Dictionary;
  departmentId: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        render={<Link href={`/${locale}/admin/departments/${departmentId}`} />}
        variant="ghost"
        size="icon"
      >
        <Pencil className="size-4" />
      </Button>
      <DeleteButton
        confirmMessage={dict.admin.departments.deleteConfirm}
        action={() => deleteDepartment(departmentId)}
        errorMessages={{ has_doctors: dict.admin.departments.deleteConfirm }}
        fallbackErrorMessage={dict.common.error}
        successMessage={dict.admin.departments.deleteSuccess}
      />
    </div>
  );
}
