import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { appointments, departments, doctorAvailability, doctorExceptions, doctors } from "../lib/db/schema";
import { addDaysToDateString } from "../lib/utils/datetime";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
  throw new Error("Refusing to seed a production environment. Pass --force if you really mean it.");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  console.log("Clearing existing demo data...");
  await db.delete(appointments);
  await db.delete(doctorExceptions);
  await db.delete(doctorAvailability);
  await db.delete(doctors);
  await db.delete(departments);

  console.log("Inserting departments...");
  const [cardiology, dermatology, pediatrics, general] = await db
    .insert(departments)
    .values([
      {
        slug: "cardiology",
        nameEn: "Cardiology",
        nameAr: "أمراض القلب",
        descriptionEn: "Diagnosis and treatment of heart conditions.",
        descriptionAr: "تشخيص وعلاج أمراض القلب والأوعية الدموية.",
      },
      {
        slug: "dermatology",
        nameEn: "Dermatology",
        nameAr: "الجلدية",
        descriptionEn: "Skin, hair, and nail care.",
        descriptionAr: "العناية بالجلد والشعر والأظافر.",
      },
      {
        slug: "pediatrics",
        nameEn: "Pediatrics",
        nameAr: "طب الأطفال",
        descriptionEn: "Medical care for infants, children, and adolescents.",
        descriptionAr: "الرعاية الطبية للرضع والأطفال والمراهقين.",
      },
      {
        slug: "general-medicine",
        nameEn: "General Medicine",
        nameAr: "الطب العام",
        descriptionEn: "General checkups and everyday health concerns.",
        descriptionAr: "الفحوصات العامة والمشاكل الصحية اليومية.",
      },
    ])
    .returning();

  console.log("Inserting doctors...");
  const [drAhmad, drSara, drNoura, drKhaled, drLayla, drOmar, drHana, drFaisal] = await db
    .insert(doctors)
    .values([
      {
        departmentId: cardiology.id,
        nameEn: "Dr. Ahmad Al-Farsi",
        nameAr: "د. أحمد الفارسي",
        titleEn: "Consultant Cardiologist",
        titleAr: "استشاري أمراض القلب",
        slotDurationMinutes: 30,
      },
      {
        departmentId: cardiology.id,
        nameEn: "Dr. Sara Al-Amin",
        nameAr: "د. سارة الأمين",
        titleEn: "Cardiologist",
        titleAr: "أخصائية أمراض القلب",
        slotDurationMinutes: 20,
      },
      {
        departmentId: dermatology.id,
        nameEn: "Dr. Noura Al-Sayed",
        nameAr: "د. نورة السيد",
        titleEn: "Consultant Dermatologist",
        titleAr: "استشارية أمراض جلدية",
        slotDurationMinutes: 30,
      },
      {
        departmentId: dermatology.id,
        nameEn: "Dr. Khaled Al-Otaibi",
        nameAr: "د. خالد العتيبي",
        titleEn: "Dermatologist",
        titleAr: "أخصائي أمراض جلدية",
        slotDurationMinutes: 20,
      },
      {
        departmentId: pediatrics.id,
        nameEn: "Dr. Layla Hassan",
        nameAr: "د. ليلى حسن",
        titleEn: "Consultant Pediatrician",
        titleAr: "استشارية طب أطفال",
        slotDurationMinutes: 30,
      },
      {
        departmentId: pediatrics.id,
        nameEn: "Dr. Omar Al-Rashid",
        nameAr: "د. عمر الراشد",
        titleEn: "Pediatrician",
        titleAr: "أخصائي طب أطفال",
        slotDurationMinutes: 30,
      },
      {
        departmentId: general.id,
        nameEn: "Dr. Hana Ibrahim",
        nameAr: "د. هناء إبراهيم",
        titleEn: "General Practitioner",
        titleAr: "طبيبة عامة",
        slotDurationMinutes: 20,
      },
      {
        departmentId: general.id,
        nameEn: "Dr. Faisal Al-Dosari",
        nameAr: "د. فيصل الدوسري",
        titleEn: "General Practitioner",
        titleAr: "طبيب عام",
        slotDurationMinutes: 20,
      },
    ])
    .returning();

  console.log("Inserting weekly availability...");
  await db.insert(doctorAvailability).values([
    // Dr. Ahmad: Sun/Tue/Thu 09:00-14:00
    { doctorId: drAhmad.id, dayOfWeek: 0, startTime: "09:00", endTime: "14:00" },
    { doctorId: drAhmad.id, dayOfWeek: 2, startTime: "09:00", endTime: "14:00" },
    { doctorId: drAhmad.id, dayOfWeek: 4, startTime: "09:00", endTime: "14:00" },
    // Dr. Sara: split shift Mon/Wed 09:00-12:00 and 17:00-20:00
    { doctorId: drSara.id, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
    { doctorId: drSara.id, dayOfWeek: 1, startTime: "17:00", endTime: "20:00" },
    { doctorId: drSara.id, dayOfWeek: 3, startTime: "09:00", endTime: "12:00" },
    { doctorId: drSara.id, dayOfWeek: 3, startTime: "17:00", endTime: "20:00" },
    // Dr. Noura: Sat/Mon/Wed 10:00-15:00
    { doctorId: drNoura.id, dayOfWeek: 6, startTime: "10:00", endTime: "15:00" },
    { doctorId: drNoura.id, dayOfWeek: 1, startTime: "10:00", endTime: "15:00" },
    { doctorId: drNoura.id, dayOfWeek: 3, startTime: "10:00", endTime: "15:00" },
    // Dr. Khaled: Sun/Tue 16:00-20:00
    { doctorId: drKhaled.id, dayOfWeek: 0, startTime: "16:00", endTime: "20:00" },
    { doctorId: drKhaled.id, dayOfWeek: 2, startTime: "16:00", endTime: "20:00" },
    // Dr. Layla: Sun-Thu 08:00-12:00
    { doctorId: drLayla.id, dayOfWeek: 0, startTime: "08:00", endTime: "12:00" },
    { doctorId: drLayla.id, dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
    { doctorId: drLayla.id, dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
    { doctorId: drLayla.id, dayOfWeek: 3, startTime: "08:00", endTime: "12:00" },
    { doctorId: drLayla.id, dayOfWeek: 4, startTime: "08:00", endTime: "12:00" },
    // Dr. Omar: Sat/Mon/Wed 13:00-18:00
    { doctorId: drOmar.id, dayOfWeek: 6, startTime: "13:00", endTime: "18:00" },
    { doctorId: drOmar.id, dayOfWeek: 1, startTime: "13:00", endTime: "18:00" },
    { doctorId: drOmar.id, dayOfWeek: 3, startTime: "13:00", endTime: "18:00" },
    // Dr. Hana: Sun-Thu 09:00-13:00
    { doctorId: drHana.id, dayOfWeek: 0, startTime: "09:00", endTime: "13:00" },
    { doctorId: drHana.id, dayOfWeek: 1, startTime: "09:00", endTime: "13:00" },
    { doctorId: drHana.id, dayOfWeek: 2, startTime: "09:00", endTime: "13:00" },
    { doctorId: drHana.id, dayOfWeek: 3, startTime: "09:00", endTime: "13:00" },
    { doctorId: drHana.id, dayOfWeek: 4, startTime: "09:00", endTime: "13:00" },
    // Dr. Faisal: Sat/Sun/Tue/Thu 15:00-19:00
    { doctorId: drFaisal.id, dayOfWeek: 6, startTime: "15:00", endTime: "19:00" },
    { doctorId: drFaisal.id, dayOfWeek: 0, startTime: "15:00", endTime: "19:00" },
    { doctorId: drFaisal.id, dayOfWeek: 2, startTime: "15:00", endTime: "19:00" },
    { doctorId: drFaisal.id, dayOfWeek: 4, startTime: "15:00", endTime: "19:00" },
  ]);

  console.log("Inserting exceptions...");
  await db.insert(doctorExceptions).values([
    { doctorId: drAhmad.id, exceptionDate: addDaysToDateString(today(), 7), reason: "Annual leave" },
    {
      doctorId: drNoura.id,
      exceptionDate: addDaysToDateString(today(), 3),
      startTime: "12:00",
      endTime: "14:00",
      reason: "Conference",
    },
    { doctorId: drLayla.id, exceptionDate: addDaysToDateString(today(), 5), reason: "Training day" },
  ]);

  console.log("Inserting sample appointments...");
  await db.insert(appointments).values([
    {
      doctorId: drAhmad.id,
      departmentId: cardiology.id,
      patientName: "Mohammed Al-Zahrani",
      patientPhone: "+966501112233",
      patientEmail: "mohammed@example.com",
      locale: "ar",
      appointmentDate: addDaysToDateString(today(), 1),
      startTime: "09:00",
      endTime: "09:30",
      status: "pending",
      notes: "First visit, chest pain follow-up.",
    },
    {
      doctorId: drSara.id,
      departmentId: cardiology.id,
      patientName: "Fatimah Al-Otaibi",
      patientPhone: "+966502223344",
      locale: "ar",
      appointmentDate: addDaysToDateString(today(), 2),
      startTime: "17:00",
      endTime: "17:20",
      status: "pending",
    },
    {
      doctorId: drNoura.id,
      departmentId: dermatology.id,
      patientName: "John Smith",
      patientEmail: "john@example.com",
      locale: "en",
      appointmentDate: addDaysToDateString(today(), 1),
      startTime: "10:00",
      endTime: "10:30",
      status: "confirmed",
      confirmedAt: new Date(),
    },
    {
      doctorId: drLayla.id,
      departmentId: pediatrics.id,
      patientName: "Layan Al-Harbi",
      patientPhone: "+966503334455",
      patientEmail: "layan@example.com",
      locale: "ar",
      appointmentDate: addDaysToDateString(today(), 4),
      startTime: "08:30",
      endTime: "09:00",
      status: "confirmed",
      confirmedAt: new Date(),
    },
    {
      doctorId: drHana.id,
      departmentId: general.id,
      patientName: "Emily Johnson",
      patientEmail: "emily@example.com",
      locale: "en",
      appointmentDate: addDaysToDateString(today(), 2),
      startTime: "09:20",
      endTime: "09:40",
      status: "rejected",
      rejectedAt: new Date(),
      adminNotes: "Doctor unavailable, asked to rebook.",
    },
    {
      doctorId: drOmar.id,
      departmentId: pediatrics.id,
      patientName: "Rakan Al-Qahtani",
      patientPhone: "+966504445566",
      locale: "ar",
      appointmentDate: addDaysToDateString(today(), 6),
      startTime: "13:00",
      endTime: "13:30",
      status: "pending",
    },
  ]);

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
