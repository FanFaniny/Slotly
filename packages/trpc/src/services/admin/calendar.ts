import "../../dayjs-plugins.js";
import type { Database } from "@slotly/db";
import type { BookingStatus } from "@slotly/db/schema";
import {
  blockedTimes,
  bookings,
  clients,
  masters,
  services,
  slotHolds,
} from "@slotly/db/schema";
import dayjs from "dayjs";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendBookingUpdateEmail, type BookingUpdateType } from "@slotly/shared/email";

interface FullBooking {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: BookingStatus;
  comment: string | null;
  service: {
    id: string;
    name: string;
    durationMin: number;
    priceCents: number;
  };
  client: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  master: {
    displayName: string;
    timezone: string;
  };
}

async function getFullBooking(db: Database, bookingId: string): Promise<FullBooking> {
  const [fullBooking] = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      comment: bookings.comment,
      service: {
        id: services.id,
        name: services.name,
        durationMin: services.durationMin,
        priceCents: services.priceCents,
      },
      client: {
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        email: clients.email,
      },
      master: {
        displayName: masters.displayName,
        timezone: masters.timezone,
      },
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .innerJoin(masters, eq(bookings.masterId, masters.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!fullBooking) {
    throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
  }

  return fullBooking;
}

export async function listBookings(
  db: Database,
  masterId: string,
  rangeStart: string,
  rangeEnd: string,
) {
  const start = dayjs.utc(rangeStart).toDate();
  const end = dayjs.utc(rangeEnd).toDate();

  const rows = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      comment: bookings.comment,
      serviceId: bookings.serviceId,
      serviceName: services.name,
      serviceDurationMin: services.durationMin,
      servicePriceCents: services.priceCents,
      clientId: bookings.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientEmail: clients.email,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(
      and(
        eq(bookings.masterId, masterId),
        gte(bookings.startsAt, start),
        lte(bookings.startsAt, end),
      ),
    )
    .orderBy(asc(bookings.startsAt));

  return rows.map((row) => ({
    id: row.id,
    title: `${row.serviceName} — ${row.clientName}`,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    comment: row.comment,
    service: {
      id: row.serviceId,
      name: row.serviceName,
      durationMin: row.serviceDurationMin,
      priceCents: row.servicePriceCents,
    },
    client: {
      id: row.clientId,
      name: row.clientName,
      phone: row.clientPhone,
      email: row.clientEmail,
    },
  }));
}

export async function getBookingById(
  db: Database,
  masterId: string,
  bookingId: string,
) {
  const [row] = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      comment: bookings.comment,
      customFieldValues: bookings.customFieldValues,
      createdAt: bookings.createdAt,
      serviceId: bookings.serviceId,
      serviceName: services.name,
      serviceDurationMin: services.durationMin,
      servicePriceCents: services.priceCents,
      clientId: bookings.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientEmail: clients.email,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.masterId, masterId)),
    );

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
  }

  return {
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    comment: row.comment,
    customFieldValues: row.customFieldValues,
    createdAt: row.createdAt.toISOString(),
    service: {
      id: row.serviceId,
      name: row.serviceName,
      durationMin: row.serviceDurationMin,
      priceCents: row.servicePriceCents,
    },
    client: {
      id: row.clientId,
      name: row.clientName,
      phone: row.clientPhone,
      email: row.clientEmail,
    },
  };
}

