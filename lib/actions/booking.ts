"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";
import { getDoctorById } from "@/lib/db/queries/doctors";
import { minutesToTime, timeToMinutes } from "@/lib/utils/datetime";
import { isLocale } from "@/lib/i18n/config";

const bookingSchema = z
  .object({
    doctorId: z.string().uuid(),
    appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    patientName: z.string().trim().min(2).max(120),
    patientPhone: z.string().trim().max(30).optional().or(z.literal("")),
    patientEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    locale: z.string(),
  })
  .refine((data) => Boolean(data.patientPhone) || Boolean(data.patientEmail), {
    message: "phone_or_email_required",
    path: ["patientPhone"],
  });

export type CreateBookingResult =
  | { ok: true; appointmentId: string }
  | { ok: false; error: "validation" | "slot_taken" | "doctor_not_found" | "unknown" };

export async function createBooking(
  _prevState: CreateBookingResult | null,
  formData: FormData,
): Promise<CreateBookingResult> {
  const parsed = bookingSchema.safeParse({
    doctorId: formData.get("doctorId"),
    appointmentDate: formData.get("appointmentDate"),
    startTime: formData.get("startTime"),
    patientName: formData.get("patientName"),
    patientPhone: formData.get("patientPhone"),
    patientEmail: formData.get("patientEmail"),
    notes: formData.get("notes"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    return { ok: false, error: "validation" };
  }

  const data = parsed.data;
  const doctor = await getDoctorById(data.doctorId);
  if (!doctor || !doctor.isActive) {
    return { ok: false, error: "doctor_not_found" };
  }

  const endTime = minutesToTime(timeToMinutes(data.startTime) + doctor.slotDurationMinutes);
  const locale = isLocale(data.locale) ? data.locale : "ar";

  try {
    const [row] = await db
      .insert(appointments)
      .values({
        doctorId: doctor.id,
        departmentId: doctor.departmentId,
        patientName: data.patientName,
        patientPhone: data.patientPhone || null,
        patientEmail: data.patientEmail || null,
        locale,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        endTime,
        notes: data.notes || null,
        status: "pending",
      })
      .returning({ id: appointments.id });

    return { ok: true, appointmentId: row.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "slot_taken" };
    }
    console.error("createBooking failed", error);
    return { ok: false, error: "unknown" };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505",
  );
}
