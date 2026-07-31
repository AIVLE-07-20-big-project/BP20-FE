import { useEffect, useState } from "react";
import { getReviewKeywords, ReviewKeywords } from "../api/review";
import { AlertCircle, Loader2 } from "lucide-react";

export default function ReviewKeyword() {

    const [reviewKeywords, setReviewKeywords] = useState<ReviewKeywords[]>([]);

    const [reviewKeywordView, setReviewKeywordView] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    
    const storeId = 1;

    useEffect(() => {
        const fetchKeywords = async () => {
            try {
                setLoading(true);
                setError(false);
                const response = await getReviewKeywords(storeId);
                setReviewKeywords(response);
            } catch (e) {
                console.error("키워드를 불러오는데 실패하였습니다:", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchKeywords();
    }, [storeId]);

    if (loading) {
        return (
            <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> 키워드를 불러오는 중입니다
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-sm text-red-500">
                키워드를 불러오지 못했습니다.
            </div>
        )
    }

    if (reviewKeywords.length === 0) {
        return (
            <div className="p-8 text-center text-sm text-muted-foreground">
                분석된 주요 키워드가 없습니다.
            </div>
        );
    }

    const maxCount = Math.max(...reviewKeywords.map((k) => k.count), 1);

    return (
        <>
            <h3 className="font-bold mb-4">주요 언급 토픽</h3>
            <div className="space-y-2.5">
                {reviewKeywords.map((t) => {
                    const isNegative = t.sentiment === "부정";
                    return (
                        <div key={t.reviewKeywordId} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium truncate">{t.keyword}</span>
                                    {isNegative && (t.changeRate > 199) && (
                                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${
                                            isNegative ? "bg-red-400" : "bg-[#246BFD]"
                                        }`}
                                        style={{ width: `${Math.min(100, (t.count / maxCount) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex flex-col items-end">
                                <div className="text-sm font-bold tabular-nums">{t.count}건</div>
                                <div
                                    className={`text-xs font-semibold ${
                                        t.changeRate > 0
                                            ? "text-red-500"
                                            : t.changeRate < 0
                                            ? "text-blue-500"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {t.changeRate === null ? (
                                    <span className="text-xs text-[10px] text-green-600 rounded font-bold">• NEW</span>
                                    ) : (
                                    <div className={`text-xs font-semibold ${t.changeRate > 0 ? "text-red-500" : "text-blue-500"}`}>
                                        {t.changeRate > 0 ? `+${t.changeRate}%` : `${t.changeRate}%`}
                                    </div>
                                    )}
                                </div>
                                {/* <div
                                    className={`text-xs font-semibold ${
                                        isNegative ? "text-red-500" : "text-blue-500"
                                    }`}
                                >
                                    {t.sentiment}
                                </div> */}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}