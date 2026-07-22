# نقرات — Naqarat Medical Booking

A reusable **base template** for a hospital/clinic appointment booking system. Patients book as guests (no
account needed); reception confirms or rejects requests from an admin panel; confirmed appointments trigger
an automatic email via Resend. Bilingual (Arabic RTL default / English), branded, and built to be duplicated
into an independent deployment — separate codebase, database, and server — for every new client.

## Stack

- **Next.js 16** (App Router, Server Actions)
- **Drizzle ORM** + **Neon Postgres** (`@neondatabase/serverless`, HTTP driver)
- **Resend** + **React Email** for transactional email
- **shadcn/ui** (Base UI primitives) + Tailwind CSS v4
- **Vitest** for unit tests

## Project structure

```
app/[locale]/(site)/          public booking flow (home, /book, /book/:dept, /book/:dept/:doctor, confirmation)
app/[locale]/admin/login      admin sign-in (single shared password)
app/[locale]/admin/(protected) admin dashboard: pending requests, appointments, departments, doctors
app/api/slots                 GET available slots for a doctor
proxy.ts                      locale detection/redirect + admin route protection (Next.js 16 "Proxy", formerly middleware)
lib/db/schema.ts              Drizzle schema (departments, doctors, availability, exceptions, appointments)
lib/slots/generate-slots.ts   pure slot-generation algorithm (see lib/slots/generate-slots.test.ts)
lib/actions/                  Server Actions (booking, admin auth, appointments, departments, doctors)
lib/email/                    Resend client + bilingual React Email templates
lib/i18n/                     locale config + ar/en dictionaries
scripts/seed.ts               demo data seed
```

## Admin protection (read before going live)

The admin panel (`/admin`) is protected by a **single shared password**, not per-user accounts. This is a
deliberate MVP tradeoff — it's cheap to set up and enough to keep the panel private, but it gives no
per-user accountability or audit trail, and has only basic in-memory login rate-limiting
(`lib/auth/rate-limit.ts`). If a client needs individual staff logins, swap `lib/auth/admin-session.ts` and
the login page for a real auth provider (NextAuth/Lucia/Clerk) — every admin mutation already goes through
Server Actions in `lib/actions/`, so adding a `session.userId` check there is the only structural change
needed.

## Local setup

1. `npm install`
2. Create a Neon project at [console.neon.tech](https://console.neon.tech) and copy the pooled connection
   string.
3. `cp .env.example .env.local` and fill in every value (see comments in the file for what each one is).
4. `npm run db:migrate` — applies the schema to your Neon database.
5. `npm run db:seed` — inserts demo departments, doctors, schedules, and sample bookings.
6. `npm run dev` — open http://localhost:3000.

Useful scripts:

- `npm run db:generate` — generate a new SQL migration after editing `lib/db/schema.ts`
- `npm run db:studio` — browse the database with Drizzle Studio
- `npm run test` — run the slot-generation unit tests
- `npm run typecheck` / `npm run lint` / `npm run build`

## Replicating this template for a new client

Each hospital gets its own fully independent copy. Checklist:

1. `git clone <template-repo> <client-name> && cd <client-name> && rm -rf .git && git init`
2. Create a **new** Neon project for this client (do not reuse another client's database).
3. `cp .env.example .env.local` and fill in:
   - `DATABASE_URL` — this client's Neon connection string
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — from a Resend account with a **verified sending domain**
   - `ADMIN_PASSWORD` — a strong, unique password for this client
   - `ADMIN_SESSION_SECRET` — generate with `openssl rand -base64 32`
   - `HOSPITAL_NAME_EN` / `HOSPITAL_NAME_AR`, `HOSPITAL_ADDRESS_EN` / `HOSPITAL_ADDRESS_AR`,
     `HOSPITAL_PHONE`, `HOSPITAL_LOGO_URL`, `HOSPITAL_TIMEZONE` (IANA, e.g. `Asia/Riyadh`)
   - `DEFAULT_LOCALE`, `NEXT_PUBLIC_SITE_URL`
4. `npm install && npm run db:migrate`
5. Run `npm run db:seed` only for a demo; for a real go-live, skip it and create the client's actual
   departments/doctors/schedules from the admin panel instead.
6. `npm run build` locally as a sanity check.
7. Push to a new GitHub repo, import into Vercel, set the same environment variables (Production +
   Preview), deploy, and attach the client's domain.
8. Confirm the Resend sending domain is verified for production sends.
9. Run the manual test checklist below against the live URL.
10. Hand off the admin password through a password manager, not chat/email. Keep any client-specific notes
    in a local `CLIENT_NOTES.md` — don't commit client specifics back into the shared template.

## Manual test checklist

Run this after any deployment, and always as the final check when validating the replication steps above
against a brand-new Neon project:

- [ ] `/` redirects to the default locale with correct RTL/LTR layout; language switcher works both ways
- [ ] Department → doctor → date/slot browsing works; only working days show slots
- [ ] A full-day exception blocks the whole day; a partial exception hides only the overlapping slots
- [ ] Submitting a booking with phone only, and with email, both succeed
- [ ] Two tabs booking the same doctor/date/time: the second one fails gracefully and slots refresh
- [ ] `/admin` redirects to `/admin/login` when signed out; wrong password is rejected
- [ ] Confirming a pending request updates its status and sends a correctly formatted, correctly localized
      email
- [ ] Rejecting with "notify patient" checked vs. unchecked only sends an email when checked
- [ ] Temporarily breaking `RESEND_API_KEY` and confirming a booking still updates the database and shows a
      clear "email failed" warning instead of crashing
- [ ] Creating a department, doctor, weekly schedule, and exception entirely from the admin panel and
      seeing it reflected immediately in the public booking flow
- [ ] Editing a doctor's schedule removes future slots for the removed day without touching existing
      confirmed appointments
- [ ] The confirmed-appointments list filters correctly by department and doctor
