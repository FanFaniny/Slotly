import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

import { masters } from "./masters.js";
import { services } from "./services.js";

export const slotHolds = pgTable(
  "slot_holds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    masterId: uuid("master_id")
      .notNull()
      .references(() => masters.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    bookingId: uuid("booking_id"),
    clientIp: text("client_ip"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("slot_holds_master_expires_at_idx").on(
      table.masterId,
      table.expiresAt,
    ),
    index("slot_holds_master_starts_at_idx").on(table.masterId, table.startsAt),
    index("slot_holds_active_idx").on(
      table.masterId,
      table.expiresAt,
      table.bookingId,
    ),
  ],
);

export type SlotHold = typeof slotHolds.$inferSelect;
export type NewSlotHold = typeof slotHolds.$inferInsert;
