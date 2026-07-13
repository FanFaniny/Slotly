import "../dayjs-plugins.js";
import type { Database, DbTransaction } from "@slotly/db";
import {
  bookings,
  clients,
  masters,
  services,
  slotHolds,
} from "@slotly/db/schema";
import {
  HOLD_TTL_MINUTES,
  MAX_ACTIVE_HOLDS_PER_IP,
} from "@slotly/shared/booking";
import dayjs from "dayjs";
import {
  intervalsOverlap,
  type TimeInterval,
} from "@slotly/shared/availability";
import { and, eq, gt, isNull, lt, ne, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  AvailabilityError,
  resolveMasterServiceContext,
} from "./booking-helpers.js";
import { getPublicAvailableSlots } from "./availability.js";
import { buildBookingIcs } from "./ics.js";

export interface CreateHoldInput {
  username: string;
  serviceId: string;
  startsAt: string;
  clientIp?: string | null;
}

export interface ConfirmBookingInput {
  holdId: string;
  name: string;
  phone: string;
  email?: string;
  comment?: string;
  customFieldValues?: Record<string, string | boolean | number>;
}

function parseStartsAt(startsAt: string) {
  const parsed = dayjs.utc(startsAt);
  if (!parsed.isValid()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "INVALID_STARTS_AT",
    });
  }
  return parsed.toDate();
}

async function assertSlotAvailable(
  db: Database,
  username: string,
  serviceId: string,
  startsAt: Date,
) {
  const localDate = dayjs.utc(startsAt).tz(
    (
      await db.query.masters.findFirst({
        where: eq(masters.username, username),
        columns: { timezone: true },
      })
    )?.timezone ?? "UTC",
  ).format("YYYY-MM-DD");

  const availability = await getPublicAvailableSlots(
    db,
    username,
    serviceId,
    localDate,
  );

  const startsAtIso = startsAt.toISOString();
  const isAvailable = availability.slots.some(
    (slot) => slot.startsAt === startsAtIso,
  );

  if (!isAvailable) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "SLOT_NOT_AVAILABLE",
    });
  }
}

async function countActiveHoldsForIp(
  db: Database,
  masterId: string,
  clientIp: string,
) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(slotHolds)
    .where(
      and(
        eq(slotHolds.masterId, masterId),
        eq(slotHolds.clientIp, clientIp),
        gt(slotHolds.expiresAt, sql`NOW()`),
        isNull(slotHolds.bookingId),
      ),
    );

  return result?.count ?? 0;
}

async function lockOverlappingRows(
  tx: DbTransaction,
  masterId: string,
  interval: TimeInterval,
) {
  await tx
    .select({ id: slotHolds.id })
    .from(slotHolds)
    .where(
      and(
        eq(slotHolds.masterId, masterId),
        gt(slotHolds.expiresAt, sql`NOW()`),
        isNull(slotHolds.bookingId),
        lt(slotHolds.startsAt, interval.endsAt),
        gt(slotHolds.endsAt, interval.startsAt),
      ),
    )
    .for("update");

  await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.masterId, masterId),
        ne(bookings.status, "cancelled"),
        lt(bookings.startsAt, interval.endsAt),
        gt(bookings.endsAt, interval.startsAt),
      ),
    )
    .for("update");
}

export async function createHold(db: Database, input: CreateHoldInput) {
  const startsAt = parseStartsAt(input.startsAt);

  let context;
  try {
    context = await resolveMasterServiceContext(
      db,
      input.username,
      input.serviceId,
    );
  } catch (error) {
    if (error instanceof AvailabilityError) {
      throw new TRPCError({ code: "NOT_FOUND", message: error.code });
    }
    throw error;
  }

  await assertSlotAvailable(
    db,
    input.username,
    input.serviceId,
    startsAt,
  );

  const endsAt = dayjs
    .utc(startsAt)
    .add(context.service.durationMin, "minute")
    .toDate();
  const expiresAt = dayjs.utc().add(HOLD_TTL_MINUTES, "minute").toDate();
  const interval = { startsAt, endsAt };

  if (input.clientIp) {
    const activeHoldCount = await countActiveHoldsForIp(
      db,
      context.master.id,
      input.clientIp,
    );

    if (activeHoldCount >= MAX_ACTIVE_HOLDS_PER_IP) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "TOO_MANY_ACTIVE_HOLDS",
      });
    }
  }

  const hold = await db.transaction(async (tx) => {
    await lockOverlappingRows(tx, context.master.id, interval);

    const overlappingHolds = await tx
      .select({
        id: slotHolds.id,
        startsAt: slotHolds.startsAt,
        endsAt: slotHolds.endsAt,
      })
      .from(slotHolds)
      .where(
        and(
          eq(slotHolds.masterId, context.master.id),
          gt(slotHolds.expiresAt, sql`NOW()`),
          isNull(slotHolds.bookingId),
          lt(slotHolds.startsAt, interval.endsAt),
          gt(slotHolds.endsAt, interval.startsAt),
        ),
      );

    const overlappingBookings = await tx
      .select({
        id: bookings.id,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.masterId, context.master.id),
          ne(bookings.status, "cancelled"),
          lt(bookings.startsAt, interval.endsAt),
          gt(bookings.endsAt, interval.startsAt),
        ),
      );

    const hasConflict =
      overlappingHolds.some((row) => intervalsOverlap(interval, row)) ||
      overlappingBookings.some((row) => intervalsOverlap(interval, row));

    if (hasConflict) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "SLOT_NOT_AVAILABLE",
      });
    }

    const [created] = await tx
      .insert(slotHolds)
      .values({
        masterId: context.master.id,
        serviceId: context.service.id,
        startsAt,
        endsAt,
        expiresAt,
        clientIp: input.clientIp ?? null,
      })
      .returning();

    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "HOLD_CREATE_FAILED",
      });
    }

    return created;
  });

  return {
    holdId: hold.id,
    startsAt: hold.startsAt.toISOString(),
    endsAt: hold.endsAt.toISOString(),
    expiresAt: hold.expiresAt.toISOString(),
  };
}

