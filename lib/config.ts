function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const hospitalConfig = {
  nameEn: process.env.HOSPITAL_NAME_EN ?? "City Hospital",
  nameAr: process.env.HOSPITAL_NAME_AR ?? "مستشفى المدينة",
  addressEn: process.env.HOSPITAL_ADDRESS_EN ?? "",
  addressAr: process.env.HOSPITAL_ADDRESS_AR ?? "",
  phone: process.env.HOSPITAL_PHONE ?? "",
  logoUrl: process.env.HOSPITAL_LOGO_URL ?? "",
  timezone: process.env.HOSPITAL_TIMEZONE ?? "Asia/Riyadh",
};

export const appConfig = {
  defaultLocale: (process.env.DEFAULT_LOCALE as "ar" | "en") ?? "ar",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export function getResendConfig() {
  return {
    apiKey: required("RESEND_API_KEY"),
    fromEmail: required("RESEND_FROM_EMAIL"),
  };
}

export function getAdminConfig() {
  return {
    password: required("ADMIN_PASSWORD"),
    sessionSecret: required("ADMIN_SESSION_SECRET"),
  };
}
