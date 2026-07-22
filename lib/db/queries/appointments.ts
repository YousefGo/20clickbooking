import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, departments, doctors } from "@/lib/db/schema";

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

export async function getAppointmentById(id: string) {
  const rows = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return rows[0] ?? null;
}

export function getRecentAppointments(limit = 50) {
  return db.select().from(appointments).orderBy(desc(appointments.createdAt)).limit(limit);
}
