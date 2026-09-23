import type { Database } from "@slotly/db";
import { desc, isNotNull } from "drizzle-orm";
import { reviews, type NewReview } from "@slotly/db/schema";

export async function getReviews(db: Database) {
    const result= await db
    .select({
        id: reviews.id,
        rating: reviews.rating,   
        comment: reviews.comment})
    .from(reviews)
    .where(
        isNotNull(reviews.comment)
    )
    .orderBy(
        desc(reviews.createdAt),
        desc(reviews.rating)
    )
    .limit(2)

    return result;
    };

export async function createReview(db: Database, { userId, username, rating, comment }: NewReview) {
        const result = await db
            .insert(reviews)
            .values({
                userId,
                username,
                rating,
                comment,
            })
            .returning()
            return result
    
    
}
