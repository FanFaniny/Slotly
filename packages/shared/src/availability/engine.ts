import { dayjs } from "../datetime.js";
import { slotIsFree } from "./intervals.js";
import {
  buildHorizonRange,
  buildWorkingIntervals,
  localDayBounds,
} from "./schedule.js";
import {
  SLOT_STEP_MIN,
  type AvailableSlot,
  type ComputeAvailabilityInput,
  type TimeInterval,
} from "./types.js";

function generateCandidateSlots(
  workingIntervals: TimeInterval[],
  durationMin: number,
  stepMin = SLOT_STEP_MIN,
): TimeInterval[] {
  const durationMs = durationMin * 60_000;
  const stepMs = stepMin * 60_000;
  const slots: TimeInterval[] = [];

  for (const interval of workingIntervals) {
    let cursor = interval.startsAt.getTime();
    const latestStart = interval.endsAt.getTime() - durationMs;

    while (cursor <= latestStart) {
      slots.push({
        startsAt: new Date(cursor),
        endsAt: new Date(cursor + durationMs),
      });
      cursor += stepMs;
    }
  }

  return slots;
}

function applyMinAdvance(
  slots: TimeInterval[],
  minAdvanceHours: number,
  now = dayjs.utc(),
): TimeInterval[] {
  const earliest = now.add(minAdvanceHours, "hour");

  return slots.filter(
    (slot) => dayjs.utc(slot.startsAt).valueOf() >= earliest.valueOf(),
  );
}

function toAvailableSlots(slots: TimeInterval[]): AvailableSlot[] {
  return slots.map((slot) => ({
    startsAt: slot.startsAt.toISOString(),
    endsAt: slot.endsAt.toISOString(),
  }));
}

export function computeAvailableSlots(
  input: ComputeAvailabilityInput,
): AvailableSlot[] {
  const workingIntervals = buildWorkingIntervals(
    input.scheduleBlocks,
    input.rangeStart,
    input.rangeEnd,
    input.timezone,
  );

  const candidates = generateCandidateSlots(
    workingIntervals,
    input.service.durationMin,
  );

  const afterAdvance = applyMinAdvance(
    candidates,
    input.settings.minAdvanceHours,
  );

  const freeSlots = afterAdvance.filter((slot) =>
    slotIsFree(slot, input.busyIntervals, input.settings.bufferMin),
  );

  return toAvailableSlots(freeSlots);
}

export function computeAvailableDates(
  input: ComputeAvailabilityInput,
): string[] {
  const horizon = buildHorizonRange(
    input.timezone,
    input.settings.horizonDays,
  );
  const dates = new Set<string>();

  let cursor = dayjs(horizon.startsAt).tz(input.timezone).startOf("day");
  const horizonEnd = dayjs(horizon.endsAt).tz(input.timezone).startOf("day");

  while (!cursor.isAfter(horizonEnd)) {
    const localDate = cursor.format("YYYY-MM-DD");
    const dayBounds = localDayBounds(localDate, input.timezone);

    const slots = computeAvailableSlots({
      ...input,
      rangeStart: dayBounds.startsAt,
      rangeEnd: dayBounds.endsAt,
    });

    if (slots.length > 0) {
      dates.add(localDate);
    }

    cursor = cursor.add(1, "day");
  }

  return [...dates].sort();
}

export function computeSlotsForLocalDate(
  input: ComputeAvailabilityInput,
  localDate: string,
): AvailableSlot[] {
  const dayBounds = localDayBounds(localDate, input.timezone);

  return computeAvailableSlots({
    ...input,
    rangeStart: dayBounds.startsAt,
    rangeEnd: dayBounds.endsAt,
  });
}
