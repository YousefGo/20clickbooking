"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { doctorAvailability, doctorExceptions, doctors } from "@/lib/db/schema";

const doctorSchema = z.object({
  departmentId: z.string().uuid(),
  nameEn: z.string().trim().min(2).max(120),
  nameAr: z.string().trim().min(2).max(120),
  titleEn: z.string().trim().max(120).optional().or(z.literal("")),
  titleAr: z.string().trim().max(120).optional().or(z.literal("")),
  bioEn: z.string().trim().max(1000).optional().or(z.literal("")),
  bioAr: z.string().trim().max(1000).optional().or(z.literal("")),
  slotDurationMinutes: z.coerce.number().int().min(5).max(240),
  isActive: z.boolean(),
});

export type DoctorActionResult = { ok: true; id?: string } | { ok: false; error: string };

function parseDoctorForm(formData: FormData) {
  return doctorSchema.safeParse({
    departmentId: formData.get("departmentId"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    titleEn: formData.get("titleEn"),
    titleAr: formData.get("titleAr"),
    bioEn: formData.get("bioEn"),
    bioAr: formData.get("bioAr"),
    slotDurationMinutes: formData.get("slotDurationMinutes"),
    isActive: formData.get("isActive") === "on",
  });
}

export async function createDoctor(formData: FormData): Promise<DoctorActionResult> {
  const parsed = parseDoctorForm(formData);
  if (!parsed.success) return { ok: false, error: "validation" };

  const [row] = await db
    .insert(doctors)
    .values({
      departmentId: parsed.data.departmentId,
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr,
      titleEn: parsed.data.titleEn || null,
      titleAr: parsed.data.titleAr || null,
      bioEn: parsed.data.bioEn || null,
      bioAr: parsed.data.bioAr || null,
      slotDurationMinutes: parsed.data.slotDurationMinutes,
      isActive: parsed.data.isActive,
    })
    .returning({ id: doctors.id });

  revalidatePath("/[locale]/admin/doctors", "page");
  return { ok: true, id: row.id };
}

export async function updateDoctor(id: string, formData: FormData): Promise<DoctorActionResult> {
  const parsed = parseDoctorForm(formData);
  if (!parsed.success) return { ok: false, error: "validation" };

  await db
    .update(doctors)
    .set({
      departmentId: parsed.data.departmentId,
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr,
      titleEn: parsed.data.titleEn || null,
      titleAr: parsed.data.titleAr || null,
      bioEn: parsed.data.bioEn || null,
      bioAr: parsed.data.bioAr || null,
      slotDurationMinutes: parsed.data.slotDurationMinutes,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(doctors.id, id));

  revalidatePath("/[locale]/admin/doctors", "page");
  revalidatePath("/[locale]/admin/doctors/[id]", "page");
  return { ok: true, id };
}

export async function deleteDoctor(id: string): Promise<DoctorActionResult> {
  try {
    await db.delete(doctors).where(eq(doctors.id, id));
  } catch (error) {
    if (isForeignKeyViolation(error)) return { ok: false, error: "has_appointments" };
    console.error("deleteDoctor failed", error);
    return { ok: false, error: "unknown" };
  }
  revalidatePath("/[locale]/admin/doctors", "page");
  return { ok: true };
}

const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function addAvailability(doctorId: string, formData: FormData): Promise<DoctorActionResult> {
  const parsed = availabilitySchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) return { ok: false, error: "validation" };
  if (parsed.data.startTime >= parsed.data.endTime) return { ok: false, error: "invalid_range" };

  await db.insert(doctorAvailability).values({ doctorId, ...parsed.data });
  revalidatePath("/[locale]/admin/doctors/[id]", "page");
  return { ok: true };
}

export async function removeAvailability(id: string): Promise<void> {
  await db.delete(doctorAvailability).where(eq(doctorAvailability.id, id));
  revalidatePath("/[locale]/admin/doctors/[id]", "page");
}

const exceptionSchema = z.object({
  exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function addException(doctorId: string, formData: FormData): Promise<DoctorActionResult> {
  const parsed = exceptionSchema.safeParse({
    exceptionDate: formData.get("exceptionDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false, error: "validation" };

  const wholeDay = !parsed.data.startTime || !parsed.data.endTime;

  await db.insert(doctorExceptions).values({
    doctorId,
    exceptionDate: parsed.data.exceptionDate,
    startTime: wholeDay ? null : parsed.data.startTime,
    endTime: wholeDay ? null : parsed.data.endTime,
    reason: parsed.data.reason || null,
  });
  revalidatePath("/[locale]/admin/doctors/[id]", "page");
  return { ok: true };
}

export async function removeException(id: string): Promise<void> {
  await db.delete(doctorExceptions).where(eq(doctorExceptions.id, id));
  revalidatePath("/[locale]/admin/doctors/[id]", "page");
}

function isForeignKeyViolation(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23503",
  );
}