export interface UpdateBookingInput {
  bookingId: string;
  status?: BookingStatus;
  comment?: string | null;
  notifyClient?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export async function updateBooking(
  db: Database,
  masterId: string,
  input: UpdateBookingInput,
) {
  const updateSet: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.status !== undefined) {
    updateSet.status = input.status;
  }
  if (input.comment !== undefined) {
    updateSet.comment = input.comment;
  }
  if (input.startsAt !== undefined) {
    const parsedStarts = dayjs.utc(input.startsAt);
    if (!parsedStarts.isValid()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "INVALID_STARTS_AT",
      });
    }
    updateSet.startsAt = parsedStarts.toDate();
  }
  if (input.endsAt !== undefined) {
    const parsedEnds = dayjs.utc(input.endsAt);
    if (!parsedEnds.isValid()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "INVALID_ENDS_AT",
      });
    }
    updateSet.endsAt = parsedEnds.toDate();
  }

  // Validate that endsAt is after startsAt if both are provided
  if (input.startsAt !== undefined && input.endsAt !== undefined) {
    const parsedStarts = dayjs.utc(input.startsAt);
    const parsedEnds = dayjs.utc(input.endsAt);
    if (parsedEnds.isBefore(parsedStarts)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "ENDS_AT_MUST_BE_AFTER_STARTS_AT",
      });
    }
  }

  // Check for conflicts if time is being updated
  if (input.startsAt !== undefined || input.endsAt !== undefined) {
    const currentBooking = await db.query.bookings.findFirst({
      where: and(eq(bookings.id, input.bookingId), eq(bookings.masterId, masterId)),
      columns: { startsAt: true, endsAt: true },
    });

    if (!currentBooking) {
      throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
    }

    const interval = {
      startsAt: input.startsAt !== undefined ? dayjs.utc(input.startsAt).toDate() : currentBooking.startsAt,
      endsAt: input.endsAt !== undefined ? dayjs.utc(input.endsAt).toDate() : currentBooking.endsAt,
    };

    // Check overlapping holds
    const overlappingHolds = await db
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
      );

    // Check overlapping bookings (exclude current booking)
    const overlappingBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.masterId, masterId),
          ne(bookings.status, "cancelled"),
          ne(bookings.id, input.bookingId),
          lt(bookings.startsAt, interval.endsAt),
          gt(bookings.endsAt, interval.startsAt),
        ),
      );

    if (overlappingHolds.length > 0 || overlappingBookings.length > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "SLOT_NOT_AVAILABLE",
      });
    }
  }

  const [updated] = await db
    .update(bookings)
    .set(updateSet)
    .where(
      and(eq(bookings.id, input.bookingId), eq(bookings.masterId, masterId)),
    )
    .returning();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
  }

  // Fetch full booking with related data for email and response
  const fullBooking = await getFullBooking(db, input.bookingId);

  // Send email notification if requested
  if (input.notifyClient && fullBooking.client.email) {
    let updateType: BookingUpdateType | undefined;
    let newStatus: string | undefined;

    if (input.status === "cancelled") {
      updateType = "CANCELLED";
      newStatus = "cancelled";
    } else if (input.startsAt !== undefined || input.endsAt !== undefined) {
      updateType = "RESCHEDULED";
    } else if (input.status !== undefined) {
      updateType = "STATUS_CHANGED";
      newStatus = input.status;
    }

    if (updateType) {
      try {
        await sendBookingUpdateEmail({
          to: fullBooking.client.email,
          clientName: fullBooking.client.name,
          masterName: fullBooking.master.displayName,
          serviceName: fullBooking.service.name,
          startsAt: fullBooking.startsAt.toISOString(),
          timezone: fullBooking.master.timezone,
          updateType,
          newStatus,
        });
      } catch (error) {
        console.error("[calendar] Failed to send booking update email:", error);
        // Don't throw error, booking update was successful
      }
    }
  }

  return fullBooking;
}

export async function updateBookingStatus(
  db: Database,
  masterId: string,
  bookingId: string,
  status: BookingStatus,
  notifyClient?: boolean,
) {
  const [updated] = await db
    .update(bookings)
    .set({ status, updatedAt: new Date() })
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.masterId, masterId)),
    )
    .returning();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
  }

  // Fetch full booking with related data
  const fullBooking = await getFullBooking(db, bookingId);

  // Send cancellation email if status is cancelled and notifyClient is true
  if (notifyClient && status === "cancelled" && fullBooking.client.email) {
    try {
      await sendBookingUpdateEmail({
        to: fullBooking.client.email,
        clientName: fullBooking.client.name,
        masterName: fullBooking.master.displayName,
        serviceName: fullBooking.service.name,
        startsAt: fullBooking.startsAt.toISOString(),
        timezone: fullBooking.master.timezone,
        updateType: "CANCELLED",
        newStatus: "cancelled",
      });
    } catch (error) {
      console.error("[calendar] Failed to send cancellation email:", error);
      // Don't throw error, status update was successful
    }
  }

  return fullBooking;
}

export async function listBlockedTimes(
  db: Database,
  masterId: string,
  rangeStart: string,
  rangeEnd: string,
) {
  const start = dayjs.utc(rangeStart).toDate();
  const end = dayjs.utc(rangeEnd).toDate();

  return db
    .select()
    .from(blockedTimes)
    .where(
      and(
        eq(blockedTimes.masterId, masterId),
        gte(blockedTimes.startsAt, start),
        lte(blockedTimes.startsAt, end),
      ),
    )
    .orderBy(asc(blockedTimes.startsAt));
}

export interface BlockedTimeInput {
  startsAt: string;
  endsAt: string;
  reason?: string;
}

export async function createBlockedTime(
  db: Database,
  masterId: string,
  input: BlockedTimeInput,
) {
  const [created] = await db
    .insert(blockedTimes)
    .values({
      masterId,
      startsAt: dayjs.utc(input.startsAt).toDate(),
      endsAt: dayjs.utc(input.endsAt).toDate(),
      reason: input.reason,
    })
    .returning();

  if (!created) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "BLOCKED_TIME_CREATE_FAILED",
    });
  }

  return created;
}

export async function deleteBlockedTime(
  db: Database,
  masterId: string,
  blockedTimeId: string,
) {
  const [deleted] = await db
    .delete(blockedTimes)
    .where(
      and(
        eq(blockedTimes.id, blockedTimeId),
        eq(blockedTimes.masterId, masterId),
      ),
    )
    .returning();

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "BLOCKED_TIME_NOT_FOUND",
    });
  }

  return deleted;
}

export async function getCalendarEvents(
  db: Database,
  masterId: string,
  rangeStart: string,
  rangeEnd: string,
) {
  const [bookingEvents, blockedEvents] = await Promise.all([
    listBookings(db, masterId, rangeStart, rangeEnd),
    listBlockedTimes(db, masterId, rangeStart, rangeEnd),
  ]);

  return {
    bookings: bookingEvents.filter((b) => b.status !== "cancelled"),
    blocked: blockedEvents.map((b) => ({
      id: b.id,
      title: b.reason ?? "Blocked",
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
    })),
  };
}
