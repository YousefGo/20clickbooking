import { NextRequest, NextResponse } from "next/server";
import { hospitalConfig } from "@/lib/config";
import { getBookedSlots } from "@/lib/db/queries/appointments";
import { getDoctorAvailability, getDoctorExceptionsInRange, getDoctorById } from "@/lib/db/queries/doctors";
import { defaultSlotRange, generateAvailableSlots } from "@/lib/slots/generate-slots";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const doctorId = request.nextUrl.searchParams.get("doctorId");
  if (!doctorId) {
    return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
  }

  const doctor = await getDoctorById(doctorId);
  if (!doctor || !doctor.isActive) {
    return NextResponse.json({ error: "doctor not found" }, { status: 404 });
  }

  const { from, to } = defaultSlotRange(hospitalConfig.timezone, 21);

  const [availability, exceptions, bookedSlots] = await Promise.all([
    getDoctorAvailability(doctor.id),
    getDoctorExceptionsInRange(doctor.id, from, to),
    getBookedSlots(doctor.id, from, to),
  ]);

  const slots = generateAvailableSlots({
    slotDurationMinutes: doctor.slotDurationMinutes,
    availability,
    exceptions,
    bookedSlots,
    fromDate: from,
    toDate: to,
    timezone: hospitalConfig.timezone,
  });

  return NextResponse.json({ from, to, slots });
}
