import { z } from "zod";

import { requireMaster } from "../../lib/master.js";
import { listClients, updateClient } from "../../services/admin/clients.js";
import { protectedProcedure, router } from "../../trpc.js";

export const adminClientsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return listClients(ctx.db, master.id, input?.search);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(120).optional(),
        phone: z.string().min(3).max(32).optional(),
        email: z.string().email().optional().or(z.literal("")),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      const { id, ...data } = input;
      return updateClient(ctx.db, master.id, id, data);
    }),
});
