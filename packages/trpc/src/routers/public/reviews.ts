import {z} from "zod";
import {protectedProcedure, publicProcedure, router} from "../../trpc.js";
import {createReview, getReviews} from "../../services/public/reviews.js";

const  createReviewInput = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().max(1000).optional(),
});

export const  reviewsRouter = router({
    createReview: protectedProcedure
        .input(createReviewInput)
        .mutation(({ctx, input}) => {
            return createReview(ctx.db, {
                userId: ctx.session.user.id,
                username: ctx.session.user.name,
                ...input,
            });
        }),

    getReviews: publicProcedure 
        .query(({ctx}) => getReviews(ctx.db)),
});