export interface ItemReviewInput {
  productId: string;
  name: string;
  image?: string | null;
  rating?: number | null;
  comment?: string | null;
}

export interface ReviewBody {
  rating: number;
  comment?: string;
  itemReviews?: ItemReviewInput[];
}

export interface SubmitReviewPayload {
  rating: number;
  comment?: string;
  itemReviews?: ItemReviewInput[];
}

export interface SubmitReviewResponse {
  message: string;
  reviewId: string;
}
