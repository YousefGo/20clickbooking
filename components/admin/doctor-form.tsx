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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDoctor, updateDoctor } from "@/lib/actions/admin-doctors";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export interface DoctorFormValues {
  id?: string;
  departmentId: string;
  nameEn: string;
  nameAr: string;
  titleEn: string | null;
  titleAr: string | null;
  bioEn: string | null;
  bioAr: string | null;
  slotDurationMinutes: number;
  isActive: boolean;
}

export function DoctorForm({
  locale,
  dict,
  departments,
  initial,
}: {
  locale: Locale;
  dict: Dictionary;
  departments: { id: string; nameEn: string; nameAr: string }[];
  initial?: DoctorFormValues;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState(initial?.departmentId ?? departments[0]?.id ?? "");

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("departmentId", departmentId);
    startTransition(async () => {
      const result = initial?.id ? await updateDoctor(initial.id, formData) : await createDoctor(formData);
      if (!result.ok) {
        setError(dict.common.error);
        return;
      }
      toast.success(initial?.id ? dict.admin.doctors.updateSuccess : dict.admin.doctors.createSuccess);
      if (initial?.id) {
        router.refresh();
      } else {
        router.push(`/${locale}/admin/doctors/${result.id}`);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>{dict.admin.doctors.department}</Label>
        <Select value={departmentId} onValueChange={(value) => setDepartmentId(value ?? "")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {locale === "ar" ? department.nameAr : department.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.admin.doctors.nameEn} name="nameEn" defaultValue={initial?.nameEn} dir="ltr" />
        <Field label={dict.admin.doctors.nameAr} name="nameAr" defaultValue={initial?.nameAr} dir="rtl" />
        <Field label={dict.admin.doctors.titleEn} name="titleEn" defaultValue={initial?.titleEn ?? ""} dir="ltr" />
        <Field label={dict.admin.doctors.titleAr} name="titleAr" defaultValue={initial?.titleAr ?? ""} dir="rtl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bioEn">{dict.admin.doctors.bioEn}</Label>
          <Textarea id="bioEn" name="bioEn" dir="ltr" defaultValue={initial?.bioEn ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bioAr">{dict.admin.doctors.bioAr}</Label>
          <Textarea id="bioAr" name="bioAr" dir="rtl" defaultValue={initial?.bioAr ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:w-56">
        <Label htmlFor="slotDurationMinutes">{dict.admin.doctors.slotDuration}</Label>
        <Input
          id="slotDurationMinutes"
          name="slotDurationMinutes"
          type="number"
          min={5}
          max={240}
          step={5}
          defaultValue={initial?.slotDurationMinutes ?? 30}
        />
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
}: {
  label: string;
  name: string;
  defaultValue?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} dir={dir} />
    </div>
  );
}
