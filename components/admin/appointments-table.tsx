"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Mail, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelAppointment, sendConfirmationEmail } from "@/lib/actions/admin-appointments";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export interface AppointmentRow {
  id: string;
  patientName: string;
  patientEmail: string | null;
  appointmentDate: string;
  startTime: string;
  doctorName: string;
  departmentName: string;
  emailSentAt: string | null;
  emailError: string | null;
}

export function AppointmentsTable({
  locale,
  dict,
  timezone,
  items,
}: {
  locale: Locale;
  dict: Dictionary;
  timezone: string;
  items: AppointmentRow[];
}) {
  const [list, setList] = useState(items);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
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

  if (list.length === 0) {
    return <p className="text-muted-foreground">{dict.admin.appointments.empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-brand-gray/40 text-start text-xs font-semibold text-muted-foreground">
          <tr>
            <Th>{dict.admin.requests.patient}</Th>
            <Th>{dict.admin.requests.doctor}</Th>
            <Th>{dict.admin.requests.department}</Th>
            <Th>{dict.admin.requests.dateTime}</Th>
            <Th>{dict.admin.appointments.status}</Th>
            <Th>{dict.common.actions}</Th>
          </tr>
        </thead>
        <tbody>
          {list.map((item) => {
            const [h, m] = item.startTime.split(":").map(Number);
            return (
              <Row
                key={item.id}
                item={item}
                dict={dict}
                dateLabel={dateFormatter.format(new Date(`${item.appointmentDate}T00:00:00Z`))}
                timeLabel={timeFormatter.format(new Date(Date.UTC(2000, 0, 1, h, m)))}
                onCancelled={(id) => setList((current) => current.filter((row) => row.id !== id))}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-start">{children}</th>;
}

function Row({
  item,
  dict,
  dateLabel,
  timeLabel,
  onCancelled,
}: {
  item: AppointmentRow;
  dict: Dictionary;
  dateLabel: string;
  timeLabel: string;
  onCancelled: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    startTransition(async () => {
      const sent = await sendConfirmationEmail(item.id);
      toast[sent ? "success" : "error"](sent ? dict.admin.appointments.emailSent : dict.admin.appointments.emailFailed);
    });
  }

  function handleCancel() {
    if (!window.confirm(dict.admin.appointments.cancel)) return;
    startTransition(async () => {
      await cancelAppointment(item.id);
      toast.success(dict.admin.appointments.cancelSuccess);
      onCancelled(item.id);
    });
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 font-semibold text-navy">{item.patientName}</td>
      <td className="px-4 py-3">{item.doctorName}</td>
      <td className="px-4 py-3">{item.departmentName}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {dateLabel} · {timeLabel}
      </td>
      <td className="px-4 py-3">
        <Badge className="bg-teal text-white">{dict.status.confirmed}</Badge>
        {item.patientEmail && !item.emailSentAt ? (
          <Badge variant="destructive" className="ms-1">
            {dict.admin.appointments.emailFailed}
          </Badge>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          {item.patientEmail ? (
            <Button type="button" variant="ghost" size="icon" onClick={handleResend} disabled={isPending} title={dict.admin.appointments.resendEmail}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="icon" onClick={handleCancel} disabled={isPending} title={dict.admin.appointments.cancel}>
            <XCircle className="size-4 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
