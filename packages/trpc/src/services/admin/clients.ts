import type { Database } from "@slotly/db";
import { clients } from "@slotly/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export async function listClients(
  db: Database,
  masterId: string,
  search?: string,
) {
  const conditions = [eq(clients.masterId, masterId)];

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(clients.name, term),
        ilike(clients.phone, term),
        ilike(clients.email, term),
      )!,
    );
  }

  return db
    .select()
    .from(clients)
    .where(and(...conditions))
    .orderBy(desc(clients.updatedAt));
}

export interface ClientUpdateInput {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export async function updateClient(
  db: Database,
  masterId: string,
  clientId: string,
  input: ClientUpdateInput,
) {
  const [updated] = await db
    .update(clients)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(eq(clients.id, clientId), eq(clients.masterId, masterId)),
    )
    .returning();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "CLIENT_NOT_FOUND" });
  }

  return updated;
}
