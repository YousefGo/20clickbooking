"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addException, removeException } from "@/lib/actions/admin-doctors";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

export interface ExceptionRow {
  id: string;
  exceptionDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export function ExceptionsEditor({
  doctorId,
  dict,
  rows,
}: {
  doctorId: string;
  dict: Dictionary;
  rows: ExceptionRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [wholeDay, setWholeDay] = useState(true);

  const sorted = [...rows].sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate));

  function handleAdd(formData: FormData) {
    if (wholeDay) {
      formData.delete("startTime");
      formData.delete("endTime");
    }
    startTransition(async () => {
      const result = await addException(doctorId, formData);
      if (!result.ok) {
        toast.error(dict.common.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeException(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {sorted.length === 0 ? null : (
        <div className="flex flex-col gap-2">
          {sorted.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <span className="font-semibold text-navy" dir="ltr">
                {row.exceptionDate}
              </span>
              <span className="text-muted-foreground">
                {row.startTime && row.endTime
                  ? `${row.startTime.slice(0, 5)} – ${row.endTime.slice(0, 5)}`
                  : dict.admin.doctors.wholeDayBlocked}
              </span>
              <span className="text-xs text-muted-foreground">{row.reason}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(row.id)} disabled={isPending}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form action={handleAdd} className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exceptionDate">{dict.admin.doctors.exceptionDate}</Label>
            <Input id="exceptionDate" name="exceptionDate" type="date" required className="w-44" />
          </div>
          {!wholeDay ? (
            <>
              <Input name="startTime" type="time" required className="w-32" />
              <Input name="endTime" type="time" required className="w-32" />
            </>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={wholeDay} onCheckedChange={(checked) => setWholeDay(checked === true)} />
          <span>{dict.admin.doctors.wholeDayBlocked}</span>
        </label>
        <Input name="reason" placeholder={dict.admin.doctors.reason} />
        <Button type="submit" variant="outline" disabled={isPending} className="self-start">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {dict.admin.doctors.addException}
        </Button>
      </form>
    </div>
  );
}
