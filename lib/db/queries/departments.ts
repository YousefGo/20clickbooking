import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";

export function getActiveDepartments() {
  return db
    .select()
    .from(departments)
    .where(eq(departments.isActive, true))
    .orderBy(asc(departments.nameEn));
}

export function getAllDepartments() {
  return db.select().from(departments).orderBy(asc(departments.nameEn));
}

export async function getDepartmentBySlug(slug: string) {
  const rows = await db.select().from(departments).where(eq(departments.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getDepartmentById(id: string) {
  const rows = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return rows[0] ?? null;
}
