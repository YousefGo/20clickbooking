import { Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export interface ArchiveRowItem {
  id: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  appointmentDate: string;
  startTime: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  doctorName: string;
  departmentName: string;
}

const statusBadgeClass: Record<ArchiveRowItem["status"], string> = {
  pending: "bg-gold text-navy",
  confirmed: "bg-teal text-white",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-brand-gray text-navy",
};

export function ArchiveTable({
  locale,
  dict,
  timezone,
  items,
}: {
  locale: Locale;
  dict: Dictionary;
  timezone: string;
  items: ArchiveRowItem[];
}) {
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  });
  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  if (items.length === 0) {
    return <p className="text-muted-foreground">{dict.admin.archive.empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-brand-gray/40 text-start text-xs font-semibold text-muted-foreground">
          <tr>
            <Th>{dict.admin.dashboard.search.reference}</Th>
            <Th>{dict.admin.requests.patient}</Th>
            <Th>{dict.admin.requests.contact}</Th>
            <Th>{dict.admin.requests.doctor}</Th>
            <Th>{dict.admin.requests.department}</Th>
            <Th>{dict.admin.requests.dateTime}</Th>
            <Th>{dict.admin.appointments.status}</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const [h, m] = item.startTime.split(":").map(Number);
            return (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">
                  {item.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-4 py-3 font-semibold text-navy">{item.patientName}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
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
                </td>
                <td className="px-4 py-3">{item.doctorName}</td>
                <td className="px-4 py-3">{item.departmentName}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {dateFormatter.format(new Date(`${item.appointmentDate}T00:00:00Z`))} ·{" "}
                  {timeFormatter.format(new Date(Date.UTC(2000, 0, 1, h, m)))}
                </td>
                <td className="px-4 py-3">
                  <Badge className={statusBadgeClass[item.status]}>{dict.status[item.status]}</Badge>
                </td>
              </tr>
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
