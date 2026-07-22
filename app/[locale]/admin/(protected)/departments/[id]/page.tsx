import { notFound } from "next/navigation";
import { getDepartmentById } from "@/lib/db/queries/departments";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { DepartmentForm } from "@/components/admin/department-form";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const department = await getDepartmentById(id);
  if (!department) notFound();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-black text-navy">{dict.admin.departments.edit}</h1>
      <DepartmentForm locale={locale as Locale} dict={dict} initial={department} />
    </div>
  );
}
