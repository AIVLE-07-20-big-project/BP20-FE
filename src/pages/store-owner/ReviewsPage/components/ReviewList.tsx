import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoreReviews } from "../api/review";
import { formatReviewDate } from "../utils/date";

interface ReviewListProps {
    showEvidence: boolean;
}

interface Review {
  id: number;
  rating: number;
  content: string;
  reviewedDate?: string;
  source?: string;
  isAnalyzed?: boolean;
}

export default function ReviewList({ showEvidence } : ReviewListProps ) {
    
    const [reviewList, setReviewList] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      getStoreReviews(1)
        .then((data) => {
          setReviewList(data);
        })
        .catch((err) => {
          console.error("리뷰 데이터를 불러오는데 실패했습니다:", err);
          setError("리뷰를 불러오지 못했습니다.");
        })
        .finally(() => {
          setLoading(false);
        });
    }, []);

    if (loading)
      return <div className="p-5 text-xs text-muted-foreground">리뷰 불러오는 중</div>;
    if (error)
      return <div className="p-5 text-xs text-red-500">{error}</div>
    
    return(
        <div className="space-y-3">
          {(showEvidence ? reviewList : reviewList.slice(0, 3)).map((r) => (
            <div key={r.id} className="pb-3 border-b border-border last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{r.source}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatReviewDate(r.reviewedDate)}
                </span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{r.content}</p>
            </div>
          ))}
        </div>
    );
}