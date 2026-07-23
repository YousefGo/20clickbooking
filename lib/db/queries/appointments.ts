import { and, asc, count, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, departments, doctors } from "@/lib/db/schema";

export type AppointmentStatus = "pending" | "confirmed" | "rejected" | "cancelled";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const appointmentWithDetailsSelection = {
  appointment: appointments,
  doctor: doctors,
  department: departments,
};

function withDetails() {
  return db
    .select(appointmentWithDetailsSelection)
    .from(appointments)
    .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
    .innerJoin(departments, eq(appointments.departmentId, departments.id));
}

export function getBookedSlots(doctorId: string, from: string, to: string) {
  return db
    .select({
      appointmentDate: appointments.appointmentDate,
      startTime: appointments.startTime,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        gte(appointments.appointmentDate, from),
        lte(appointments.appointmentDate, to),
        inArray(appointments.status, ["pending", "confirmed"]),
      ),
    );
}

export function getPendingAppointments() {
  return withDetails()
    .where(eq(appointments.status, "pending"))
    .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));
}

export function getConfirmedAppointments() {
  return withDetails()
    .where(eq(appointments.status, "confirmed"))
    .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));
}

/** Full appointment history across every status, for the admin archive/export. */
export function getAllAppointmentsWithDetails() {
  return withDetails().orderBy(desc(appointments.appointmentDate), desc(appointments.startTime));
}

/** All appointments (any status) whose date falls within [from, to], for calendar views. */
export function getAppointmentsInRange(from: string, to: string) {
  return withDetails()
    .where(and(gte(appointments.appointmentDate, from), lte(appointments.appointmentDate, to)))
    .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));
}

/** Confirmed appointments whose date falls within [from, to], for the admin calendar (confirmed-only). */
export function getConfirmedAppointmentsInRange(from: string, to: string) {
  return withDetails()
    .where(
      and(
        eq(appointments.status, "confirmed"),
        gte(appointments.appointmentDate, from),
        lte(appointments.appointmentDate, to),
      ),
    )
    .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));
}

/** A single doctor's appointments (any status) whose date falls within [from, to], for their calendar tab. */
export function getAppointmentsByDoctorInRange(doctorId: string, from: string, to: string) {
  return withDetails()
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        gte(appointments.appointmentDate, from),
        lte(appointments.appointmentDate, to),
      ),
    )
    .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));
}

/** A single doctor's confirmed appointments whose date falls within [from, to], for their calendar tab (confirmed-only). */
export function getConfirmedAppointmentsByDoctorInRange(doctorId: string, from: string, to: string) {
  return withDetails()
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.status, "confirmed"),
        gte(appointments.appointmentDate, from),
        lte(appointments.appointmentDate, to),
      ),
    )
    .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));
}

export function getPendingAppointmentsByDoctor(doctorId: string) {
  return withDetails()
    .where(and(eq(appointments.doctorId, doctorId), eq(appointments.status, "pending")))
    .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));
}

export function getConfirmedAppointmentsByDoctor(doctorId: string) {
  return withDetails()
    .where(and(eq(appointments.doctorId, doctorId), eq(appointments.status, "confirmed")))
    .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime));
}

export async function getAppointmentById(id: string) {
  const rows = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return rows[0] ?? null;
}

export function getRecentAppointments(limit = 50) {
  return db.select().from(appointments).orderBy(desc(appointments.createdAt)).limit(limit);
}

export async function getStatusCounts(): Promise<Record<AppointmentStatus, number>> {
  const rows = await db
    .select({ status: appointments.status, count: count() })
    .from(appointments)
    .groupBy(appointments.status);

  const result: Record<AppointmentStatus, number> = { pending: 0, confirmed: 0, rejected: 0, cancelled: 0 };
  for (const row of rows) result[row.status] = Number(row.count);
  return result;
}

/** Count of active (pending/confirmed) appointments whose date falls within [from, to] inclusive. */
export async function getActiveAppointmentCountInRange(from: string, to: string): Promise<number> {
  const rows = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, from),
        lte(appointments.appointmentDate, to),
        inArray(appointments.status, ["pending", "confirmed"]),
      ),
    );
  return Number(rows[0]?.count ?? 0);
}

/** Daily count of appointments created within [from, to] (calendar dates in `timezone`), for a trend chart. */
export async function getDailyBookingCounts(
  from: string,
  to: string,
  timezone: string,
): Promise<{ date: string; count: number }[]> {
  const rows = await db
    .select({
      date: sql<string>`to_char(${appointments.createdAt} AT TIME ZONE ${timezone}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(appointments)
    .where(and(gte(appointments.createdAt, new Date(`${from}T00:00:00Z`)), lte(appointments.createdAt, new Date(`${to}T23:59:59Z`))))
    .groupBy(sql`1`);
  return rows.map((row) => ({ date: row.date, count: Number(row.count) }));
}

/** Active (pending/confirmed) appointment counts grouped by department. */
export async function getDepartmentBreakdown() {
  const rows = await db
    .select({
      departmentId: appointments.departmentId,
      nameEn: departments.nameEn,
      nameAr: departments.nameAr,
      count: count(),
    })
    .from(appointments)
    .innerJoin(departments, eq(appointments.departmentId, departments.id))
    .where(inArray(appointments.status, ["pending", "confirmed"]))
    .groupBy(appointments.departmentId, departments.nameEn, departments.nameAr)
    .orderBy(desc(count()));
  return rows.map((row) => ({ ...row, count: Number(row.count) }));
}

/** Find appointments by reference code (first 8 chars of the id) or by patient phone number. */
export function searchAppointments(query: string, limit = 25) {
  const trimmed = query.trim();
  const digitsOnly = trimmed.replace(/[^0-9]/g, "");
  const codeOnly = trimmed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const conditions = [];
  if (UUID_RE.test(trimmed)) {
    conditions.push(eq(appointments.id, trimmed.toLowerCase()));
  } else if (codeOnly.length >= 3 && codeOnly.length <= 8) {
    conditions.push(sql`upper(left(${appointments.id}::text, 8)) LIKE ${codeOnly + "%"}`);
  }
  if (digitsOnly.length >= 3) {
    conditions.push(
      sql`regexp_replace(coalesce(${appointments.patientPhone}, ''), '[^0-9]', '', 'g') LIKE ${"%" + digitsOnly + "%"}`,
    );
  }

  if (conditions.length === 0) return Promise.resolve([]);

  return withDetails()
    .where(or(...conditions))
    .orderBy(desc(appointments.createdAt))
    .limit(limit);
}
