import { z } from "zod";

import { requireMaster } from "../../lib/master.js";
import {
  getWorkSchedule,
  replaceWorkSchedule,
  updateFormSchema,
  updateProfile,
  updateSettings,
} from "../../services/admin/settings.js";
import { protectedProcedure, router } from "../../trpc.js";

const formFieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox"]),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
});

export const adminSettingsRouter = router({
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(120).optional(),
        timezone: z.string().min(1).optional(),
        avatarUrl: z.string().url().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return updateProfile(ctx.db, master.id, input);
    }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        bufferMin: z.number().int().min(0).optional(),
        minAdvanceHours: z.number().int().min(0).optional(),
        horizonDays: z.number().int().min(1).max(365).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return updateSettings(ctx.db, master.id, input);
    }),

  updateFormSchema: protectedProcedure
    .input(z.object({ schema: z.array(formFieldSchema) }))
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return updateFormSchema(ctx.db, master.id, input.schema);
    }),

  getWorkSchedule: protectedProcedure.query(async ({ ctx }) => {
    const master = await requireMaster(ctx.db, ctx.session.user.id);
    return getWorkSchedule(ctx.db, master.id);
  }),

  replaceWorkSchedule: protectedProcedure
    .input(
      z.object({
        blocks: z.array(
          z.object({
            dayOfWeek: z.number().int().min(0).max(6),
            startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
            endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
            isActive: z.boolean().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return replaceWorkSchedule(ctx.db, master.id, input.blocks);
    }),
});
