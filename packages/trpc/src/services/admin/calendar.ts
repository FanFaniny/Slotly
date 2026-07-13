import "../../dayjs-plugins.js";
import type { Database } from "@slotly/db";
import type { BookingStatus } from "@slotly/db/schema";
import {
  blockedTimes,
  bookings,
  clients,
  services,
} from "@slotly/db/schema";
import dayjs from "dayjs";
import { and, asc, eq, gte, lte, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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

export async function updateBookingStatus(
  db: Database,
  masterId: string,
  bookingId: string,
  status: BookingStatus,
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

  return updated;
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
