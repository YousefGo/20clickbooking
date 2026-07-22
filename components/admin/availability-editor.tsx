"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addAvailability, removeAvailability } from "@/lib/actions/admin-doctors";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export interface AvailabilityRow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function AvailabilityEditor({
  doctorId,
  dict,
  rows,
}: {
  doctorId: string;
  dict: Dictionary;
  rows: AvailabilityRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dayOfWeek, setDayOfWeek] = useState("0");
  const days = dict.admin.doctors.days;

  const grouped = [...rows].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

  function handleAdd(formData: FormData) {
    formData.set("dayOfWeek", dayOfWeek);
    startTransition(async () => {
      const result = await addAvailability(doctorId, formData);
      if (!result.ok) {
        toast.error(dict.common.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeAvailability(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">{dict.admin.doctors.availability}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {grouped.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <span className="font-semibold text-navy">
                {days[String(row.dayOfWeek) as keyof typeof days]}
              </span>
              <span dir="ltr" className="text-muted-foreground">
                {row.startTime.slice(0, 5)} – {row.endTime.slice(0, 5)}
              </span>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(row.id)} disabled={isPending}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form action={handleAdd} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Select value={dayOfWeek} onValueChange={(value) => setDayOfWeek(value ?? "0")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(days).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input name="startTime" type="time" required className="w-32" />
        <Input name="endTime" type="time" required className="w-32" />
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {dict.admin.doctors.addAvailability}
        </Button>
      </form>
    </div>
  );
}
