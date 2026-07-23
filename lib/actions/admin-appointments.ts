"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";
import { getAppointmentById } from "@/lib/db/queries/appointments";
import { getDoctorById } from "@/lib/db/queries/doctors";
import { getDepartmentById } from "@/lib/db/queries/departments";
import { getResendClient } from "@/lib/email/resend";
import { BookingConfirmedEmail } from "@/lib/email/templates/booking-confirmed";
import { BookingRejectedEmail } from "@/lib/email/templates/booking-rejected";
import { getResendConfig, hospitalConfig } from "@/lib/config";

export type ConfirmResult = { ok: true; emailSent: boolean } | { ok: false; error: "not_pending" | "not_found" };
export type RejectResult = { ok: true; emailSent: boolean } | { ok: false; error: "not_pending" | "not_found" };

function formatAppointmentDateTime(appointmentDate: string, startTime: string, locale: "ar" | "en") {
  const [h, m] = startTime.split(":").map(Number);
  const dateLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: hospitalConfig.timezone,
  }).format(new Date(`${appointmentDate}T00:00:00Z`));
  const timeLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
  return { dateLabel, timeLabel };
}

export async function confirmAppointment(id: string): Promise<ConfirmResult> {
  const [updated] = await db
    .update(appointments)
    .set({ status: "confirmed", confirmedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(appointments.id, id), eq(appointments.status, "pending")))
    .returning();

  if (!updated) {
    const existing = await getAppointmentById(id);
    return { ok: false, error: existing ? "not_pending" : "not_found" };
  }

  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/admin/requests", "page");
  revalidatePath("/[locale]/admin/appointments", "page");

  if (!updated.patientEmail) {
    return { ok: true, emailSent: false };
  }

  const emailSent = await sendConfirmationEmail(updated.id);
  return { ok: true, emailSent };
}

export async function sendConfirmationEmail(appointmentId: string): Promise<boolean> {
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment || !appointment.patientEmail) return false;

  const [doctor, department] = await Promise.all([
    getDoctorById(appointment.doctorId),
    getDepartmentById(appointment.departmentId),
  ]);
  if (!doctor || !department) return false;

  const locale = appointment.locale;
  const { dateLabel, timeLabel } = formatAppointmentDateTime(
    appointment.appointmentDate,
    appointment.startTime,
    locale,
  );
  const hospitalName = locale === "ar" ? hospitalConfig.nameAr : hospitalConfig.nameEn;
  const hospitalAddress = locale === "ar" ? hospitalConfig.addressAr : hospitalConfig.addressEn;

  try {
    const { fromEmail } = getResendConfig();
    const t = locale === "ar" ? "تم تأكيد موعدك" : "Your appointment is confirmed";
    await getResendClient().emails.send({
      from: fromEmail,
      to: appointment.patientEmail,
      subject: t,
      react: BookingConfirmedEmail({
        locale,
        patientName: appointment.patientName,
        doctorName: locale === "ar" ? doctor.nameAr : doctor.nameEn,
        departmentName: locale === "ar" ? department.nameAr : department.nameEn,
        dateLabel,
        timeLabel,
        hospitalName,
        hospitalAddress: hospitalAddress || undefined,
        hospitalPhone: hospitalConfig.phone || undefined,
      }),
    });

    await db
      .update(appointments)
      .set({ emailSentAt: new Date(), emailError: null })
      .where(eq(appointments.id, appointmentId));
    return true;
  } catch (error) {
    console.error("sendConfirmationEmail failed", error);
    await db
      .update(appointments)
      .set({ emailError: error instanceof Error ? error.message : "unknown error" })
      .where(eq(appointments.id, appointmentId));
    return false;
  }
}

export async function rejectAppointment(
  id: string,
  options: { reason?: string; notifyPatient: boolean },
): Promise<RejectResult> {
  const [updated] = await db
    .update(appointments)
    .set({
      status: "rejected",
      rejectedAt: new Date(),
      adminNotes: options.reason || null,
      updatedAt: new Date(),
    })
    .where(and(eq(appointments.id, id), eq(appointments.status, "pending")))
    .returning();

  if (!updated) {
    const existing = await getAppointmentById(id);
    return { ok: false, error: existing ? "not_pending" : "not_found" };
  }

  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/admin/requests", "page");

  if (!options.notifyPatient || !updated.patientEmail) {
    return { ok: true, emailSent: false };
  }

  const hospitalName = updated.locale === "ar" ? hospitalConfig.nameAr : hospitalConfig.nameEn;

  try {
    const { fromEmail } = getResendConfig();
    const t = updated.locale === "ar" ? "تحديث بخصوص طلب موعدك" : "Update on your appointment request";
    await getResendClient().emails.send({
      from: fromEmail,
      to: updated.patientEmail,
      subject: t,
      react: BookingRejectedEmail({
        locale: updated.locale,
        patientName: updated.patientName,
        hospitalName,
        reason: options.reason || undefined,
      }),
    });
    await db.update(appointments).set({ emailSentAt: new Date(), emailError: null }).where(eq(appointments.id, id));
    return { ok: true, emailSent: true };
  } catch (error) {
    console.error("rejectAppointment email failed", error);
    await db
      .update(appointments)
      .set({ emailError: error instanceof Error ? error.message : "unknown error" })
      .where(eq(appointments.id, id));
    return { ok: true, emailSent: false };
  }
}

export async function cancelAppointment(id: string): Promise<void> {
  await db
    .update(appointments)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(appointments.id, id));
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/admin/appointments", "page");
}
