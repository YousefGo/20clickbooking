"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

const ALL = "all";

export function AppointmentsFilters({
  locale,
  dict,
  departments,
  doctors,
}: {
  locale: Locale;
  dict: Dictionary;
  departments: { id: string; nameEn: string; nameAr: string }[];
  doctors: { id: string; nameEn: string; nameAr: string; departmentId: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const departmentId = searchParams.get("departmentId") ?? ALL;
  const doctorId = searchParams.get("doctorId") ?? ALL;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    if (key === "departmentId") params.delete("doctorId");
    router.push(`/${locale}/admin/appointments?${params.toString()}`);
  }

  const filteredDoctors = departmentId === ALL ? doctors : doctors.filter((d) => d.departmentId === departmentId);

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <Select value={departmentId} onValueChange={(value) => updateParam("departmentId", value ?? ALL)}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder={dict.admin.appointments.filterByDepartment} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.admin.appointments.allDepartments}</SelectItem>
          {departments.map((department) => (
            <SelectItem key={department.id} value={department.id}>
              {locale === "ar" ? department.nameAr : department.nameEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={doctorId} onValueChange={(value) => updateParam("doctorId", value ?? ALL)}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder={dict.admin.appointments.filterByDoctor} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.admin.appointments.allDoctors}</SelectItem>
          {filteredDoctors.map((doctor) => (
            <SelectItem key={doctor.id} value={doctor.id}>
              {locale === "ar" ? doctor.nameAr : doctor.nameEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
