import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { PageShell } from "../../../shared/components/PageShell";
import ReviewList from "./components/ReviewList";
import { analyzeRequest, AspectStat, generateMonthlyReport, getAspectStat, getMonthlyReportStatus, getReviewTrend, ReviewTrend } from "./api/review";
import AspectBarChart from "./components/AspectBarChart";
import ReviewKeyword from "./components/ReviewKeyword";
import AIRecommendation from "./components/AIRecommendation";
import type { StoreOwnerLayoutContext } from "../../../app/layouts/StoreOwnerLayout";
import AspectRadarChart from "./components/AspectRadarChart";
import ReviewTrendChart from "./components/ReviewTrendChart";
import { useReviewStats } from "./hooks/useReviewStats";

export function ReviewsPage() {
  const [showEvidence, setShowEvidence] = useState(false);
  const [onlyUnanalyzed, setOnlyUnanalyzed] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingMonthlyReport, setIsGeneratingMonthlyReport] = useState<boolean>(false);
  const [monthlyReportGenerated, setMonthlyReportGenerated] = useState<boolean>(false);

  const [aspectStats, setAspectStats] = useState<AspectStat[]>([]);
  const [statLoading, setStatLoading] = useState<boolean>(true);
  const [statError, setStatError] = useState<string | null>(null);

  const [trendData, setTrendData] = useState<ReviewTrend[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  const { currentStoreId: storeId } = useOutletContext<StoreOwnerLayoutContext>();
  const {
    averageRating,
    reviews: reviewList,
    loading: reviewLoading,
    error: reviewError,
    refetch: refetchReviews,
  } = useReviewStats(storeId);
  const previousMonth = (() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  })();

  useEffect(() => {
    if (!storeId) return;
    getMonthlyReportStatus(storeId, previousMonth)
      .then((status) => setMonthlyReportGenerated(status.generated))
      .catch(() => setMonthlyReportGenerated(false));
  }, [storeId, previousMonth]);
  
  useEffect(() => {
    if (!storeId) return;

    getAspectStat(storeId)
      .then((data) => {
        setAspectStats(data);
      })
      .catch((err) => {
        console.error("리뷰 속성 통계를 불러오는데 실패했습니다:", err);
        setStatError("리뷰 속성 통계를 불러오지 못했습니다.");
      })
      .finally(() => {
        setStatLoading(false);
      });
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;

    getReviewTrend(storeId)
      .then(setTrendData)
      .catch((err) => {
        console.error("리뷰 추이를 불러오지 못했습니다:", err);
        setTrendData([]);
      })
      .finally(() => {
        setTrendLoading(false);
      });
  }, [storeId]);

  const handleAnalyzeReview = async () => {
    if (isAnalyzing || !storeId) return;

    setIsAnalyzing(true);
    try {
      await analyzeRequest(storeId);
      alert('리뷰 분석이 완료되었습니다.');

      await refetchReviews();
    } catch (error) {
      console.error(error);
      alert('분석 요청 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateMonthlyReport = async () => {
    if (isGeneratingMonthlyReport || monthlyReportGenerated || !storeId) return;

    setIsGeneratingMonthlyReport(true);
    try {
      await generateMonthlyReport(storeId, previousMonth);
      setMonthlyReportGenerated(true);
      alert(`${previousMonth} 월간 개선 리포트가 생성되었습니다.`);
    } catch (error) {
      console.error(error);
      alert("월간 개선 리포트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingMonthlyReport(false);
    }
  };

  const { totalPositive, totalNegative, totalSum } = aspectStats.reduce(
    (acc, stats) => {
      const itemSum = stats.positive + stats.neutral + stats.negative;
      return {
        totalPositive: acc.totalPositive + stats.positive,
        totalNegative: acc.totalNegative + stats.negative,
        totalSum: acc.totalSum + itemSum,
      };
    },
    { totalPositive: 0, totalNegative: 0, totalSum: 0 }
  );

  const positiveRate = totalSum > 0 ? ((totalPositive / totalSum) * 100).toFixed(1) : "0.0";
  const negativeRate = totalSum > 0 ? ((totalNegative / totalSum) * 100).toFixed(1) : "0.0";

  if (!storeId) return (
    <div>매장 정보를 불러오는 중입니다...</div>
  );

  return (
    <PageShell 
      title="리뷰 분석" 
      freshness="오늘 09:42 기준"
      actions={
        <div className="flex flex-col items-end gap-1">
          <button
            type='button'
            onClick={handleAnalyzeReview}
            disabled={isAnalyzing}
            className={`px-3.5 py-1.5 text-xs font-bold text-white inline-flex items-center ${isAnalyzing ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} rounded-lg shadow-sm transition-all`}
          >
            {isAnalyzing ?
            <>
              <svg
                className="w-3.5 h-3.5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>분석중</span>
            </> : '지금 분석'}
          </button>
          <span className="text-[11px] text-slate-400 font-normal">
            * 리뷰는 30개 단위로 자동 처리됩니다.
          </span>
        </div>
      }
    >
      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "평균 평점", value: averageRating.toFixed(1), sub: "/ 5.0" },
          { label: "리뷰 수", value: `${reviewList.length}개`, sub: "최근 3개월" },
          { label: "긍정 비율", value: `${positiveRate}`, sub: "▲ 5%p" },
          { label: "부정 비율", value: `${negativeRate}`, sub: "▲ 8%p" },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
            <div className="text-xl font-bold tabular-nums">{m.value}<span className="text-sm font-normal text-muted-foreground ml-1">{m.sub}</span></div>
          </div>
        ))}
      </div>
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <AspectRadarChart 
          aspectStats={aspectStats}
        />
        <ReviewTrendChart data={trendData} isLoading={trendLoading} />
        <div className="h-full p-6 bg-white lg:col-span-1 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-2">리뷰 속성 통계</h3>
          <p className="text-xs text-muted-foreground mb-4">
            손님들의 리뷰에서 언급된 5가지 속성 분포입니다.
          </p>
          <AspectBarChart 
            data={aspectStats}  
            isLoading={statLoading}
            error={statError}
          />
        </div>
      </div>

      {/* Topic clusters */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <ReviewKeyword storeId={storeId} />
      </div>

      {/* Recent reviews */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h3 className="font-bold">최근 리뷰</h3>
            <button
              type="button"
              onClick={() => setOnlyUnanalyzed(!onlyUnanalyzed)}
              className={`text-xs transition-colors cursor-pointer ${
                onlyUnanalyzed
                  ? "text-amber-600 font-semibold underline" 
                  : "text-slate-400 hover:text-slate-600 hover:underline" 
              }`}
            >
              미분석 리뷰만
            </button>
          </div>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="flex items-center gap-1 text-xs text-[#246BFD] font-semibold"
          >
            {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showEvidence ? "간단 보기" : "모두 보기"}
          </button>
        </div>
        <ReviewList
          showEvidence={showEvidence}
          onlyUnanalyzed={onlyUnanalyzed}
          reviewList={reviewList}
          isLoading={reviewLoading}
          error={reviewError}
          storeId={storeId}
          onReviewCreated={refetchReviews}
        />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4 justify-between">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          <h3 className="font-bold">AI 개선 우선순위</h3>
                  <button
            type="button"
            onClick={handleGenerateMonthlyReport}
            disabled={isGeneratingMonthlyReport || monthlyReportGenerated}
            className="ml-auto shrink-0 px-3.5 py-1.5 text-xs font-bold text-white inline-flex items-center bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 rounded-lg shadow-sm transition-all"
          >
            {monthlyReportGenerated
              ? `${previousMonth} 리포트 생성 완료`
              : isGeneratingMonthlyReport
                ? "월간 리포트 생성 중..."
                : `${previousMonth} 월간 리포트 생성`}
          </button>
        </div>
        <AIRecommendation storeId={storeId} />
        <p className="text-[11px] text-muted-foreground/60 mt-3">※ AI 추정치이며 실제 효과는 다를 수 있습니다.</p>
      </div>
    </PageShell>
  );
}
