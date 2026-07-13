import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { masters } from "./masters.js";
import type { BookingFormSchema } from "./types.js";

export const masterSettings = pgTable(
  "master_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    masterId: uuid("master_id")
      .notNull()
      .references(() => masters.id, { onDelete: "cascade" }),
    bufferMin: integer("buffer_min").notNull().default(0),
    minAdvanceHours: integer("min_advance_hours").notNull().default(1),
    horizonDays: integer("horizon_days").notNull().default(30),
    bookingFormSchema: jsonb("booking_form_schema")
      .$type<BookingFormSchema>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("master_settings_master_id_idx").on(table.masterId)],
);

export type MasterSettings = typeof masterSettings.$inferSelect;
export type NewMasterSettings = typeof masterSettings.$inferInsert;
