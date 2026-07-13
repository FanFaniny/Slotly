import * as rruleNs from "rrule";

// Node 24 CJS interop exposes RRule on default; ESM uses named export
const RRule = (rruleNs as { RRule?: typeof import("rrule").RRule }).RRule ??
  (rruleNs as unknown as { default: { RRule: typeof import("rrule").RRule } })
    .default.RRule;

import { dayjs } from "../datetime.js";
import type { TimeInterval, WorkScheduleBlockInput } from "./types.js";

const WEEKDAYS = [
  RRule.SU,
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
] as const;

function normalizeTime(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}

function localIntervalOnDate(
  date: Date,
  startTime: string,
  endTime: string,
  timezone: string,
): TimeInterval | null {
  const dateKey = dayjs(date).tz(timezone).format("YYYY-MM-DD");
  const startsAt = dayjs
    .tz(`${dateKey}T${normalizeTime(startTime)}`, timezone)
    .utc()
    .toDate();
  const endsAt = dayjs
    .tz(`${dateKey}T${normalizeTime(endTime)}`, timezone)
    .utc()
    .toDate();

  if (!dayjs(endsAt).isAfter(startsAt)) {
    return null;
  }

  return { startsAt, endsAt };
}

function clipInterval(
  interval: TimeInterval,
  rangeStart: Date,
  rangeEnd: Date,
): TimeInterval | null {
  const startsAt = new Date(
    Math.max(interval.startsAt.getTime(), rangeStart.getTime()),
  );
  const endsAt = new Date(
    Math.min(interval.endsAt.getTime(), rangeEnd.getTime()),
  );

  if (!dayjs(endsAt).isAfter(startsAt)) {
    return null;
  }

  return { startsAt, endsAt };
}

export function expandScheduleBlockDates(
  block: WorkScheduleBlockInput,
  rangeStart: Date,
  rangeEnd: Date,
  timezone: string,
): Date[] {
  if (!block.isActive) return [];

  const weekday = WEEKDAYS[block.dayOfWeek];
  if (!weekday) return [];

  const start = dayjs(rangeStart).tz(timezone).startOf("day");
  const end = dayjs(rangeEnd).tz(timezone).endOf("day");

  const rule = new RRule({
    freq: RRule.WEEKLY,
    byweekday: [weekday],
    dtstart: start.toDate(),
    until: end.toDate(),
  });

  return rule.all();
}

export function buildWorkingIntervals(
  scheduleBlocks: WorkScheduleBlockInput[],
  rangeStart: Date,
  rangeEnd: Date,
  timezone: string,
): TimeInterval[] {
  const intervals: TimeInterval[] = [];

  for (const block of scheduleBlocks) {
    const dates = expandScheduleBlockDates(
      block,
      rangeStart,
      rangeEnd,
      timezone,
    );

    for (const date of dates) {
      const interval = localIntervalOnDate(
        date,
        block.startTime,
        block.endTime,
        timezone,
      );

      if (!interval) continue;

      const clipped = clipInterval(interval, rangeStart, rangeEnd);
      if (clipped) intervals.push(clipped);
    }
  }

  return intervals.sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
}

export function localDayBounds(
  localDate: string,
  timezone: string,
): TimeInterval {
  const startsAt = dayjs.tz(`${localDate}T00:00:00`, timezone).utc().toDate();
  const endsAt = dayjs
    .tz(`${localDate}T23:59:59`, timezone)
    .utc()
    .toDate();

  return { startsAt, endsAt };
}

export function buildHorizonRange(
  timezone: string,
  horizonDays: number,
  now = dayjs.utc(),
): TimeInterval {
  const localNow = now.tz(timezone);
  const startsAt = localNow.startOf("day").utc().toDate();
  const endsAt = localNow
    .add(horizonDays, "day")
    .endOf("day")
    .utc()
    .toDate();

  return { startsAt, endsAt };
}
