import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Zap, Package, Star, TrendingDown, AlertCircle, ArrowRight,
  CloudRain, CheckCircle2, Clock, BarChart3,
  ChevronRight, Sparkles, Bot, X, Send, Flame
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import { MetricCard } from "../../shared/components/MetricCard";
import { useAuth } from "../../app/providers/AuthProvider";
import { AI_RECOMMENDATIONS, WEEKLY_SALES } from "../../mocks";
import { getAnalysis, getRecommendations } from "../../features/ai-analysis/api/aiAnalysisApi";
import type { AiAnalysisResult, AiRecommendationRun, DetailedDailySales } from "../../entities/ai-analysis/ai-analysis.types";

// SalesPage/AiStrategyPage와 동일한 세션 키 — 그 화면에서 완료한 매출 분석을 그대로 이어받는다.
const AI_ANALYSIS_ID_KEY = "bp20:ai-analysis-id";
const AI_ANALYSIS_OPTIONS_KEY = "bp20:ai-analysis-options";

function latestAnalysisIdFromSession(): string {
  try {
    const saved = JSON.parse(sessionStorage.getItem(AI_ANALYSIS_OPTIONS_KEY) ?? "[]");
    if (Array.isArray(saved) && saved[0]?.id) return saved[0].id;
  } catch {
    // 오래된 세션 값은 아래 fallback으로 처리한다.
  }
  return sessionStorage.getItem(AI_ANALYSIS_ID_KEY) ?? "";
}

// AiStrategyPage와 동일한 실행/측정/보류 판정 기준 — 대시보드도 같은 기준으로 집계한다.
const isRejectedRun = (run: AiRecommendationRun) => run.상태.includes("반려") || run.상태.includes("종료");
const isCompletedRun = (run: AiRecommendationRun) => Boolean(run.final_report);
const isMeasuringRun = (run: AiRecommendationRun) => run.상태.includes("효과");

function monthToDate(rows: DetailedDailySales[]) {
  if (!rows.length) return null;
  const latest = new Date(`${rows[rows.length - 1].date}T00:00:00`);
  const monthStart = new Date(latest.getFullYear(), latest.getMonth(), 1);
  const prevMonthStart = new Date(latest.getFullYear(), latest.getMonth() - 1, 1);
  const sum = (list: DetailedDailySales[], key: "revenue" | "transactionCount") =>
    list.reduce((total, row) => total + row[key], 0);
  const current = rows.filter((row) => new Date(`${row.date}T00:00:00`) >= monthStart);
  const previous = rows.filter((row) => {
    const date = new Date(`${row.date}T00:00:00`);
    return date >= prevMonthStart && date < monthStart;
  });
  const revenue = sum(current, "revenue");
  const transactions = sum(current, "transactionCount");
  const prevRevenue = sum(previous, "revenue");
  const prevTransactions = sum(previous, "transactionCount");
  return {
    revenue, transactions,
    revenueChange: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : undefined,
    transactionsChange: prevTransactions > 0 ? ((transactions - prevTransactions) / prevTransactions) * 100 : undefined,
  };
}

const dayOverDayChange = (rows: DetailedDailySales[], key: "revenue" | "transactionCount") => {
  if (rows.length < 2) return undefined;
  const latest = rows[rows.length - 1][key];
  const previous = rows[rows.length - 2][key];
  return previous > 0 ? ((latest - previous) / previous) * 100 : undefined;
};

const BRIEFING_ACTIONS = [
  {
    id: "r1",
    priority: "1순위",
    icon: Zap,
    iconBg: "bg-[#246BFD]/15",
    iconColor: "text-[#246BFD]",
    rowBg: "bg-[#EAF2FF]/60 border-[#BFD4FF]/60",
    category: "매출",
    categoryBadge: "text-[#246BFD] bg-[#246BFD]/10",
    title: "오후 2~5시 재방문 쿠폰 발송",
    detail: "해당 시간대 매출 +12~16% 예상",
    detailColor: "text-[#246BFD]",
    badge: "신뢰도 87%",
  },
  {
    id: "r2",
    priority: "2순위",
    icon: Package,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    rowBg: "bg-amber-50/80 border-amber-200/60",
    category: "재고",
    categoryBadge: "text-amber-700 bg-amber-100",
    title: "아이스 아메리카노 원두 2박스 발주",
    detail: "내일 16시 품절 예상",
    detailColor: "text-amber-600",
    badge: "신뢰도 94%",
  },
  {
    id: "r3",
    priority: "3순위",
    icon: BarChart3,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    rowBg: "bg-sky-50/60 border-sky-200/50",
    category: "수요 예측",
    categoryBadge: "text-sky-700 bg-sky-100",
    title: "샌드위치 밑작업 18개 준비",
    detail: "비 예보 — 배달 수요 +15% 예상",
    detailColor: "text-sky-600",
    badge: "날씨 보정",
  },
];

