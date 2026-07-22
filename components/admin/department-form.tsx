"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDepartment, updateDepartment } from "@/lib/actions/admin-departments";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export interface DepartmentFormValues {
  id?: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  isActive: boolean;
}

export function DepartmentForm({
  locale,
  dict,
  initial,
}: {
  locale: Locale;
  dict: Dictionary;
  initial?: DepartmentFormValues;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = initial?.id
        ? await updateDepartment(initial.id, formData)
        : await createDepartment(formData);

      if (!result.ok) {
        setError(result.error === "slug_taken" ? "slug_taken" : dict.common.error);
        return;
      }
      toast.success(initial?.id ? dict.admin.departments.updateSuccess : dict.admin.departments.createSuccess);
      router.push(`/${locale}/admin/departments`);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.admin.departments.nameEn} name="nameEn" defaultValue={initial?.nameEn} dir="ltr" />
        <Field label={dict.admin.departments.nameAr} name="nameAr" defaultValue={initial?.nameAr} dir="rtl" />
      </div>
      <Field label={dict.admin.departments.slug} name="slug" defaultValue={initial?.slug} dir="ltr" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descriptionEn">{dict.admin.departments.descriptionEn}</Label>
          <Textarea id="descriptionEn" name="descriptionEn" dir="ltr" defaultValue={initial?.descriptionEn ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descriptionAr">{dict.admin.departments.descriptionAr}</Label>
          <Textarea id="descriptionAr" name="descriptionAr" dir="rtl" defaultValue={initial?.descriptionAr ?? ""} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="isActive" defaultChecked={initial?.isActive ?? true} />
        <span>{dict.common.active}</span>
      </label>

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {dict.common.save}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  dir,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  dir?: "ltr" | "rtl";
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} dir={dir} required={required} />
    </div>
  );
}
