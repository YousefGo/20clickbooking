"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { departments, doctors } from "@/lib/db/schema";

const departmentSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "invalid_slug"),
  nameEn: z.string().trim().min(2).max(120),
  nameAr: z.string().trim().min(2).max(120),
  descriptionEn: z.string().trim().max(500).optional().or(z.literal("")),
  descriptionAr: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type DepartmentActionResult = { ok: true } | { ok: false; error: string };

function parseDepartmentForm(formData: FormData) {
  return departmentSchema.safeParse({
    slug: formData.get("slug"),
    nameEn: formData.get("nameEn"),
    nameAr: formData.get("nameAr"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionAr: formData.get("descriptionAr"),
    isActive: formData.get("isActive") === "on",
  });
}

export async function createDepartment(formData: FormData): Promise<DepartmentActionResult> {
  const parsed = parseDepartmentForm(formData);
  if (!parsed.success) return { ok: false, error: "validation" };

  try {
    await db.insert(departments).values({
      slug: parsed.data.slug,
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr,
      descriptionEn: parsed.data.descriptionEn || null,
      descriptionAr: parsed.data.descriptionAr || null,
      isActive: parsed.data.isActive,
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "slug_taken" };
    console.error("createDepartment failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/[locale]/admin/departments", "page");
  return { ok: true };
}

export async function updateDepartment(id: string, formData: FormData): Promise<DepartmentActionResult> {
  const parsed = parseDepartmentForm(formData);
  if (!parsed.success) return { ok: false, error: "validation" };

  try {
    await db
      .update(departments)
      .set({
        slug: parsed.data.slug,
        nameEn: parsed.data.nameEn,
        nameAr: parsed.data.nameAr,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionAr: parsed.data.descriptionAr || null,
        isActive: parsed.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id));
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "slug_taken" };
    console.error("updateDepartment failed", error);
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/[locale]/admin/departments", "page");
  return { ok: true };
}

export async function deleteDepartment(id: string): Promise<DepartmentActionResult> {
  const [doctor] = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.departmentId, id)).limit(1);
  if (doctor) {
    return { ok: false, error: "has_doctors" };
  }

  await db.delete(departments).where(eq(departments.id, id));
  revalidatePath("/[locale]/admin/departments", "page");
  return { ok: true };
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505",
  );
}
