import { useEffect, useState } from "react";
import { Star, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { PageShell } from "../../../shared/components/PageShell";
import ReviewList from "./components/ReviewList";
import { analyzeRequest, AspectStat, getAspectStat, getStoreReviews } from "./api/review";
import AspectBarChart from "./components/AspectBarChart";

const ASPECT_DATA = [
  { aspect: "맛", score: 4.7, prev: 4.6 },
  { aspect: "서비스", score: 4.5, prev: 4.4 },
  { aspect: "편의성", score: 4.4, prev: 4.3 },
  { aspect: "가격", score: 3.9, prev: 4.0 },
  { aspect: "분위기", score: 4.2, prev: 4.1 },
];

const TREND_DATA = [
  { week: "6/23", avg: 4.4, negative: 8 },
  { week: "6/30", avg: 4.3, negative: 10 },
  { week: "7/7", avg: 4.2, negative: 14 },
  { week: "7/14", avg: 4.2, negative: 22 },
  { week: "7/20", avg: 4.1, negative: 28 },
];

const TOPIC_CLUSTERS = [
  { name: "대기시간이 길다", count: 34, change: 300, urgent: true },
  { name: "커피 맛이 좋다", count: 128, change: 8, urgent: false },
  { name: "직원이 친절하다", count: 89, change: 3, urgent: false },
  { name: "가격이 비싸다", count: 42, change: 25, urgent: false },
  { name: "자리가 협소하다", count: 18, change: 12, urgent: false },
];

const RADAR_DATA = ASPECT_DATA.map(a => ({ subject: a.aspect, A: a.score * 20, B: a.prev * 20, fullMark: 100 }));

interface Review {
  id: number;
  rating: number;
  content: string;
  reviewedDate?: string;
  source?: string;
  isAnalyzed?: boolean;
}

export function ReviewsPage() {
  const [showEvidence, setShowEvidence] = useState(false);
  const [onlyUnanalyzed, setOnlyUnanalyzed] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState<boolean>(true);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [aspectStats, setAspectStats] = useState<AspectStat[]>([]);
  const [statLoading, setStatLoading] = useState<boolean>(true);
  const [statError, setStatError] = useState<string | null>(null);

  const storeId = 1;

  useEffect(() => {
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
    getStoreReviews(storeId)
      .then((data) => {
        setReviewList(data);
      })
      .catch((err) => {
        console.error("리뷰 데이터를 불러오는데 실패했습니다:", err);
        setReviewError("리뷰를 불러오지 못했습니다.");
      })
      .finally(() => {
        setReviewLoading(false);
      });
  }, []);

  const handleAnalyzeReview = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      await analyzeRequest(storeId);
      alert('리뷰 분석이 완료되었습니다.');

      getStoreReviews(storeId);
    } catch (error) {
      console.error(error);
      alert('분석 요청 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: "평균 평점", value: "4.2", sub: "/ 5.0" },
          { label: "리뷰 수", value: `${reviewList.length}개`, sub: "최근 3개월" },
          { label: "긍정 비율", value: `${positiveRate}`, sub: "▲ 5%p" },
          { label: "부정 비율", value: `${negativeRate}`, sub: "▲ 8%p" },
          { label: "답변 비율", value: "62%", sub: "" },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
            <div className="text-xl font-bold tabular-nums">{m.value}<span className="text-sm font-normal text-muted-foreground ml-1">{m.sub}</span></div>
          </div>
        ))}
      </div>
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Radar chart */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">속성별 평점</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#DDE3EC" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#667085" }} />
                <Radar key="radar-current" name="이번 달" dataKey="A" stroke="#246BFD" fill="#246BFD" fillOpacity={0.2} strokeWidth={2} />
                <Radar key="radar-prev" name="지난 달" dataKey="B" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
                <Tooltip formatter={(v: number) => [(v / 20).toFixed(1)]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-[#246BFD] rounded" />이번 달</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-[#8B5CF6] rounded" />지난 달</div>
          </div>
        </div>

        {/* Trend chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-1">리뷰 추이</h3>
          <p className="text-xs text-muted-foreground mb-4">최근 5주</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="reviewAvgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#246BFD" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#246BFD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" domain={[3.5, 5]} tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area key="area-avg" yAxisId="left" type="monotone" dataKey="avg" stroke="#246BFD" fill="url(#reviewAvgGrad)" strokeWidth={2} name="평균 평점" />
                <Area key="area-negative" yAxisId="right" type="monotone" dataKey="negative" stroke="#D92D20" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="부정 리뷰 수" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
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

      {/* Rising alert */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800">'대기시간이 길다' 관련 언급이 최근 2주 동안 3배 증가했습니다.</p>
          <p className="text-xs text-red-600 mt-0.5">해당 이슈가 지속될 경우 평균 평점 0.3~0.5 하락이 예상됩니다. AI 전략 추천에서 개선 전략을 확인하세요.</p>
        </div>
      </div>

      {/* Topic clusters */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <h3 className="font-bold mb-4">주요 언급 토픽</h3>
        <div className="space-y-2.5">
          {TOPIC_CLUSTERS.map((t) => (
            <div key={t.name} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">{t.name}</span>
                  {t.urgent && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${t.urgent ? "bg-red-400" : "bg-[#246BFD]"}`}
                    style={{ width: `${Math.min(100, (t.count / 150) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold tabular-nums">{t.count}건</div>
                <div className={`text-xs font-semibold ${t.change > 20 ? "text-red-500" : "text-muted-foreground"}`}>
                  {t.change > 0 ? `+${t.change}%` : `${t.change}%`}
                </div>
              </div>
            </div>
          ))}
        </div>
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
        />
        {/* <div className="space-y-3">
          {(showEvidence ? REVIEW_DATA : REVIEW_DATA.slice(0, 3)).map((r) => (
            <div key={r.id} className="pb-3 border-b border-border last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{r.source}</span>
                <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{r.content}</p>
            </div>
          ))}
        </div> */}
      </div>

      {/* AI improvement recommendations */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          <h3 className="font-bold">AI 개선 우선순위</h3>
        </div>
        <div className="space-y-3">
          {[
            { issue: "대기시간 단축", impact: "높음", urgency: "긴급", action: "주문 처리 프로세스 개선", expected: "부정 리뷰 -8~12%, 재방문 +5~8%" },
            { issue: "가격 납득도 개선", impact: "중간", urgency: "보통", action: "고품질 원재료 스토리 커뮤니케이션", expected: "가격 평점 +0.3~0.5" },
          ].map((r) => (
            <div key={r.issue} className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
              <div className="w-7 h-7 rounded-lg bg-[#246BFD]/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-[#246BFD]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">{r.issue}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.urgency === "긴급" ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"}`}>{r.urgency}</span>
                </div>
                <p className="text-xs text-muted-foreground">권장: {r.action}</p>
                <p className="text-xs text-[#0E9F6E] mt-0.5">예상 효과: {r.expected}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-3">※ AI 추정치이며 실제 효과는 다를 수 있습니다.</p>
      </div>
    </PageShell>
  );
}
