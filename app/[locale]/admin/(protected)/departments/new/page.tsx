import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { DepartmentForm } from "@/components/admin/department-form";

export default async function NewDepartmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-black text-navy">{dict.admin.departments.add}</h1>
      <DepartmentForm locale={locale as Locale} dict={dict} />
    </div>
  );
}