const RISK_ITEMS = [
  { icon: Package, color: "text-amber-500", bg: "bg-amber-50", label: "식재료 부족", detail: "원두 2.4kg — 내일 품절 예상", urgent: true },
  { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", label: "식빵 재고 품절", detail: "공급사 오늘 오전 주문 마감", urgent: true },
  { icon: TrendingDown, color: "text-amber-500", bg: "bg-amber-50", label: "식재료비 이상 감지", detail: "4주 평균 대비 +14% 상승", urgent: false },
  { icon: Star, color: "text-red-500", bg: "bg-red-50", label: "대기시간 리뷰 증가", detail: "최근 2주 3배 증가", urgent: false },
];

const REVIEW_ASPECTS = [
  { label: "맛", score: 4.7, pct: 94, color: "#246BFD" },
  { label: "친절도", score: 4.5, pct: 90, color: "#8B5CF6" },
  { label: "청결", score: 4.4, pct: 88, color: "#38BDF8" },
  { label: "가격", score: 3.9, pct: 78, color: "#D97706" },
  { label: "대기시간", score: 2.8, pct: 56, color: "#D92D20" },
];

const DONUT_DATA = REVIEW_ASPECTS.map(a => ({ name: a.label, value: a.pct, color: a.color }));

const SPARKLINE_DATA: Record<string, { v: number }[]> = {
  sales: [{ v: 980 }, { v: 1050 }, { v: 990 }, { v: 1120 }, { v: 1080 }, { v: 1247 }],
  orders: [{ v: 72 }, { v: 80 }, { v: 68 }, { v: 91 }, { v: 84 }, { v: 87 }],
  monthly: [{ v: 28 }, { v: 29.4 }, { v: 31.2 }, { v: 30.8 }, { v: 31.9 }, { v: 32.8 }],
  profit: [{ v: 7.8 }, { v: 8.1 }, { v: 7.9 }, { v: 8.4 }, { v: 8.2 }, { v: 8.42 }],
};

const KPI_CARDS = [
  { label: "오늘 매출", value: "1,247,000원", change: -5.2, period: "지난 월요일 대비", sparkKey: "sales" as const, positive: false },
  { label: "오늘 주문 건수", value: "87건", change: 2.4, period: "지난 월요일 대비", sparkKey: "orders" as const, positive: true },
  { label: "이번 달 예상 매출", value: "32,800,000원", change: 8.1, period: "지난달 대비", sparkKey: "monthly" as const, positive: true },
  { label: "예상 순이익", value: "8,420,000원", change: -1.8, period: "이번 달 예상", sparkKey: "profit" as const, positive: false },
];

const CHAT_SUGGESTIONS = [
  "오늘 매출이 지난주보다 낮은 이유는?",
  "어떤 매출 기반 전략 추천을 먼저 실행할까요?",
  "이번 주 재고 주문이 필요한 항목은?",
  "오늘 쿠폰 발송을 추천하는 이유는?",
];

interface DonutTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { name: string; value: number; color: string } }[];
}

