import { useEffect, useState } from "react";
import { getRecommendations, patchCompleteActionItem, Recommendations } from "../api/review";
import { Loader2, TrendingUp } from "lucide-react";
import ActionItemCard from "./ActionItemCard";

export default function AIRecommendation() {
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [data, setData] = useState<Recommendations | null>(null);

    const storeId = 1;

    useEffect(() => {
        getRecommendations(storeId)
        .then((res) => {
            setData(res);
        })
        .catch((err) => {
            console.error("AI 개선사항을 불러오는데 실패했습니다:", err);
            setError("AI 개선사항을 불러오지 못했습니다.");
        })
        .finally(() => {
            setLoading(false);
        });
    }, [storeId]);

    const handleComplete = async (keyword: string) => {
        if (!data) return;

        if (!confirm("실행 완료 처리하시겠습니까?\n실행 완료 시 처리가 불가합니다.")) return;

        try {
            await patchCompleteActionItem(data.recommendationId, keyword);

            setData((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    actionItems: prev.actionItems.map((item) =>
                        item.keyword === keyword
                            ? { ...item, executedAt: new Date().toISOString() }
                            : item
                    ),
                };
            });

            alert("실행 완료 처리되었습니다.");
        } catch (err) {
            console.error("완료 처리 실패:", err);
            alert("완료 처리에 실패했습니다.");
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> AI 개선사항을 불러오는 중입니다
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-sm text-red-500">
                {error}
            </div>
        )
    }

    if (!data) {
        return (
            <div className="p-8 text-center text-sm text-red-500">
                데이터가 없습니다.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {data.actionItems.map((item, idx) => (
            <ActionItemCard 
                key={idx} 
                item={item} 
                onComplete={() => handleComplete(item.keyword)}
            />
            ))}
        </div>
    );
}