import {
  addDaysToDateString,
  dateRangeStrings,
  dayOfWeekForDate,
  minutesToTime,
  nowInTimezone,
  timeToMinutes,
} from "@/lib/utils/datetime";

export interface AvailabilityWindow {
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // "HH:MM" or "HH:MM:SS"
  endTime: string;
}

export interface DoctorException {
  exceptionDate: string; // "YYYY-MM-DD"
  startTime: string | null; // null + null => whole day blocked
  endTime: string | null;
}

export interface BookedSlot {
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM" or "HH:MM:SS"
}

export interface GenerateSlotsParams {
  slotDurationMinutes: number;
  availability: AvailabilityWindow[];
  exceptions: DoctorException[];
  bookedSlots: BookedSlot[];
  fromDate: string; // "YYYY-MM-DD"
  toDate: string; // "YYYY-MM-DD", inclusive
  timezone: string;
  now?: Date;
}

/** date ("YYYY-MM-DD") -> list of available slot start times ("HH:MM"), ascending. */
export type SlotsByDate = Record<string, string[]>;

export function generateAvailableSlots(params: GenerateSlotsParams): SlotsByDate {
  const { slotDurationMinutes, availability, exceptions, bookedSlots, fromDate, toDate, timezone } =
    params;

  const now = nowInTimezone(timezone, params.now);

  const bookedSet = new Set(bookedSlots.map((slot) => `${slot.appointmentDate}|${timeToMinutes(slot.startTime)}`));

  const availabilityByDay = new Map<number, AvailabilityWindow[]>();
  for (const window of availability) {
    const list = availabilityByDay.get(window.dayOfWeek) ?? [];
    list.push(window);
    availabilityByDay.set(window.dayOfWeek, list);
  }

  const exceptionsByDate = new Map<string, DoctorException[]>();
  for (const exception of exceptions) {
    const list = exceptionsByDate.get(exception.exceptionDate) ?? [];
    list.push(exception);
    exceptionsByDate.set(exception.exceptionDate, list);
  }

  const result: SlotsByDate = {};

  for (const date of dateRangeStrings(fromDate, toDate)) {
    const dayExceptions = exceptionsByDate.get(date) ?? [];
    const isFullyBlocked = dayExceptions.some((exc) => exc.startTime === null && exc.endTime === null);
    if (isFullyBlocked) {
      result[date] = [];
      continue;
    }

    const windows = availabilityByDay.get(dayOfWeekForDate(date)) ?? [];
    const slots: string[] = [];

    for (const window of windows) {
      const windowStart = timeToMinutes(window.startTime);
      const windowEnd = timeToMinutes(window.endTime);

      for (
        let slotStart = windowStart;
        slotStart + slotDurationMinutes <= windowEnd;
        slotStart += slotDurationMinutes
      ) {
        const slotEnd = slotStart + slotDurationMinutes;

        const overlapsPartialException = dayExceptions.some((exc) => {
          if (exc.startTime === null || exc.endTime === null) return false;
          const excStart = timeToMinutes(exc.startTime);
          const excEnd = timeToMinutes(exc.endTime);
          return slotStart < excEnd && slotEnd > excStart;
        });
        if (overlapsPartialException) continue;

        if (bookedSet.has(`${date}|${slotStart}`)) continue;

        if (date === now.date && slotStart < now.minutes) continue;

        slots.push(minutesToTime(slotStart));
      }
    }

    result[date] = slots.sort();
  }

  return result;
}

/** Convenience helper: today's date plus `days` more days, in "YYYY-MM-DD", for building a slot-lookup date range. */
export function defaultSlotRange(timezone: string, days = 14, now?: Date) {
  const { date } = nowInTimezone(timezone, now);
  return { from: date, to: addDaysToDateString(date, days) };
}
