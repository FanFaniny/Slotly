import { eq } from "drizzle-orm";
import { masters } from "@slotly/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publicProcedure, protectedProcedure, router } from "../trpc.js";

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => ctx.session),

  getMaster: protectedProcedure.query(async ({ ctx }) => {
    const master = await ctx.db.query.masters.findFirst({
      where: eq(masters.userId, ctx.session.user.id),
      with: { settings: true },
    });

    if (!master) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "MASTER_PROFILE_NOT_FOUND",
      });
    }

    return master;
  }),

  checkUsername: publicProcedure
    .input(z.object({ username: z.string().min(3).max(32) }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.query.masters.findFirst({
        where: eq(masters.username, input.username),
        columns: { id: true },
      });

      return { available: !existing };
    }),
});
