"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBooking, type CreateBookingResult } from "@/lib/actions/booking";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type SlotsByDate = Record<string, string[]>;

export function BookingFlow({
  locale,
  dict,
  timezone,
  doctor,
}: {
  locale: Locale;
  dict: Dictionary;
  timezone: string;
  doctor: { id: string; nameAr: string; nameEn: string; slotDurationMinutes: number };
}) {
  const router = useRouter();
  const [slotsByDate, setSlotsByDate] = useState<SlotsByDate>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState<CreateBookingResult | null, FormData>(
    createBooking,
    null,
  );

  function fetchSlots() {
    return fetch(`/api/slots?doctorId=${doctor.id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setSlotsByDate(data.slots ?? {});
        setSelectedDate((current) => current ?? Object.keys(data.slots ?? {})[0] ?? null);
      })
      .catch(() => toast.error(dict.common.error))
      .finally(() => setIsLoadingSlots(false));
  }

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor.id]);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      router.push(`/${locale}/booking-confirmation/${state.appointmentId}`);
      return;
    }
    if (state.error === "slot_taken") {
      toast.error(dict.booking.slotTaken);
      fetchSlots().finally(() => setSelectedSlot(null));
    } else {
      toast.error(dict.booking.bookingFailed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const dates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: timezone,
      }),
    [locale, timezone],
  );
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
    [locale],
  );

  function formatTime(time: string) {
    const [h, m] = time.split(":").map(Number);
    return timeFormatter.format(new Date(Date.UTC(2000, 0, 1, h, m)));
  }

  const slotsForSelectedDate = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  function handleSubmit(formData: FormData) {
    if (!selectedDate || !selectedSlot) {
      toast.error(dict.booking.selectSlotFirst);
      return;
    }
    formData.set("doctorId", doctor.id);
    formData.set("appointmentDate", selectedDate);
    formData.set("startTime", selectedSlot);
    formData.set("locale", locale);
    startTransition(() => formAction(formData));
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">{dict.booking.selectDate}</h2>
        {isLoadingSlots ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {dict.booking.loadingSlots}
          </p>
        ) : dates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.booking.noSlotsAvailable}</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedSlot(null);
                }}
                className={cn(
                  "shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                  date === selectedDate
                    ? "border-navy bg-navy text-white"
                    : slotsByDate[date].length === 0
                      ? "border-border text-muted-foreground/50"
                      : "border-border text-navy hover:border-navy",
                )}
              >
                {dateFormatter.format(new Date(`${date}T00:00:00Z`))}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedDate ? (
        <section>
          <h2 className="mb-3 font-heading text-lg font-bold text-navy">{dict.booking.availableSlots}</h2>
          {slotsForSelectedDate.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict.booking.noSlotsAvailable}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slotsForSelectedDate.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                    slot === selectedSlot
                      ? "border-gold bg-gold text-navy"
                      : "border-border text-navy hover:border-gold",
                  )}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">{dict.booking.patientDetails}</h2>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="patientName">{dict.booking.patientName}</Label>
              <Input id="patientName" name="patientName" required maxLength={120} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="patientPhone">{dict.booking.patientPhone}</Label>
              <Input id="patientPhone" name="patientPhone" type="tel" dir="ltr" maxLength={30} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="patientEmail">{dict.booking.patientEmail}</Label>
            <Input id="patientEmail" name="patientEmail" type="email" dir="ltr" maxLength={160} />
            <p className="text-xs text-muted-foreground">{dict.booking.phoneOrEmailHint}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">{dict.booking.notes}</Label>
            <Textarea id="notes" name="notes" placeholder={dict.booking.notesPlaceholder} maxLength={1000} />
          </div>

          <Button type="submit" size="lg" disabled={isPending} className="self-start">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {dict.booking.submitting}
              </>
            ) : (
              dict.booking.submitBooking
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
