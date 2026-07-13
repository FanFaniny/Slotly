import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { blockedTimes } from "./blocked-times.js";
import { bookings } from "./bookings.js";
import { clients } from "./clients.js";
import { masterSettings } from "./master-settings.js";
import { masters } from "./masters.js";
import { services } from "./services.js";
import { slotHolds } from "./slot-holds.js";
import { workScheduleBlocks } from "./work-schedules.js";

const bookingFormFieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox"]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
      }),
    )
    .optional(),
});

export const selectMasterSchema = createSelectSchema(masters);
export const insertMasterSchema = createInsertSchema(masters, {
  timezone: z.string().min(1).default("UTC"),
});

export const selectMasterSettingsSchema = createSelectSchema(masterSettings);
export const insertMasterSettingsSchema = createInsertSchema(masterSettings, {
  bufferMin: z.number().int().min(0).default(0),
  minAdvanceHours: z.number().int().min(0).default(1),
  horizonDays: z.number().int().min(1).max(365).default(30),
  bookingFormSchema: z.array(bookingFormFieldSchema).default([]),
});

export const selectServiceSchema = createSelectSchema(services);
export const insertServiceSchema = createInsertSchema(services, {
  durationMin: z.number().int().min(5),
  priceCents: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const selectClientSchema = createSelectSchema(clients);
export const insertClientSchema = createInsertSchema(clients, {
  name: z.string().min(1),
  phone: z.string().min(3),
  email: z.string().email().optional().or(z.literal("")),
});

export const selectBookingSchema = createSelectSchema(bookings);
export const insertBookingSchema = createInsertSchema(bookings, {
  customFieldValues: z.record(z.union([z.string(), z.boolean(), z.number()])),
});

export const selectSlotHoldSchema = createSelectSchema(slotHolds);
export const insertSlotHoldSchema = createInsertSchema(slotHolds, {
  expiresAt: z.coerce.date(),
});

export const selectWorkScheduleBlockSchema =
  createSelectSchema(workScheduleBlocks);
export const insertWorkScheduleBlockSchema = createInsertSchema(
  workScheduleBlocks,
  {
    dayOfWeek: z.number().int().min(0).max(6),
  },
);

export const selectBlockedTimeSchema = createSelectSchema(blockedTimes);
export const insertBlockedTimeSchema = createInsertSchema(blockedTimes);
