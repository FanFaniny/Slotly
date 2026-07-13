import type { Database } from "@slotly/db";
import { masters, services } from "@slotly/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export async function getMasterProfile(db: Database, username: string) {
  const master = await db.query.masters.findFirst({
    where: eq(masters.username, username),
    with: { settings: true },
  });

  if (!master) {
    throw new TRPCError({ code: "NOT_FOUND", message: "MASTER_NOT_FOUND" });
  }

  const activeServices = await db
    .select()
    .from(services)
    .where(
      and(eq(services.masterId, master.id), eq(services.isActive, true)),
    )
    .orderBy(asc(services.sortOrder), asc(services.name));

  return {
    id: master.id,
    username: master.username,
    displayName: master.displayName,
    timezone: master.timezone,
    avatarUrl: master.avatarUrl,
    services: activeServices.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMin: s.durationMin,
      priceCents: s.priceCents,
    })),
    bookingFormSchema: master.settings?.bookingFormSchema ?? [],
  };
}
