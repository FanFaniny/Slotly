import {
  boolean,
  integer,
  pgTable,
  time,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

import { masters } from "./masters.js";

export const workScheduleBlocks = pgTable(
  "work_schedule_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    masterId: uuid("master_id")
      .notNull()
      .references(() => masters.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("work_schedule_blocks_master_day_idx").on(
      table.masterId,
      table.dayOfWeek,
    ),
  ],
);

export type WorkScheduleBlock = typeof workScheduleBlocks.$inferSelect;
export type NewWorkScheduleBlock = typeof workScheduleBlocks.$inferInsert;
