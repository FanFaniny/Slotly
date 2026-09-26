import {
    pgTable,
    text,
    timestamp,
    uuid,
    index,
    integer
} from "drizzle-orm/pg-core";

import { masters } from "./masters.js";

export const reviews = pgTable(
    "reviews",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
        .notNull()
        .references(() => masters.id, { onDelete: "cascade" }),
        username: text("username").notNull(),
        rating: integer("rating").notNull(),
        comment: text("comment"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("reviews_user_id_idx").on(table.userId),
        index("reviews_rating_idx").on(table.rating),
        index("reviews_created_at_idx").on(table.createdAt)
    ],
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;