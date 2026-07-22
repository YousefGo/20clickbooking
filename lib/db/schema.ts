import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
]);

export const localeEnum = pgEnum("locale", ["ar", "en"]);

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const doctors = pgTable(
  "doctors",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    titleEn: text("title_en"),
    titleAr: text("title_ar"),
    bioEn: text("bio_en"),
    bioAr: text("bio_ar"),
    photoUrl: text("photo_url"),
    slotDurationMinutes: integer("slot_duration_minutes").notNull().default(30),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("doctors_department_id_idx").on(table.departmentId)],
);

export const doctorAvailability = pgTable(
  "doctor_availability",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    dayOfWeek: smallint("day_of_week").notNull(), // 0 = Sunday .. 6 = Saturday
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [index("doctor_availability_doctor_id_idx").on(table.doctorId)],
);

export const doctorExceptions = pgTable(
  "doctor_exceptions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "cascade" }),
    exceptionDate: date("exception_date").notNull(),
    startTime: time("start_time"),
    endTime: time("end_time"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("doctor_exceptions_doctor_date_idx").on(table.doctorId, table.exceptionDate),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "restrict" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    patientName: text("patient_name").notNull(),
    patientPhone: text("patient_phone"),
    patientEmail: text("patient_email"),
    locale: localeEnum("locale").notNull().default("ar"),
    appointmentDate: date("appointment_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    adminNotes: text("admin_notes"),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    emailError: text("email_error"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("appointments_doctor_date_idx").on(table.doctorId, table.appointmentDate),
    index("appointments_status_idx").on(table.status),
    uniqueIndex("appointments_doctor_slot_active_uq")
      .on(table.doctorId, table.appointmentDate, table.startTime)
      .where(sql`${table.status} IN ('pending','confirmed')`),
  ],
);
