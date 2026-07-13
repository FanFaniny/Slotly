import { z } from "zod";

import { getMasterProfile } from "../../services/public/profile.js";
import { publicProcedure, router } from "../../trpc.js";

export const publicProfileRouter = router({
  getMasterProfile: publicProcedure
    .input(z.object({ username: z.string().min(3).max(32) }))
    .query(({ ctx, input }) => getMasterProfile(ctx.db, input.username)),
});
