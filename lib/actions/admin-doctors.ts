"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { doctorAvailability, doctorExceptions, doctors } from "@/lib/db/schema";
import { getDoctorById } from "@/lib/db/queries/doctors";

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
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  password: z.string().min(8).max(72).optional().or(z.literal("")),
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
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function createDoctor(formData: FormData): Promise<DoctorActionResult> {
  const parsed = parseDoctorForm(formData);
  if (!parsed.success) return { ok: false, error: "validation" };

  const email = parsed.data.email || "";
  const password = parsed.data.password || "";
  if (Boolean(email) !== Boolean(password)) {
    return { ok: false, error: "portal_credentials_incomplete" };
  }

  try {
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
        email: email || null,
        passwordHash: password ? await hash(password, 10) : null,
      })
      .returning({ id: doctors.id });

    revalidatePath("/[locale]/admin/doctors", "page");
    return { ok: true, id: row.id };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "email_taken" };
    throw error;
  }
}

export async function updateDoctor(id: string, formData: FormData): Promise<DoctorActionResult> {
  const parsed = parseDoctorForm(formData);
  if (!parsed.success) return { ok: false, error: "validation" };

  const existing = await getDoctorById(id);
  if (!existing) return { ok: false, error: "not_found" };

  const email = parsed.data.email || "";
  const password = parsed.data.password || "";
  const hasExistingPassword = Boolean(existing.passwordHash);
  if (email && !password && !hasExistingPassword) {
    return { ok: false, error: "portal_credentials_incomplete" };
  }

  try {
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
        email: email || null,
        passwordHash: !email ? null : password ? await hash(password, 10) : existing.passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, id));
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "email_taken" };
    throw error;
  }

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

/** Postgres error code for a thrown value, unwrapping Drizzle's DrizzleQueryError which nests the driver error in `.cause`. */
function pgErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof (error as { code?: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  if ("cause" in error) return pgErrorCode((error as { cause?: unknown }).cause);
  return undefined;
}

function isForeignKeyViolation(error: unknown): boolean {
  return pgErrorCode(error) === "23503";
}

function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === "23505";
}
