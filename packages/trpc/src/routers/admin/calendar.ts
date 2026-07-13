import { z } from "zod";

import { requireMaster } from "../../lib/master.js";
import {
  createBlockedTime,
  deleteBlockedTime,
  getCalendarEvents,
  listBookings,
  updateBookingStatus,
} from "../../services/admin/calendar.js";
import { protectedProcedure, router } from "../../trpc.js";

const dateRangeInput = z.object({
  rangeStart: z.string().datetime(),
  rangeEnd: z.string().datetime(),
});

export const adminCalendarRouter = router({
  getEvents: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return getCalendarEvents(
        ctx.db,
        master.id,
        input.rangeStart,
        input.rangeEnd,
      );
    }),

  listBookings: protectedProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return listBookings(
        ctx.db,
        master.id,
        input.rangeStart,
        input.rangeEnd,
      );
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        status: z.enum([
          "pending",
          "confirmed",
          "cancelled",
          "completed",
          "no_show",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return updateBookingStatus(
        ctx.db,
        master.id,
        input.bookingId,
        input.status,
      );
    }),

  createBlockedTime: protectedProcedure
    .input(
      z.object({
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
        reason: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return createBlockedTime(ctx.db, master.id, input);
    }),

  deleteBlockedTime: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return deleteBlockedTime(ctx.db, master.id, input.id);
    }),
});
