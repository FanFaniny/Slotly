import { relations } from "drizzle-orm";

import { blockedTimes } from "./blocked-times.js";
import { bookings } from "./bookings.js";
import { clients } from "./clients.js";
import { masterSettings } from "./master-settings.js";
import { masters } from "./masters.js";
import { services } from "./services.js";
import { slotHolds } from "./slot-holds.js";
import { workScheduleBlocks } from "./work-schedules.js";

export const mastersRelations = relations(masters, ({ one, many }) => ({
  settings: one(masterSettings, {
    fields: [masters.id],
    references: [masterSettings.masterId],
  }),
  services: many(services),
  clients: many(clients),
  bookings: many(bookings),
  slotHolds: many(slotHolds),
  workScheduleBlocks: many(workScheduleBlocks),
  blockedTimes: many(blockedTimes),
}));

export const masterSettingsRelations = relations(masterSettings, ({ one }) => ({
  master: one(masters, {
    fields: [masterSettings.masterId],
    references: [masters.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  master: one(masters, {
    fields: [services.masterId],
    references: [masters.id],
  }),
  bookings: many(bookings),
  slotHolds: many(slotHolds),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  master: one(masters, {
    fields: [clients.masterId],
    references: [masters.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  master: one(masters, {
    fields: [bookings.masterId],
    references: [masters.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  client: one(clients, {
    fields: [bookings.clientId],
    references: [clients.id],
  }),
}));

export const slotHoldsRelations = relations(slotHolds, ({ one }) => ({
  master: one(masters, {
    fields: [slotHolds.masterId],
    references: [masters.id],
  }),
  service: one(services, {
    fields: [slotHolds.serviceId],
    references: [services.id],
  }),
}));

export const workScheduleBlocksRelations = relations(
  workScheduleBlocks,
  ({ one }) => ({
    master: one(masters, {
      fields: [workScheduleBlocks.masterId],
      references: [masters.id],
    }),
  }),
);

export const blockedTimesRelations = relations(blockedTimes, ({ one }) => ({
  master: one(masters, {
    fields: [blockedTimes.masterId],
    references: [masters.id],
  }),
}));
