"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { confirmAppointment, rejectAppointment } from "@/lib/actions/admin-appointments";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export interface PendingRequestItem {
  id: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  notes: string | null;
  appointmentDate: string;
  startTime: string;
  doctorName: string;
  departmentName: string;
}

export function RequestsTable({
  locale,
  dict,
  timezone,
  items,
}: {
  locale: Locale;
  dict: Dictionary;
  timezone: string;
  items: PendingRequestItem[];
}) {
  const [list, setList] = useState(items);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: timezone,
      }),
    [locale, timezone],
  );
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
    [locale],
  );

  function formatDateTime(date: string, time: string) {
    const [h, m] = time.split(":").map(Number);
    return `${dateFormatter.format(new Date(`${date}T00:00:00Z`))} · ${timeFormatter.format(new Date(Date.UTC(2000, 0, 1, h, m)))}`;
  }

  if (list.length === 0) {
    return <p className="text-muted-foreground">{dict.admin.requests.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {list.map((item) => (
        <RequestCard
          key={item.id}
          item={item}
          dict={dict}
          dateTimeLabel={formatDateTime(item.appointmentDate, item.startTime)}
          onDone={(id) => setList((current) => current.filter((row) => row.id !== id))}
        />
      ))}
    </div>
  );
}

function RequestCard({
  item,
  dict,
  dateTimeLabel,
  onDone,
}: {
  item: PendingRequestItem;
  dict: Dictionary;
  dateTimeLabel: string;
  onDone: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmAppointment(item.id);
      if (!result.ok) {
        toast.error(dict.common.error);
        return;
      }
      if (item.patientEmail && !result.emailSent) {
        toast.warning(dict.admin.requests.confirmEmailFailed);
      } else {
        toast.success(dict.admin.requests.confirmSuccess);
      }
      onDone(item.id);
    });
  }

  function handleReject(reason: string, notifyPatient: boolean) {
    startTransition(async () => {
      const result = await rejectAppointment(item.id, { reason, notifyPatient });
      if (!result.ok) {
        toast.error(dict.common.error);
        return;
      }
      toast.success(dict.admin.requests.rejectSuccess);
      setRejectOpen(false);
      onDone(item.id);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-heading text-base font-bold text-navy">{item.patientName}</span>
        <span className="text-sm text-muted-foreground">
          {item.doctorName} · {item.departmentName}
        </span>
        <span className="text-sm font-semibold text-gold">{dateTimeLabel}</span>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {item.patientPhone ? (
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Phone className="size-3.5" />
              {item.patientPhone}
            </span>
          ) : null}
          {item.patientEmail ? (
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Mail className="size-3.5" />
              {item.patientEmail}
            </span>
          ) : (
            <span className="font-semibold text-destructive">{dict.admin.requests.noEmailOnFile}</span>
          )}
        </div>
        {item.notes ? (
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {dict.admin.requests.notes}: {item.notes}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-2">
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger render={<Button type="button" variant="outline" disabled={isPending} />}>
            <X className="size-4" />
            {dict.common.reject}
          </DialogTrigger>
          <RejectDialogContent
            dict={dict}
            hasEmail={Boolean(item.patientEmail)}
            isPending={isPending}
            onSubmit={handleReject}
          />
        </Dialog>
        <Button type="button" onClick={handleConfirm} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {dict.common.confirm}
        </Button>
      </div>
    </div>
  );
}

function RejectDialogContent({
  dict,
  hasEmail,
  isPending,
  onSubmit,
}: {
  dict: Dictionary;
  hasEmail: boolean;
  isPending: boolean;
  onSubmit: (reason: string, notifyPatient: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(hasEmail);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{dict.common.reject}</DialogTitle>
        <DialogDescription>{dict.admin.requests.rejectReason}</DialogDescription>
      </DialogHeader>
      <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={notify} disabled={!hasEmail} onCheckedChange={(checked) => setNotify(checked === true)} />
        <Label className="font-normal">{dict.admin.requests.notifyPatient}</Label>
      </label>
      <DialogFooter>
        <Button type="button" variant="destructive" disabled={isPending} onClick={() => onSubmit(reason, notify)}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {dict.common.reject}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
