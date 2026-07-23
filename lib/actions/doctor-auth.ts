"use server";

import { compare } from "bcryptjs";
import { cookies, headers } from "next/headers";
import { getDoctorByEmail } from "@/lib/db/queries/doctors";
import { DOCTOR_SESSION_COOKIE, createDoctorSessionToken, verifyDoctorSessionToken } from "@/lib/auth/doctor-session";
import { isRateLimited } from "@/lib/auth/rate-limit";

export type DoctorLoginResult = { ok: true } | { ok: false; error: "invalid" | "rate_limited" };

export async function doctorLogin(email: string, password: string): Promise<DoctorLoginResult> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(`doctor-login:${ip}`)) {
    return { ok: false, error: "rate_limited" };
  }

  const doctor = await getDoctorByEmail(email);
  if (!doctor || !doctor.passwordHash || !doctor.isActive) {
    return { ok: false, error: "invalid" };
  }

  const passwordMatches = await compare(password, doctor.passwordHash);
  if (!passwordMatches) {
    return { ok: false, error: "invalid" };
  }

  const token = await createDoctorSessionToken(doctor.id);
  const cookieStore = await cookies();
  cookieStore.set(DOCTOR_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true };
}

export async function doctorLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DOCTOR_SESSION_COOKIE);
}

/** Reads and verifies the doctor session cookie for the current request. Returns the doctor id, or null if absent/invalid. */
export async function getDoctorSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DOCTOR_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyDoctorSessionToken(token);
}
