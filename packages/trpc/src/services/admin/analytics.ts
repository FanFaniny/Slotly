import "../../dayjs-plugins.js";
import type { Database } from "@slotly/db";
import { bookings, masters, services } from "@slotly/db/schema";
import { buildHorizonRange } from "@slotly/shared/availability";
import dayjs from "dayjs";
import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";

export async function getRevenueAnalytics(
  db: Database,
  masterId: string,
  days = 30,
) {
  const startDate = dayjs.utc().subtract(days, "day").startOf("day").toDate();

  const rows = await db
    .select({
      day: sql<string>`DATE(${bookings.startsAt})`.as("day"),
      revenueCents: sql<number>`COALESCE(SUM(${services.priceCents}), 0)::int`.as(
        "revenue_cents",
      ),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.masterId, masterId),
        ne(bookings.status, "cancelled"),
        gte(bookings.startsAt, startDate),
      ),
    )
    .groupBy(sql`DATE(${bookings.startsAt})`)
    .orderBy(sql`DATE(${bookings.startsAt})`);

  return rows.map((row) => ({
    day: row.day,
    revenueCents: row.revenueCents,
    bookingsCount: row.count,
  }));
}

export async function getTopServices(
  db: Database,
  masterId: string,
  days = 30,
  limit = 3,
) {
  const startDate = dayjs.utc().subtract(days, "day").startOf("day").toDate();

  const rows = await db
    .select({
      serviceId: services.id,
      serviceName: services.name,
      count: sql<number>`COUNT(*)::int`.as("count"),
      revenueCents: sql<number>`COALESCE(SUM(${services.priceCents}), 0)::int`.as(
        "revenue_cents",
      ),
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.masterId, masterId),
        ne(bookings.status, "cancelled"),
        gte(bookings.startsAt, startDate),
      ),
    )
    .groupBy(services.id, services.name)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);

  return rows;
}

export async function getUtilization(
  db: Database,
  masterId: string,
  timezone: string,
  horizonDays: number,
) {
  const horizon = buildHorizonRange(timezone, horizonDays);
  const rangeStart = horizon.startsAt;
  const rangeEnd = horizon.endsAt;

  const [bookedResult] = await db
    .select({
      bookedMinutes: sql<number>`
        COALESCE(SUM(EXTRACT(EPOCH FROM (${bookings.endsAt} - ${bookings.startsAt})) / 60), 0)::int
      `.as("booked_minutes"),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.masterId, masterId),
        ne(bookings.status, "cancelled"),
        gte(bookings.startsAt, rangeStart),
        lte(bookings.startsAt, rangeEnd),
      ),
    );

  const master = await db.query.masters.findFirst({
    where: eq(masters.id, masterId),
    with: { workScheduleBlocks: true, settings: true },
  });

  // Calculate available minutes from work schedule
  let availableMinutes = 0;
  if (master?.workScheduleBlocks) {
    const activeBlocks = master.workScheduleBlocks.filter((b) => b.isActive);
    const daysInHorizon = horizonDays;

    for (const block of activeBlocks) {
      const [startH, startM] = block.startTime.split(":").map(Number);
      const [endH, endM] = block.endTime.split(":").map(Number);
      const blockMinutes = (endH! * 60 + endM!) - (startH! * 60 + startM!);
      // Approximate: each block occurs once per week
      const weeksInHorizon = daysInHorizon / 7;
      availableMinutes += blockMinutes * weeksInHorizon;
    }
  }

  const bookedMinutes = bookedResult?.bookedMinutes ?? 0;
  const utilizationPercent =
    availableMinutes > 0
      ? Math.round((bookedMinutes / availableMinutes) * 100)
      : 0;

  return {
    bookedMinutes,
    availableMinutes: Math.round(availableMinutes),
    utilizationPercent: Math.min(utilizationPercent, 100),
    periodDays: horizonDays,
  };
}

export async function getDashboardSummary(
  db: Database,
  masterId: string,
  timezone: string,
  horizonDays: number,
) {
  const [revenue, topServices, utilization] = await Promise.all([
    getRevenueAnalytics(db, masterId, 30),
    getTopServices(db, masterId, 30, 3),
    getUtilization(db, masterId, timezone, horizonDays),
  ]);

  const totalRevenueCents = revenue.reduce((sum, r) => sum + r.revenueCents, 0);
  const totalBookings = revenue.reduce((sum, r) => sum + r.bookingsCount, 0);

  return {
    totalRevenueCents,
    totalBookings,
    revenue,
    topServices,
    utilization,
  };
}
