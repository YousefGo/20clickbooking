import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import ExcelJS from "exceljs";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/admin-session";
import { getAllAppointmentsWithDetails } from "@/lib/db/queries/appointments";
import { filterArchiveRows, parseArchiveFilters } from "@/lib/archive-filters";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const isValid = token ? await verifyAdminSessionToken(token) : false;
  if (!isValid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const filters = parseArchiveFilters({
    departmentId: searchParams.get("departmentId") ?? undefined,
    doctorId: searchParams.get("doctorId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });

  const rows = filterArchiveRows(await getAllAppointmentsWithDetails(), filters);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Appointments");
  sheet.columns = [
    { header: "Reference", key: "reference", width: 12 },
    { header: "Patient", key: "patient", width: 24 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Email", key: "email", width: 26 },
    { header: "Doctor", key: "doctor", width: 22 },
    { header: "Department", key: "department", width: 20 },
    { header: "Date", key: "date", width: 12 },
    { header: "Time", key: "time", width: 10 },
    { header: "Status", key: "status", width: 12 },
    { header: "Notes", key: "notes", width: 30 },
  ];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003262" } };

  for (const row of rows) {
    sheet.addRow({
      reference: row.appointment.id.slice(0, 8).toUpperCase(),
      patient: row.appointment.patientName,
      phone: row.appointment.patientPhone ?? "",
      email: row.appointment.patientEmail ?? "",
      doctor: row.doctor.nameEn,
      department: row.department.nameEn,
      date: row.appointment.appointmentDate,
      time: row.appointment.startTime,
      status: row.appointment.status,
      notes: row.appointment.notes ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `appointments-archive-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
