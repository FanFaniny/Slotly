import { z } from "zod";

import {
  confirmBooking,
  createHold,
  getBookingIcs,
} from "../services/booking.js";
import { publicProcedure, router } from "../trpc.js";

const createHoldInput = z.object({
  username: z.string().min(3).max(32),
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
});

const confirmBookingInput = z.object({
  holdId: z.string().uuid(),
  name: z.string().min(1).max(120),
  phone: z.string().min(3).max(32),
  email: z.string().email().optional(),
  comment: z.string().max(1000).optional(),
  customFieldValues: z
    .record(z.union([z.string(), z.boolean(), z.number()]))
    .optional(),
});

export const publicBookingRouter = router({
  createHold: publicProcedure
    .input(createHoldInput)
    .mutation(({ ctx, input }) =>
      createHold(ctx.db, {
        ...input,
        clientIp: ctx.clientIp,
      }),
    ),

  confirmBooking: publicProcedure
    .input(confirmBookingInput)
    .mutation(({ ctx, input }) => confirmBooking(ctx.db, input)),

  getIcs: publicProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .query(({ ctx, input }) => getBookingIcs(ctx.db, input.bookingId)),
});