function DonutTooltipContent({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const aspect = REVIEW_ASPECTS.find(a => a.label === d.name);
  return (
    <div className="bg-[#111A2E] text-white text-xs px-3 py-2 rounded-xl shadow-lg">
      <div className="font-bold mb-0.5">{d.name}</div>
      <div>{d.value}% ({aspect?.score.toFixed(1)} / 5.0)</div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [actionStates, setActionStates] = useState<Record<string, string>>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [recommendationRuns, setRecommendationRuns] = useState<AiRecommendationRun[]>([]);

  const isDashboard = location.pathname === "/store" || location.pathname === "/store/";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "좋은 아침이에요";
    if (h < 18) return "안녕하세요";
    return "수고하셨어요";
  };

  // 매출 분석·AI 전략 추천 화면에서 이미 만든 실제 데이터를 그대로 이어받는다 — 실패해도
  // 대시보드 전체가 깨지지 않도록 각각 조용히 무시하고 아래 mock 데이터로 대체 표시한다.
  useEffect(() => {
    const analysisId = latestAnalysisIdFromSession();
    if (analysisId) getAnalysis(analysisId).then(setAnalysis).catch(() => undefined);
    getRecommendations().then(setRecommendationRuns).catch(() => undefined);
  }, []);

  const isRunningRun = (run: AiRecommendationRun) => Boolean(
    !run.대기중_승인 && !isCompletedRun(run) && !isRejectedRun(run) && !isMeasuringRun(run),
  );
  const hasRealRecommendations = recommendationRuns.length > 0;
  const executed = hasRealRecommendations
    ? recommendationRuns.filter(isCompletedRun).length
    : AI_RECOMMENDATIONS.filter(r => r.status === "효과 확인").length;
  const running = hasRealRecommendations
    ? recommendationRuns.filter(isRunningRun).length
    : AI_RECOMMENDATIONS.filter(r => r.status === "실행 예정").length;
  const pending = hasRealRecommendations
    ? recommendationRuns.filter((run) => Boolean(run.대기중_승인)).length
    : AI_RECOMMENDATIONS.length - executed - running;

  const allDailySales = analysis?.detailed_analysis?.dailySales ?? [];
  const latestDay = allDailySales.length ? allDailySales[allDailySales.length - 1] : null;
  const monthly = analysis ? monthToDate(allDailySales) : null;
  const rootCause = analysis?.detailed_analysis?.rootCauseAnalysis;
  const quarterlyInsight = analysis?.report?.["분석결과 해설"];

  const formatWon = (value: number) => `${Math.round(value).toLocaleString()}원`;
  const salesSpark = allDailySales.slice(-6).map((row) => ({ v: row.revenue }));
  const ordersSpark = allDailySales.slice(-6).map((row) => ({ v: row.transactionCount }));
  const kpiCards = latestDay && monthly && salesSpark.length >= 2 ? [
    {
      label: "오늘 매출", value: formatWon(latestDay.revenue),
      change: dayOverDayChange(allDailySales, "revenue"), period: "전일 대비",
      sparkData: salesSpark, positive: (dayOverDayChange(allDailySales, "revenue") ?? 0) >= 0,
    },
    {
      label: "오늘 거래 건수", value: `${latestDay.transactionCount.toLocaleString()}건`,
      change: dayOverDayChange(allDailySales, "transactionCount"), period: "전일 대비",
      sparkData: ordersSpark, positive: (dayOverDayChange(allDailySales, "transactionCount") ?? 0) >= 0,
    },
    {
      label: "이번 달 매출", value: formatWon(monthly.revenue),
      change: monthly.revenueChange, period: "지난달 대비",
      sparkData: salesSpark, positive: (monthly.revenueChange ?? 0) >= 0,
    },
    {
      label: "이번 달 거래 건수", value: `${monthly.transactions.toLocaleString()}건`,
      change: monthly.transactionsChange, period: "지난달 대비",
      sparkData: ordersSpark, positive: (monthly.transactionsChange ?? 0) >= 0,
    },
  ] : KPI_CARDS.map((card) => ({ ...card, sparkData: SPARKLINE_DATA[card.sparkKey] as { v: number }[] }));

  const sendChat = () => {
    const msg = chatMsg.trim();
    if (!msg) return;
    setChatLog(l => [...l, { role: "user", text: msg }]);
    setChatMsg("");
    setTimeout(() => {
      setChatLog(l => [...l, { role: "ai", text: "AI 분석 중입니다. 잠시 후 인사이트를 제공해 드릴게요." }]);
    }, 800);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{greeting()}, {user?.name || "김민지"} 점주님</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>2025년 7월 20일 월요일</span>
              <span className="flex items-center gap-1"><CloudRain className="w-3.5 h-3.5 text-[#38BDF8]" /> 비 · 최고 27°C</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-xl px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E9F6E] animate-pulse" />
            오늘 09:42 기준
          </div>
        </div>

        {/* AI 경영 인사이트 Hero (purple) */}
        <div className="rounded-2xl p-5 mb-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 40%, #7C3AED 100%)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#8B5CF6]/30 to-transparent rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-gradient-to-tr from-[#246BFD]/20 to-transparent rounded-full" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-white/70 uppercase tracking-widest">AI 경영 인사이트</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1.5">
              {monthly?.revenueChange != null
                ? `사장님, 이번 달 매출이 지난달 대비 ${Math.abs(monthly.revenueChange).toFixed(1)}% ${monthly.revenueChange >= 0 ? "상승" : "하락"}했습니다.`
                : analysis
                  ? (rootCause?.headline ?? "사장님, 매출 분석 결과를 확인해 보세요.")
                  : "사장님, 이번 주 매출이 지난주 대비 15% 상승했습니다."}
            </h2>
            <p className="text-sm text-white/75 mb-4">
              {analysis
                ? (quarterlyInsight || rootCause?.narrative || "매출 분석에서 데이터 기반 인사이트를 확인할 수 있습니다.")
                : "배달 주문 증가가 성장을 견인했습니다. 금요일 14~17시 재방문 쿠폰 실행을 추천합니다."}
            </p>
            <button
              onClick={() => navigate("/store/sales")}
              className="inline-flex items-center gap-1.5 bg-white text-[#7C3AED] text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/90 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              매출 분석 바로가기 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 오늘의 운영 브리핑 */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-[#246BFD]/10 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-[#246BFD]" />
            </div>
            <span className="text-xs font-bold text-foreground">오늘의 운영 브리핑</span>
            <span className="text-xs text-muted-foreground ml-auto">AI 분석 · 신뢰도 기반 순위</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4 pl-8">AI 인사이트를 바탕으로 오늘 우선 확인하고 실행할 작업입니다.</p>

          <div className="space-y-2.5">
            {BRIEFING_ACTIONS.map((action) => {
              const Icon = action.icon;
              const state = actionStates[action.id];
              return (
                <div key={action.id} className={`flex items-center gap-3 border rounded-xl p-3 transition-colors hover:brightness-95 ${action.rowBg}`}>
                  <div className={`w-8 h-8 rounded-xl ${action.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${action.categoryBadge}`}>{action.category}</span>
                      <span className="text-[11px] text-muted-foreground">{action.badge}</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground truncate">{action.title}</div>
                    <div className={`text-xs mt-0.5 ${action.detailColor}`}>{action.detail}</div>
                  </div>
                  {!state && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => navigate("/store/actions/" + action.id)} className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">자세히</button>
                      <button onClick={() => setActionStates(s => ({ ...s, [action.id]: "executed" }))} className="text-[11px] bg-[#246BFD] text-white px-2.5 py-1 rounded-lg hover:bg-[#1D4ED8] transition-colors font-semibold">실행</button>
                      <button onClick={() => setActionStates(s => ({ ...s, [action.id]: "later" }))} className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors">나중에</button>
                    </div>
                  )}
                  {state === "executed" && <CheckCircle2 className="w-5 h-5 text-[#0E9F6E] flex-shrink-0" />}
                  {state === "later" && <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* KPI Row with sparklines */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {kpiCards.map((k, i) => {
            const sparkColor = k.positive ? "#0E9F6E" : "#D92D20";
            const sparkId = `spark-${i}`;
            return (
              <div key={k.label} className="bg-card border border-border rounded-2xl p-4 group relative">
                <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
                <div className="text-xl font-black tabular-nums mb-0.5">{k.value}</div>
                <div className={`text-xs font-semibold mb-2 ${k.change == null ? "text-muted-foreground" : k.positive ? "text-[#0E9F6E]" : "text-[#D92D20]"}`}>
                  {k.change == null ? `비교 데이터 없음 · ${k.period}` : `${k.positive ? "▲" : "▼"} ${Math.abs(k.change).toFixed(1)}% ${k.period}`}
                </div>
                <div className="h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={k.sparkData}>
                      <defs>
                        <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={sparkColor} fill={`url(#${sparkId})`} strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#111A2E] text-white text-[11px] px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  <div className="font-bold">{k.label}</div>
                  <div>{k.value}</div>
                  <div className={k.change == null ? "text-muted-foreground" : k.positive ? "text-[#0E9F6E]" : "text-[#F87171]"}>
                    {k.change == null ? "비교 데이터 없음" : `${k.positive ? "▲" : "▼"} ${Math.abs(k.change).toFixed(1)}% (${k.period})`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sales trend - 2 cols */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">매출 추이</h3>
                <p className="text-xs text-muted-foreground">{allDailySales.length ? "업로드 POS 최근 7일" : "최근 7일"}</p>
              </div>
              {!allDailySales.length && (
                <div className="flex gap-3 text-xs">
                  {[{ label: "온라인", color: "#8B5CF6" }, { label: "오프라인", color: "#246BFD" }].map((t) => (
                    <div key={t.label} className="flex items-center gap-1 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                      {t.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={allDailySales.length
                  ? allDailySales.slice(-7).map((row) => ({ date: row.date.slice(5).replace("-", "."), offline: row.revenue }))
                  : WEEKLY_SALES}>
                  <defs>
                    <linearGradient id="dashOfflineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#246BFD" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#246BFD" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dashOnlineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v: number, name: string) => [`₩${v.toLocaleString()}`, name === "offline" ? (allDailySales.length ? "매출" : "오프라인") : "온라인"]} />
                  <Area key="dash-area-offline" type="monotone" dataKey="offline" stroke="#246BFD" fill="url(#dashOfflineGrad)" strokeWidth={2} />
                  {!allDailySales.length && (
                    <Area key="dash-area-online" type="monotone" dataKey="online" stroke="#8B5CF6" fill="url(#dashOnlineGrad)" strokeWidth={2} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 bg-[#246BFD]/8 rounded-xl px-3 py-2 text-xs text-[#246BFD] font-medium">
              <Sparkles className="w-3 h-3 inline mr-1" />
              {allDailySales.length
                ? "실제 업로드된 POS 데이터를 반영한 최근 매출 추이입니다."
                : "AI 분석: 비 예보로 오프라인 방문 감소 예상. 배달·온라인 채널 강화를 권장합니다."}
            </div>
          </div>

          {/* Risk card */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">지금 확인할 위험</h3>
              <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-semibold">4건</span>
            </div>
            <div className="space-y-2.5">
              {RISK_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">{item.label}</span>
                        {item.urgent && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">긴급</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{item.detail}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review pulse with donut */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">리뷰 현황</h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold">4.2</span>
                <span className="text-xs text-muted-foreground">/5</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Donut chart */}
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={DONUT_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={50}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {DONUT_DATA.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Bar aspects */}
              <div className="flex-1 space-y-2">
                {REVIEW_ASPECTS.map((a) => (
                  <div key={a.label} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-12 text-muted-foreground">{a.label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(a.score / 5) * 100}%`, background: a.color }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums w-6 text-right">{a.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-2.5 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              '대기시간' 관련 언급이 2주간 3배 증가
            </div>
          </div>

          {/* AI action stats */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">AI 추천 현황</h3>
              <button onClick={() => navigate("/store/recommendations/history")} className="text-xs text-[#246BFD] font-semibold hover:underline flex items-center gap-0.5">
                전체 보기 <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "실행 완료", value: executed, color: "text-[#0E9F6E]", bg: "bg-[#0E9F6E]/10" },
                { label: "실행 중", value: running, color: "text-[#246BFD]", bg: "bg-[#246BFD]/10" },
                { label: "추천됨", value: pending, color: "text-[#D97706]", bg: "bg-amber-50" },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/store/actions")} className="w-full text-xs text-center text-[#246BFD] font-semibold py-2 bg-[#246BFD]/5 hover:bg-[#246BFD]/10 rounded-xl transition-colors">
              추천 실행하기
            </button>
          </div>
        </div>
      </div>

      {/* Floating AI chatbot — dashboard only */}
      {isDashboard && (
        <>
          {/* Drawer */}
          {chatOpen && (
            <div className="fixed bottom-20 right-4 lg:right-6 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden" style={{ maxHeight: "70vh" }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-gradient-to-r from-[#246BFD]/10 to-[#8B5CF6]/10">
                <Bot className="w-4 h-4 text-[#246BFD]" />
                <span className="text-sm font-bold flex-1">AI 도우미</span>
                <button onClick={() => setChatOpen(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={chatRef}>
                {chatLog.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center pt-2 pb-1">궁금한 점을 물어보세요</p>
                    {CHAT_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setChatMsg(s); }}
                        className="w-full text-left text-xs bg-muted hover:bg-muted-foreground/10 rounded-xl px-3 py-2 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {chatLog.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl ${m.role === "user" ? "bg-[#246BFD] text-white" : "bg-muted text-foreground"}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <input
                    value={chatMsg}
                    onChange={e => setChatMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder="메시지 입력..."
                    className="flex-1 text-xs h-8 px-3 bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40"
                  />
                  <button onClick={sendChat} className="w-8 h-8 flex items-center justify-center bg-[#246BFD] text-white rounded-xl hover:bg-[#1D4ED8] transition-colors">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Launcher button */}
          <div className="fixed bottom-6 right-4 lg:right-6 z-50 group">
            <button
              onClick={() => setChatOpen(o => !o)}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#246BFD] to-[#8B5CF6] flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-[#246BFD]/50"
              aria-label="AI 도우미 열기"
            >
              {chatOpen ? <X className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </button>
            {!chatOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-[#111A2E] text-white text-[11px] px-2.5 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                AI 도우미 열기
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
