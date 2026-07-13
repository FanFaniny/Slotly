import type { Database } from "@slotly/db";
import type { BookingFormSchema } from "@slotly/db/schema";
import {
  masterSettings,
  masters,
  workScheduleBlocks,
} from "@slotly/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export interface ProfileUpdateInput {
  displayName?: string;
  timezone?: string;
  avatarUrl?: string | null;
}

export interface SettingsUpdateInput {
  bufferMin?: number;
  minAdvanceHours?: number;
  horizonDays?: number;
}

export interface WorkScheduleBlockInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export async function updateProfile(
  db: Database,
  masterId: string,
  input: ProfileUpdateInput,
) {
  const [updated] = await db
    .update(masters)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(masters.id, masterId))
    .returning();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "MASTER_NOT_FOUND" });
  }

  return updated;
}

export async function updateSettings(
  db: Database,
  masterId: string,
  input: SettingsUpdateInput,
) {
  const [updated] = await db
    .update(masterSettings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(masterSettings.masterId, masterId))
    .returning();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "SETTINGS_NOT_FOUND" });
  }

  return updated;
}

export async function updateFormSchema(
  db: Database,
  masterId: string,
  schema: BookingFormSchema,
) {
  const [updated] = await db
    .update(masterSettings)
    .set({ bookingFormSchema: schema, updatedAt: new Date() })
    .where(eq(masterSettings.masterId, masterId))
    .returning();

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "SETTINGS_NOT_FOUND" });
  }

  return updated.bookingFormSchema;
}

export async function getWorkSchedule(db: Database, masterId: string) {
  return db
    .select()
    .from(workScheduleBlocks)
    .where(eq(workScheduleBlocks.masterId, masterId))
    .orderBy(asc(workScheduleBlocks.dayOfWeek), asc(workScheduleBlocks.startTime));
}

export async function replaceWorkSchedule(
  db: Database,
  masterId: string,
  blocks: WorkScheduleBlockInput[],
) {
  await db
    .delete(workScheduleBlocks)
    .where(eq(workScheduleBlocks.masterId, masterId));

  if (blocks.length === 0) return [];

  const created = await db
    .insert(workScheduleBlocks)
    .values(
      blocks.map((block) => ({
        masterId,
        dayOfWeek: block.dayOfWeek,
        startTime: block.startTime,
        endTime: block.endTime,
        isActive: block.isActive ?? true,
      })),
    )
    .returning();

  return created;
}
