import { useCallback, useEffect, useState } from "react";
import { getStoreReviews, type Review } from "../api/review";

export function useReviewStats(storeId: number | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!storeId) {
      setReviews([]);
      setLoading(false);
      return Promise.resolve();
    }

    setLoading(true);
    setError(null);

    return getStoreReviews(storeId)
      .then(setReviews)
      .catch((requestError) => {
        console.error("리뷰 데이터를 불러오지 못했습니다:", requestError);
        setReviews([]);
        setError("리뷰를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;

  return {
    reviewCount,
    averageRating,
    reviews,
    loading,
    error,
    refetch,
  };
}
