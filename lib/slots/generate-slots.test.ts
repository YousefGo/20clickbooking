import { describe, expect, it } from "vitest";
import { generateAvailableSlots } from "./generate-slots";

// 2024-01-07 is a Sunday (dayOfWeek 0), so the week below is Sun..Sat = 2024-01-07..2024-01-13.
const SUNDAY = "2024-01-07";
const MONDAY = "2024-01-08";
const TUESDAY = "2024-01-09";

describe("generateAvailableSlots", () => {
  it("generates evenly spaced slots for a normal working day", () => {
    const result = generateAvailableSlots({
      slotDurationMinutes: 30,
      availability: [{ dayOfWeek: 0, startTime: "09:00", endTime: "11:00" }],
      exceptions: [],
      bookedSlots: [],
      fromDate: SUNDAY,
      toDate: SUNDAY,
      timezone: "UTC",
      now: new Date("2024-01-01T00:00:00Z"),
    });

    expect(result[SUNDAY]).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("returns no slots for a day with no availability window", () => {
    const result = generateAvailableSlots({
      slotDurationMinutes: 30,
      availability: [{ dayOfWeek: 0, startTime: "09:00", endTime: "11:00" }],
      exceptions: [],
      bookedSlots: [],
      fromDate: MONDAY,
      toDate: MONDAY,
      timezone: "UTC",
      now: new Date("2024-01-01T00:00:00Z"),
    });

    expect(result[MONDAY]).toEqual([]);
  });

  it("blocks the whole day on a full-day exception", () => {
    const result = generateAvailableSlots({
      slotDurationMinutes: 30,
      availability: [{ dayOfWeek: 0, startTime: "09:00", endTime: "11:00" }],
      exceptions: [{ exceptionDate: SUNDAY, startTime: null, endTime: null }],
      bookedSlots: [],
      fromDate: SUNDAY,
      toDate: SUNDAY,
      timezone: "UTC",
      now: new Date("2024-01-01T00:00:00Z"),
    });

    expect(result[SUNDAY]).toEqual([]);
  });

  it("removes only the slots overlapping a partial-day exception", () => {
    const result = generateAvailableSlots({
      slotDurationMinutes: 30,
      availability: [{ dayOfWeek: 0, startTime: "09:00", endTime: "11:00" }],
      exceptions: [{ exceptionDate: SUNDAY, startTime: "09:30", endTime: "10:30" }],
      bookedSlots: [],
      fromDate: SUNDAY,
      toDate: SUNDAY,
      timezone: "UTC",
      now: new Date("2024-01-01T00:00:00Z"),
    });

    expect(result[SUNDAY]).toEqual(["09:00", "10:30"]);
  });

  it("removes slots that are already booked (pending or confirmed)", () => {
    const result = generateAvailableSlots({
      slotDurationMinutes: 30,
      availability: [{ dayOfWeek: 0, startTime: "09:00", endTime: "11:00" }],
      exceptions: [],
      bookedSlots: [{ appointmentDate: SUNDAY, startTime: "09:30" }],
      fromDate: SUNDAY,
      toDate: SUNDAY,
      timezone: "UTC",
      now: new Date("2024-01-01T00:00:00Z"),
    });

    expect(result[SUNDAY]).toEqual(["09:00", "10:00", "10:30"]);
  });

  it("filters out past slots when the date is today", () => {
    const result = generateAvailableSlots({
      slotDurationMinutes: 30,
      availability: [{ dayOfWeek: 0, startTime: "09:00", endTime: "11:00" }],
      exceptions: [],
      bookedSlots: [],
      fromDate: SUNDAY,
      toDate: SUNDAY,
      timezone: "UTC",
      now: new Date(`${SUNDAY}T09:45:00Z`),
    });

    expect(result[SUNDAY]).toEqual(["10:00", "10:30"]);
  });

  it("does not filter slots on future dates even if 'now' is later in the day", () => {
    const result = generateAvailableSlots({
      slotDurationMinutes: 30,
      availability: [{ dayOfWeek: 2, startTime: "09:00", endTime: "10:00" }],
      exceptions: [],
      bookedSlots: [],
      fromDate: TUESDAY,
      toDate: TUESDAY,
      timezone: "UTC",
      now: new Date(`${SUNDAY}T23:00:00Z`),
    });

    expect(result[TUESDAY]).toEqual(["09:00", "09:30"]);
  });

  it("supports split shifts (multiple availability windows on the same day)", () => {
    const result = generateAvailableSlots({
      slotDurationMinutes: 60,
      availability: [
        { dayOfWeek: 0, startTime: "09:00", endTime: "12:00" },
        { dayOfWeek: 0, startTime: "17:00", endTime: "19:00" },
      ],
      exceptions: [],
      bookedSlots: [],
      fromDate: SUNDAY,
      toDate: SUNDAY,
      timezone: "UTC",
      now: new Date("2024-01-01T00:00:00Z"),
    });

    expect(result[SUNDAY]).toEqual(["09:00", "10:00", "11:00", "17:00", "18:00"]);
  });

  it("respects a custom slot duration that doesn't evenly divide the window", () => {
    const result = generateAvailableSlots({
      slotDurationMinutes: 20,
      availability: [{ dayOfWeek: 0, startTime: "09:00", endTime: "09:50" }],
      exceptions: [],
      bookedSlots: [],
      fromDate: SUNDAY,
      toDate: SUNDAY,
      timezone: "UTC",
      now: new Date("2024-01-01T00:00:00Z"),
    });

    // Only two full 20-minute slots fit in a 50-minute window; the trailing 10 minutes are dropped.
    expect(result[SUNDAY]).toEqual(["09:00", "09:20"]);
  });
});
