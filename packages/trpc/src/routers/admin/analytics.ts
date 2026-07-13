import { z } from "zod";

import { requireMaster } from "../../lib/master.js";
import {
  getDashboardSummary,
  getRevenueAnalytics,
  getTopServices,
  getUtilization,
} from "../../services/admin/analytics.js";
import { protectedProcedure, router } from "../../trpc.js";

export const adminAnalyticsRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const master = await requireMaster(ctx.db, ctx.session.user.id);
    return getDashboardSummary(
      ctx.db,
      master.id,
      master.timezone,
      master.settings?.horizonDays ?? 30,
    );
  }),

  revenue: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return getRevenueAnalytics(ctx.db, master.id, input.days);
    }),

  topServices: protectedProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
        limit: z.number().int().min(1).max(10).default(3),
      }),
    )
    .query(async ({ ctx, input }) => {
      const master = await requireMaster(ctx.db, ctx.session.user.id);
      return getTopServices(ctx.db, master.id, input.days, input.limit);
    }),

  utilization: protectedProcedure.query(async ({ ctx }) => {
    const master = await requireMaster(ctx.db, ctx.session.user.id);
    return getUtilization(
      ctx.db,
      master.id,
      master.timezone,
      master.settings?.horizonDays ?? 30,
    );
  }),
});
