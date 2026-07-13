import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const masters = pgTable(
  "masters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    timezone: text("timezone").notNull().default("UTC"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("masters_user_id_idx").on(table.userId),
    uniqueIndex("masters_username_idx").on(table.username),
    uniqueIndex("masters_email_idx").on(table.email),
  ],
);

export type Master = typeof masters.$inferSelect;
export type NewMaster = typeof masters.$inferInsert;
