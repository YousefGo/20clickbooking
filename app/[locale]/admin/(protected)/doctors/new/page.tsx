import { notFound } from "next/navigation";
import { getAllDepartments } from "@/lib/db/queries/departments";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { DoctorForm } from "@/components/admin/doctor-form";

export default async function NewDoctorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const departments = await getAllDepartments();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-black text-navy">{dict.admin.doctors.add}</h1>
      <DoctorForm locale={locale as Locale} dict={dict} departments={departments} />
    </div>
  );
}
