"use server";

import { cookies, headers } from "next/headers";
import { getAdminConfig } from "@/lib/config";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "@/lib/auth/admin-session";
import { isRateLimited } from "@/lib/auth/rate-limit";

export type AdminLoginResult = { ok: true } | { ok: false; error: "invalid" | "rate_limited" };

export async function adminLogin(password: string): Promise<AdminLoginResult> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(`admin-login:${ip}`)) {
    return { ok: false, error: "rate_limited" };
  }

  const { password: adminPassword } = getAdminConfig();
  if (password !== adminPassword) {
    return { ok: false, error: "invalid" };
  }

  const token = await createAdminSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
