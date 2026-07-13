import type { Database } from "@slotly/db";
import { services } from "@slotly/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export async function listServices(db: Database, masterId: string) {
  return db
    .select()
    .from(services)
    .where(eq(services.masterId, masterId))
    .orderBy(asc(services.sortOrder), asc(services.name));
}

export interface ServiceInput {
  name: string;
  description?: string;
  durationMin: number;
  priceCents: number;
  isActive?: boolean;
  sortOrder?: number;
}

export async function createService(
  db: Database,
  masterId: string,
  input: ServiceInput,
) {
  const [created] = await db
    .insert(services)
    .values({
      masterId,
      name: input.name,
      description: input.description,
      durationMin: input.durationMin,
      priceCents: input.priceCents,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  if (!created) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "SERVICE_CREATE_FAILED",
    });
  }

  return created;
}

export async function updateService(
  db: Database,
  masterId: string,
  serviceId: string,
  input: Partial<ServiceInput>,
) {
  const [updated] = await db
    .update(services)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(eq(services.id, serviceId), eq(services.masterId, masterId)),
    )
    .returning();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "SERVICE_NOT_FOUND" });
  }

  return updated;
}

export async function deleteService(
  db: Database,
  masterId: string,
  serviceId: string,
) {
  const [deleted] = await db
    .update(services)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(eq(services.id, serviceId), eq(services.masterId, masterId)),
    )
    .returning();

  if (!deleted) {
    throw new TRPCError({ code: "NOT_FOUND", message: "SERVICE_NOT_FOUND" });
  }

  return deleted;
}
