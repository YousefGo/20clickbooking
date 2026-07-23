import { Mail, Phone } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export interface DoctorAppointmentItem {
  id: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  appointmentDate: string;
  startTime: string;
  departmentName: string;
}

export function DoctorAppointmentsList({
  locale,
  dict,
  timezone,
  items,
}: {
  locale: Locale;
  dict: Dictionary;
  timezone: string;
  items: DoctorAppointmentItem[];
}) {
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: timezone,
  });
  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  if (items.length === 0) {
    return <p className="text-muted-foreground">{dict.admin.appointments.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const [h, m] = item.startTime.split(":").map(Number);
        return (
          <div
            key={item.id}
            className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-navy">{item.patientName}</p>
              <p className="text-sm text-muted-foreground">{item.departmentName}</p>
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
                ) : null}
              </div>
            </div>
            <span className="text-sm font-semibold text-teal">
              {dateFormatter.format(new Date(`${item.appointmentDate}T00:00:00Z`))} ·{" "}
              {timeFormatter.format(new Date(Date.UTC(2000, 0, 1, h, m)))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
