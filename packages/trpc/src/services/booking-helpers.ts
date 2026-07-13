import type { Database } from "@slotly/db";
import {
  blockedTimes,
  bookings,
  masters,
  services,
  slotHolds,
} from "@slotly/db/schema";
import type {
  AvailabilitySettings,
  TimeInterval,
  WorkScheduleBlockInput,
} from "@slotly/shared/availability";
import { and, eq, gt, isNull, lt, ne, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export class AvailabilityError extends Error {
  constructor(
    public readonly code: "MASTER_NOT_FOUND" | "SERVICE_NOT_FOUND",
  ) {
    super(code);
  }
}

export async function resolveMasterServiceContext(
  db: Database,
  username: string,
  serviceId: string,
) {
  const master = await db.query.masters.findFirst({
    where: eq(masters.username, username),
    with: {
      settings: true,
      workScheduleBlocks: true,
      services: true,
    },
  });

  if (!master) {
    throw new AvailabilityError("MASTER_NOT_FOUND");
  }

  const service = master.services.find(
    (item) => item.id === serviceId && item.isActive,
  );

  if (!service) {
    throw new AvailabilityError("SERVICE_NOT_FOUND");
  }

  if (!master.settings) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "MASTER_SETTINGS_NOT_FOUND",
    });
  }

  const scheduleBlocks: WorkScheduleBlockInput[] =
    master.workScheduleBlocks.map((block) => ({
      dayOfWeek: block.dayOfWeek,
      startTime: block.startTime,
      endTime: block.endTime,
      isActive: block.isActive,
    }));

  const settings: AvailabilitySettings = {
    bufferMin: master.settings.bufferMin,
    minAdvanceHours: master.settings.minAdvanceHours,
    horizonDays: master.settings.horizonDays,
  };

  return {
    master,
    service,
    settings,
    scheduleBlocks,
  };
}

export async function loadBusyIntervalsForMaster(
  db: Database,
  masterId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<TimeInterval[]> {
  const [bookingRows, holdRows, blockedRows] = await Promise.all([
    db
      .select({
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.masterId, masterId),
          ne(bookings.status, "cancelled"),
          lt(bookings.startsAt, rangeEnd),
          gt(bookings.endsAt, rangeStart),
        ),
      ),
    db
      .select({
        startsAt: slotHolds.startsAt,
        endsAt: slotHolds.endsAt,
      })
      .from(slotHolds)
      .where(
        and(
          eq(slotHolds.masterId, masterId),
          gt(slotHolds.expiresAt, sql`NOW()`),
          isNull(slotHolds.bookingId),
          lt(slotHolds.startsAt, rangeEnd),
          gt(slotHolds.endsAt, rangeStart),
        ),
      ),
    db
      .select({
        startsAt: blockedTimes.startsAt,
        endsAt: blockedTimes.endsAt,
      })
      .from(blockedTimes)
      .where(
        and(
          eq(blockedTimes.masterId, masterId),
          lt(blockedTimes.startsAt, rangeEnd),
          gt(blockedTimes.endsAt, rangeStart),
        ),
      ),
  ]);

  return [...bookingRows, ...holdRows, ...blockedRows];
}

export async function getServiceById(
  db: Database,
  masterId: string,
  serviceId: string,
) {
  return db.query.services.findFirst({
    where: and(
      eq(services.id, serviceId),
      eq(services.masterId, masterId),
      eq(services.isActive, true),
    ),
  });
}
