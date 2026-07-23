ALTER TABLE "doctors" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "password_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "doctors_email_uq" ON "doctors" USING btree ("email");