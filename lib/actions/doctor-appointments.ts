"use server";

import { revalidatePath } from "next/cache";
import { getDoctorSession } from "@/lib/actions/doctor-auth";
import { getAppointmentById } from "@/lib/db/queries/appointments";
import { confirmAppointment, rejectAppointment, type ConfirmResult, type RejectResult } from "@/lib/actions/admin-appointments";

async function assertOwnAppointment(appointmentId: string): Promise<{ ok: true } | { ok: false; error: "not_found" }> {
  const doctorId = await getDoctorSession();
  if (!doctorId) return { ok: false, error: "not_found" };
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment || appointment.doctorId !== doctorId) return { ok: false, error: "not_found" };
  return { ok: true };
}

export async function doctorConfirmAppointment(id: string): Promise<ConfirmResult> {
  const ownership = await assertOwnAppointment(id);
  if (!ownership.ok) return { ok: false, error: ownership.error };

  const result = await confirmAppointment(id);
  revalidatePath("/[locale]/doctor", "page");
  return result;
}

export async function doctorRejectAppointment(
  id: string,
  options: { reason?: string; notifyPatient: boolean },
): Promise<RejectResult> {
  const ownership = await assertOwnAppointment(id);
  if (!ownership.ok) return { ok: false, error: ownership.error };

  const result = await rejectAppointment(id, options);
  revalidatePath("/[locale]/doctor", "page");
  return result;
}
