import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "doctor_session";
const SESSION_DURATION = "7d";

function getSecretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set. Copy .env.example to .env.local and fill it in.");
  }
  return new TextEncoder().encode(secret);
}

export async function createDoctorSessionToken(doctorId: string): Promise<string> {
  return new SignJWT({ role: "doctor", doctorId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function verifyDoctorSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "doctor" || typeof payload.doctorId !== "string") return null;
    return payload.doctorId;
  } catch {
    return null;
  }
}

export const DOCTOR_SESSION_COOKIE = COOKIE_NAME;
