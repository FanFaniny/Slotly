import * as React from "react";

interface FeedbackReview {
    id: string;
    rating: number;
    comment?: string | null;
}

interface FeedbackWidgetProps {
    handleFeedback: (feedback: string, rating: number) => void;
    findReviews?: FeedbackReview[];
}

export function FeedbackWidget({
    handleFeedback,
    findReviews = [],
}: FeedbackWidgetProps) {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const [feedback, setFeedback] = React.useState<string>("");
    const [rating, setRating] = React.useState<number>(5);

    return (
        <div>
            <div className="fixed bottom-4 right-4 z-50">
                <button onClick={() => setIsOpen(!isOpen)}>
                    +
                </button>
            </div>
            {isOpen && (
                <div className="fixed bottom-4 right-4 z-50">
                    {findReviews.length > 0 ? (
                        findReviews.map((review: FeedbackReview) => (
                            <div key={String(review.id ?? review.rating ?? "review")} className="bg-white p-2 rounded shadow mb-2">
                                <p>Rating: {review.rating}</p>
                                {review.comment && <p>Comment: {review.comment}</p>}
                            </div>
                        ))
                    ) : (
                        <p className="bg-white p-2 rounded shadow mb-2">No reviews yet.</p>
                    )}
                    <div className="bg-white p-4 rounded shadow-lg">
                        <label>add rating</label>
                        <input type="number" min="1" max="5" placeholder="Rating (1-5)" required value={rating} onChange={(e) => setRating(parseInt(e.target.value))} />
                        <h2 className="text-lg font-bold mb-2">Feedback</h2>
                        <textarea className="w-full h-32 p-2 border rounded"
                         placeholder="Your feedback..."
                         value={feedback}
                         onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
                         />
                        <button onClick={() => handleFeedback(feedback, rating)}
                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
                    </div>
                </div>
            )}
        </div>
    );
}
