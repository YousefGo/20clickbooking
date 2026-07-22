import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getAllDepartments } from "@/lib/db/queries/departments";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DepartmentRowActions } from "@/components/admin/department-row-actions";

export default async function DepartmentsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const departments = await getAllDepartments();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-black text-navy">{dict.admin.departments.title}</h1>
        <Button render={<Link href={`/${locale}/admin/departments/new`} />}>
          <Plus className="size-4" />
          {dict.admin.departments.add}
        </Button>
      </div>

      {departments.length === 0 ? (
        <p className="text-muted-foreground">{dict.admin.departments.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {departments.map((department) => (
            <div
              key={department.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="inline-flex items-center gap-2 font-heading font-bold text-navy">
                  {locale === "ar" ? department.nameAr : department.nameEn}
                  {!department.isActive ? (
                    <Badge variant="secondary">{dict.common.inactive}</Badge>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground" dir="ltr">
                  /{department.slug}
                </span>
              </div>
              <DepartmentRowActions
                locale={locale as Locale}
                dict={dict}
                departmentId={department.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
