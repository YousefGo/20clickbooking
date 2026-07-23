import { and, asc, eq, gte, lte, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorAvailability, doctorExceptions, doctors } from "@/lib/db/schema";

export function getActiveDoctorsByDepartment(departmentId: string) {
  return db
    .select()
    .from(doctors)
    .where(and(eq(doctors.departmentId, departmentId), eq(doctors.isActive, true)))
    .orderBy(asc(doctors.nameEn));
}

export function getDoctorsByDepartment(departmentId: string) {
  return db
    .select()
    .from(doctors)
    .where(eq(doctors.departmentId, departmentId))
    .orderBy(asc(doctors.nameEn));
}

export async function getDoctorById(id: string) {
  const rows = await db.select().from(doctors).where(eq(doctors.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getDoctorByEmail(email: string) {
  const rows = await db
    .select()
    .from(doctors)
    .where(eq(doctors.email, email.trim().toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export function getDoctorAvailability(doctorId: string) {
  return db
    .select()
    .from(doctorAvailability)
    .where(and(eq(doctorAvailability.doctorId, doctorId), eq(doctorAvailability.isActive, true)))
    .orderBy(asc(doctorAvailability.dayOfWeek), asc(doctorAvailability.startTime));
}

export function getAllDoctorAvailability(doctorId: string) {
  return db
    .select()
    .from(doctorAvailability)
    .where(eq(doctorAvailability.doctorId, doctorId))
    .orderBy(asc(doctorAvailability.dayOfWeek), asc(doctorAvailability.startTime));
}

export function getDoctorExceptionsInRange(doctorId: string, from: string, to: string) {
  return db
    .select()
    .from(doctorExceptions)
    .where(
      and(
        or(eq(doctorExceptions.doctorId, doctorId), isNull(doctorExceptions.doctorId)),
        gte(doctorExceptions.exceptionDate, from),
        lte(doctorExceptions.exceptionDate, to),
      ),
    );
}

export function getDoctorExceptions(doctorId: string) {
  return db
    .select()
    .from(doctorExceptions)
    .where(eq(doctorExceptions.doctorId, doctorId))
    .orderBy(asc(doctorExceptions.exceptionDate));
}
