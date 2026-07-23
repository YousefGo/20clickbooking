import type { getAllAppointmentsWithDetails } from "@/lib/db/queries/appointments";
import type { AppointmentStatus } from "@/lib/db/queries/appointments";

export type ArchiveRow = Awaited<ReturnType<typeof getAllAppointmentsWithDetails>>[number];

export interface ArchiveFilterParams {
  departmentId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  q?: string;
}

export function parseArchiveFilters(searchParams: Record<string, string | undefined>): ArchiveFilterParams {
  const status = searchParams.status;
  return {
    departmentId: searchParams.departmentId || undefined,
    doctorId: searchParams.doctorId || undefined,
    status: status === "pending" || status === "confirmed" || status === "rejected" || status === "cancelled" ? status : undefined,
    from: searchParams.from || undefined,
    to: searchParams.to || undefined,
    q: searchParams.q?.trim() || undefined,
  };
}

export function filterArchiveRows(rows: ArchiveRow[], filters: ArchiveFilterParams): ArchiveRow[] {
  const q = filters.q?.toLowerCase();
  const qDigits = filters.q?.replace(/[^0-9]/g, "");
  const qCode = filters.q?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return rows.filter((row) => {
    const { appointment } = row;
    if (filters.departmentId && appointment.departmentId !== filters.departmentId) return false;
    if (filters.doctorId && appointment.doctorId !== filters.doctorId) return false;
    if (filters.status && appointment.status !== filters.status) return false;
    if (filters.from && appointment.appointmentDate < filters.from) return false;
    if (filters.to && appointment.appointmentDate > filters.to) return false;

    if (q) {
      const nameMatch = appointment.patientName.toLowerCase().includes(q);
      const emailMatch = appointment.patientEmail?.toLowerCase().includes(q) ?? false;
      const phoneMatch = qDigits && qDigits.length >= 3 ? (appointment.patientPhone ?? "").replace(/[^0-9]/g, "").includes(qDigits) : false;
      const codeMatch = qCode && qCode.length >= 3 ? appointment.id.slice(0, 8).toUpperCase().startsWith(qCode) : false;
      if (!nameMatch && !emailMatch && !phoneMatch && !codeMatch) return false;
    }

    return true;
  });
}
