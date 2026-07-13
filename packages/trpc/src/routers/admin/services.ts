import { z } from "zod";

import { requireMaster } from "../../lib/master.js";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "../../services/admin/services.js";
import { protectedProcedure, router } from "../../trpc.js";

const serviceInput = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  durationMin: z.number().int().min(5).max(480),
  priceCents: z.number().int().min(0),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const adminServicesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const master = await requireMaster(ctx.db, ctx.session.user.id);
    return listServices(ctx.db, master.id);
  }),

  create: protectedProcedure
    .input(serviceInput)
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return createService(ctx.db, master.id, input);
    }),

  update: protectedProcedure
    .input(serviceInput.partial().extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      const { id, ...data } = input;
      return updateService(ctx.db, master.id, id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return deleteService(ctx.db, master.id, input.id);
    }),
});
