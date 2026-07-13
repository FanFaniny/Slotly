import type { TimeInterval } from "./types.js";

export function intervalsOverlap(
  a: TimeInterval,
  b: TimeInterval,
  bufferMin = 0,
): boolean {
  const aStart = a.startsAt.getTime() - bufferMin * 60_000;
  const aEnd = a.endsAt.getTime() + bufferMin * 60_000;
  const bStart = b.startsAt.getTime() - bufferMin * 60_000;
  const bEnd = b.endsAt.getTime() + bufferMin * 60_000;

  return aStart < bEnd && aEnd > bStart;
}

export function slotIsFree(
  slot: TimeInterval,
  busyIntervals: TimeInterval[],
  bufferMin: number,
): boolean {
  return !busyIntervals.some((busy) => overlaps(slot, busy, bufferMin));
}

function overlaps(
  slot: TimeInterval,
  busy: TimeInterval,
  bufferMin: number,
): boolean {
  return intervalsOverlap(slot, busy, bufferMin);
}

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );

  const merged: TimeInterval[] = [sorted[0]!];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;

    if (current.startsAt.getTime() <= last.endsAt.getTime()) {
      if (current.endsAt.getTime() > last.endsAt.getTime()) {
        last.endsAt = current.endsAt;
      }
      continue;
    }

    merged.push(current);
  }

  return merged;
}
