import type { Database } from "@slotly/db";
import { masters } from "@slotly/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export async function requireMaster(db: Database, userId: string) {
  const master = await db.query.masters.findFirst({
    where: eq(masters.userId, userId),
    with: { settings: true },
  });

  if (!master) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "MASTER_PROFILE_NOT_FOUND",
    });
  }

  return master;
}
