import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoreReviews } from "../api/review";
import { formatReviewDate } from "../utils/date";

interface ReviewListProps {
    showEvidence: boolean;
    onlyUnanalyzed: boolean;
    reviewList: Review[];
    isLoading: boolean;
    error: string | null;
}

interface Review {
  id: number;
  rating: number;
  content: string;
  reviewedDate?: string;
  source?: string;
  isAnalyzed?: boolean;
}

export default function ReviewList({ showEvidence, onlyUnanalyzed, reviewList, isLoading, error } : ReviewListProps ) {
    
    const [currentPage, setCurrentPage] = useState<number>(1);

    const ITEMS_PER_PAGE = 6;

    useEffect(() => {
      setCurrentPage(1);
    }, [showEvidence, onlyUnanalyzed]);

    const filteredList = onlyUnanalyzed
      ? reviewList.filter((r) => !r.isAnalyzed)
      : reviewList;

    const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);

    const displayedList = showEvidence
      ? filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
      : filteredList.slice(0, 3);

    if (isLoading)
      return <div className="p-5 text-xs text-muted-foreground">리뷰 불러오는 중</div>;
    if (error)
      return <div className="p-5 text-xs text-red-500">{error}</div>
      
    if (displayedList.length === 0) {
      return (
        <div className="p-5 text-xs text-center text-muted-foreground">
          {onlyUnanalyzed ? "모든 리뷰가 분석되었습니다." : "등록된 리뷰가 없습니다."}
        </div>
      )
    }


    return(
        <div className="space-y-3">
          {displayedList.map((r) => (
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
          {showEvidence && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground select-none">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded transition-colors hover:bg-[#246BFD]/80 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="이전 페이지"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="font-medium">
                <span className="text-foreground">{currentPage}</span> / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded transition-colors hover:bg-[#246BFD]/80 disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="다음 페이지"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
    );
}