async function upsertClient(
  tx: DbTransaction,
  masterId: string,
  input: ConfirmBookingInput,
) {
  const existing = await tx.query.clients.findFirst({
    where: and(
      eq(clients.masterId, masterId),
      eq(clients.phone, input.phone),
    ),
  });

  if (existing) {
    const [updated] = await tx
      .update(clients)
      .set({
        name: input.name,
        email: input.email ?? existing.email,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const [created] = await tx
    .insert(clients)
    .values({
      masterId,
      name: input.name,
      phone: input.phone,
      email: input.email,
    })
    .returning();

  if (!created) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "CLIENT_CREATE_FAILED",
    });
  }

  return created;
}

export async function confirmBooking(db: Database, input: ConfirmBookingInput) {
  const result = await db.transaction(async (tx) => {
    const [hold] = await tx
      .select()
      .from(slotHolds)
      .where(eq(slotHolds.id, input.holdId))
      .for("update");

    if (!hold) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "HOLD_NOT_FOUND",
      });
    }

    if (dayjs.utc(hold.expiresAt).isBefore(dayjs.utc())) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "HOLD_EXPIRED",
      });
    }

    if (hold.bookingId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "HOLD_ALREADY_USED",
      });
    }

    const master = await tx.query.masters.findFirst({
      where: eq(masters.id, hold.masterId),
    });

    const service = await tx.query.services.findFirst({
      where: and(
        eq(services.id, hold.serviceId),
        eq(services.masterId, hold.masterId),
        eq(services.isActive, true),
      ),
    });

    if (!master || !service) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "MASTER_OR_SERVICE_NOT_FOUND",
      });
    }

    const client = await upsertClient(tx, master.id, input);

    const [booking] = await tx
      .insert(bookings)
      .values({
        masterId: master.id,
        serviceId: service.id,
        clientId: client.id,
        startsAt: hold.startsAt,
        endsAt: hold.endsAt,
        status: "confirmed",
        comment: input.comment,
        customFieldValues: input.customFieldValues ?? {},
      })
      .returning();

    if (!booking) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "BOOKING_CREATE_FAILED",
      });
    }

    await tx.delete(slotHolds).where(eq(slotHolds.id, hold.id));

    const ics = buildBookingIcs({
      bookingId: booking.id,
      title: `${service.name} — ${master.displayName}`,
      description: input.comment,
      startsAt: booking.startsAt,
      durationMin: service.durationMin,
      organizerName: master.displayName,
      organizerEmail: master.email,
      attendeeName: client.name,
      attendeeEmail: client.email ?? undefined,
    });

    return {
      booking,
      master,
      service,
      client,
      ics,
    };
  });

  return {
    bookingId: result.booking.id,
    startsAt: result.booking.startsAt.toISOString(),
    endsAt: result.booking.endsAt.toISOString(),
    status: result.booking.status,
    master: {
      displayName: result.master.displayName,
      username: result.master.username,
      timezone: result.master.timezone,
    },
    service: {
      id: result.service.id,
      name: result.service.name,
      durationMin: result.service.durationMin,
    },
    client: {
      name: result.client.name,
      phone: result.client.phone,
      email: result.client.email,
    },
    ics: result.ics,
  };
}

export async function getBookingIcs(db: Database, bookingId: string) {
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: {
      master: true,
      service: true,
      client: true,
    },
  });

  if (!booking || booking.status === "cancelled") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "BOOKING_NOT_FOUND",
    });
  }

  const ics = buildBookingIcs({
    bookingId: booking.id,
    title: `${booking.service.name} — ${booking.master.displayName}`,
    description: booking.comment ?? undefined,
    startsAt: booking.startsAt,
    durationMin: booking.service.durationMin,
    organizerName: booking.master.displayName,
    organizerEmail: booking.master.email,
    attendeeName: booking.client.name,
    attendeeEmail: booking.client.email ?? undefined,
  });

  return {
    bookingId: booking.id,
    ics,
  };
}
