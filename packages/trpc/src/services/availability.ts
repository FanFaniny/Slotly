import type { Database } from "@slotly/db";
import { buildHorizonRange, computeAvailableDates, computeSlotsForLocalDate } from "@slotly/shared/availability";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { masters, services } from "@slotly/db/schema";

import {
  AvailabilityError,
  loadBusyIntervalsForMaster,
  resolveMasterServiceContext,
} from "./booking-helpers.js";

const localDateSchema = /^\d{4}-\d{2}-\d{2}$/;

function toTrpcError(error: AvailabilityError): TRPCError {
  return new TRPCError({ code: "NOT_FOUND", message: error.code });
}

export async function getPublicAvailableDates(
  db: Database,
  username: string,
  serviceId: string,
) {
  try {
    const context = await resolveMasterServiceContext(
      db,
      username,
      serviceId,
    );
    const horizon = buildHorizonRange(
      context.master.timezone,
      context.settings.horizonDays,
    );
    const busyIntervals = await loadBusyIntervalsForMaster(
      db,
      context.master.id,
      horizon.startsAt,
      horizon.endsAt,
    );

    const dates = computeAvailableDates({
      timezone: context.master.timezone,
      settings: context.settings,
      service: { durationMin: context.service.durationMin },
      scheduleBlocks: context.scheduleBlocks,
      busyIntervals,
      rangeStart: horizon.startsAt,
      rangeEnd: horizon.endsAt,
    });

    return {
      timezone: context.master.timezone,
      dates,
    };
  } catch (error) {
    if (error instanceof AvailabilityError) {
      throw toTrpcError(error);
    }
    throw error;
  }
}

export async function getPublicAvailableSlots(
  db: Database,
  username: string,
  serviceId: string,
  localDate: string,
) {
  if (!localDateSchema.test(localDate)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "INVALID_LOCAL_DATE",
    });
  }

  try {
    const context = await resolveMasterServiceContext(
      db,
      username,
      serviceId,
    );
    const horizon = buildHorizonRange(
      context.master.timezone,
      context.settings.horizonDays,
    );
    const busyIntervals = await loadBusyIntervalsForMaster(
      db,
      context.master.id,
      horizon.startsAt,
      horizon.endsAt,
    );

    const slots = computeSlotsForLocalDate(
      {
        timezone: context.master.timezone,
        settings: context.settings,
        service: { durationMin: context.service.durationMin },
        scheduleBlocks: context.scheduleBlocks,
        busyIntervals,
        rangeStart: horizon.startsAt,
        rangeEnd: horizon.endsAt,
      },
      localDate,
    );

    return {
      timezone: context.master.timezone,
      date: localDate,
      slots,
    };
  } catch (error) {
    if (error instanceof AvailabilityError) {
      throw toTrpcError(error);
    }
    throw error;
  }
}

export async function getMasterAvailableSlots(
  db: Database,
  masterId: string,
  serviceId: string,
  localDate: string,
) {
  if (!localDateSchema.test(localDate)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "INVALID_LOCAL_DATE",
    });
  }

  const master = await db.query.masters.findFirst({
    where: eq(masters.id, masterId),
    with: {
      settings: true,
      workScheduleBlocks: true,
    },
  });

  if (!master?.settings) {
    throw new TRPCError({ code: "NOT_FOUND", message: "MASTER_NOT_FOUND" });
  }

  const service = await db.query.services.findFirst({
    where: and(
      eq(services.id, serviceId),
      eq(services.masterId, masterId),
      eq(services.isActive, true),
    ),
  });

  if (!service) {
    throw new TRPCError({ code: "NOT_FOUND", message: "SERVICE_NOT_FOUND" });
  }

  const scheduleBlocks = master.workScheduleBlocks.map((block) => ({
    dayOfWeek: block.dayOfWeek,
    startTime: block.startTime,
    endTime: block.endTime,
    isActive: block.isActive,
  }));

  const settings = {
    bufferMin: master.settings.bufferMin,
    minAdvanceHours: master.settings.minAdvanceHours,
    horizonDays: master.settings.horizonDays,
  };

  const horizon = buildHorizonRange(master.timezone, settings.horizonDays);
  const busyIntervals = await loadBusyIntervalsForMaster(
    db,
    master.id,
    horizon.startsAt,
    horizon.endsAt,
  );

  const slots = computeSlotsForLocalDate(
    {
      timezone: master.timezone,
      settings,
      service: { durationMin: service.durationMin },
      scheduleBlocks,
      busyIntervals,
      rangeStart: horizon.startsAt,
      rangeEnd: horizon.endsAt,
    },
    localDate,
  );

  return {
    timezone: master.timezone,
    date: localDate,
    slots,
  };
}

// Re-export helpers used by booking service
export {
  AvailabilityError,
  resolveMasterServiceContext,
} from "./booking-helpers.js";
