import { eq } from "drizzle-orm";
import { masters } from "@slotly/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  getMasterAvailableSlots,
  getPublicAvailableDates,
  getPublicAvailableSlots,
} from "../services/availability.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

const usernameServiceInput = z.object({
  username: z.string().min(3).max(32),
  serviceId: z.string().uuid(),
});

const localDateInput = usernameServiceInput.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const publicAvailabilityRouter = router({
  getDates: publicProcedure
    .input(usernameServiceInput)
    .query(({ ctx, input }) =>
      getPublicAvailableDates(ctx.db, input.username, input.serviceId),
    ),

  getSlots: publicProcedure
    .input(localDateInput)
    .query(({ ctx, input }) =>
      getPublicAvailableSlots(
        ctx.db,
        input.username,
        input.serviceId,
        input.date,
      ),
    ),
});

export const adminAvailabilityRouter = router({
  getSlots: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .query(async ({ ctx, input }) => {
      const master = await ctx.db.query.masters.findFirst({
        where: eq(masters.userId, ctx.session.user.id),
        columns: { id: true },
      });

      if (!master) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "MASTER_PROFILE_NOT_FOUND",
        });
      }

      return getMasterAvailableSlots(
        ctx.db,
        master.id,
        input.serviceId,
        input.date,
      );
    }),
});
