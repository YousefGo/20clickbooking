"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

const ALL = "all";

export function ArchiveFilters({
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
  const status = searchParams.get("status") ?? ALL;
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function navigate(params: URLSearchParams) {
    router.push(`/${locale}/admin/archive?${params.toString()}`);
  }

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL || !value) params.delete(key);
    else params.set(key, value);
    if (key === "departmentId") params.delete("doctorId");
    navigate(params);
  }

  function applyTextFilters(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of [
      ["from", from],
      ["to", to],
      ["q", q],
    ] as const) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    navigate(params);
  }

  const filteredDoctors = departmentId === ALL ? doctors : doctors.filter((d) => d.departmentId === departmentId);

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
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

        <Select value={status} onValueChange={(value) => updateParam("status", value ?? ALL)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={dict.admin.archive.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{dict.admin.archive.allStatuses}</SelectItem>
            <SelectItem value="pending">{dict.status.pending}</SelectItem>
            <SelectItem value="confirmed">{dict.status.confirmed}</SelectItem>
            <SelectItem value="rejected">{dict.status.rejected}</SelectItem>
            <SelectItem value="cancelled">{dict.status.cancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <form className="flex flex-wrap items-end gap-3" onSubmit={applyTextFilters}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{dict.admin.archive.from}</label>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{dict.admin.archive.to}</label>
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{dict.admin.archive.searchLabel}</label>
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={dict.admin.archive.searchPlaceholder}
            className="w-64"
            dir="ltr"
          />
        </div>
        <Button type="submit" size="lg">
          <Search className="size-4" />
          {dict.common.search}
        </Button>
      </form>
    </div>
  );
}
