import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Sparkles, Upload } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";
import { PageShell } from "../../shared/components/PageShell";
import { MetricCard } from "../../shared/components/MetricCard";
import { WEEKLY_SALES, HOURLY_DATA } from "../../mocks";
import { createAnalysis, getAnalysis, getIndustries, getLocations, pollAnalysisJob } from "../../features/ai-analysis/api/aiAnalysisApi";
import type { IndustryOption, LocationDistrict } from "../../features/ai-analysis/api/aiAnalysisApi";
import { commerceApi } from "../../features/commerce/api/commerceApi";
import { ApiError } from "../../shared/api/apiClient";
import type {
  AiAnalysisJobStatus,
  AiAnalysisResult,
  DetailedDailySales,
  RatioPayload,
} from "../../entities/ai-analysis/ai-analysis.types";

// 업로드 → 대기열 등록 → 분석 처리 순서로 진행 표시에 쓴다.
// 각 인덱스가 곧 currentStepIndex와 비교하는 단계 번호다(0=업로드, 1=대기열, 2=처리 중).
const PROGRESS_STEPS = ["업로드", "대기열 등록", "분석 처리 중"];

const AI_ANALYSIS_ID_KEY = "bp20:ai-analysis-id";
const AI_ANALYSIS_OPTIONS_KEY = "bp20:ai-analysis-options";
const AI_STORE_ID_KEY = "bp20:ai-store-id";

// 새로고침해도 방금 완료한 매출 분석이 사라지지 않도록, 세션에 저장해 둔 가장 최근
// analysisId를 첫 렌더 때 다시 불러온다(AiStrategyPage/DashboardPage와 같은 방식).
function latestAnalysisIdFromSession(): string {
  try {
    const saved = JSON.parse(sessionStorage.getItem(AI_ANALYSIS_OPTIONS_KEY) ?? "[]");
    if (Array.isArray(saved) && saved[0]?.id) return saved[0].id;
  } catch {
    // 오래된 세션 값은 아래 fallback으로 처리한다.
  }
  return sessionStorage.getItem(AI_ANALYSIS_ID_KEY) ?? "";
}

const DATE_PRESETS = ["월별", "분기"];

// scripts/modeling/sales_report_renderer.py의 REGION_COLORS와 동일하게 맞춰,
// 같은 비교 대상이 HTML 리포트와 FE 화면에서 같은 색으로 보이게 한다.
const REGION_COLORS: Record<string, string> = {
  "대상 상권": "#1e40af",
  "동일 상권유형 중앙값": "#f97316",
  "서울 동종업종 중앙값": "#ec4899",
};

const GENDER_COLORS: Record<string, string> = {
  "남성": "#3B82F6",
  "여성": "#EC4899",
};

const DOW_DATA = [
  { day: "월", sales: 2104000 },
  { day: "화", sales: 2380000 },
  { day: "수", sales: 2560000 },
  { day: "목", sales: 2820000 },
  { day: "금", sales: 3200000 },
  { day: "토", sales: 3980000 },
  { day: "일", sales: 3640000 },
];

const parsePercent = (value: string | number | null | undefined) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  const parsed = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const ratioChartData = (payload: RatioPayload | null | undefined, labelKey: string) => {
  const values = payload?.지역별?.["대상 상권"] ?? [];
  return (payload?.labels ?? []).map((label, index) => ({
    [labelKey]: label,
    value: values[index] == null ? 0 : Number((values[index]! * 100).toFixed(1)),
  }));
};

const filterDailySales = (rows: DetailedDailySales[], preset: string) => {
  if (!rows.length) return rows;
  const latest = new Date(`${rows[rows.length - 1].date}T00:00:00`);
  const start = preset === "분기"
    ? new Date(latest.getFullYear(), Math.floor(latest.getMonth() / 3) * 3, 1)
    : new Date(latest.getFullYear(), latest.getMonth(), 1);
  return rows.filter((row) => new Date(`${row.date}T00:00:00`) >= start);
};

const summarizePeriod = (allRows: DetailedDailySales[], selectedRows: DetailedDailySales[], preset: string) => {
  const revenue = selectedRows.reduce((sum, row) => sum + row.revenue, 0);
  const transactions = selectedRows.reduce((sum, row) => sum + row.transactionCount, 0);
  const latest = allRows.length
    ? new Date(`${allRows[allRows.length - 1].date}T00:00:00`)
    : null;
  const currentStart = latest
    ? preset === "분기"
      ? new Date(latest.getFullYear(), Math.floor(latest.getMonth() / 3) * 3, 1)
      : new Date(latest.getFullYear(), latest.getMonth(), 1)
    : null;
  const previousStart = currentStart
    ? preset === "분기"
      ? new Date(currentStart.getFullYear(), currentStart.getMonth() - 3, 1)
      : new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1)
    : null;
  const previousRows = currentStart && previousStart
    ? allRows.filter((row) => {
        const date = new Date(`${row.date}T00:00:00`);
        return date >= previousStart && date < currentStart;
      })
    : [];
  const previousRevenue = previousRows.reduce((sum, row) => sum + row.revenue, 0);
  return {
    revenue,
    transactions,
    averageDaily: selectedRows.length ? revenue / selectedRows.length : 0,
    change: previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : undefined,
  };
};

// 집계성 금액(총매출·일평균매출 등)은 만원 단위로 통일한다. 백엔드 _fmt_money와 동일한 규칙
// (10,000으로 나눠 반올림 + 천단위 콤마)이라 report.매출분석 값들과 표기가 일치한다.
const formatManwon = (value: number) => `${Math.round(value / 10000).toLocaleString()} 만원`;

export function SalesPage() {
  const [preset, setPreset] = useState("월별");
  const [file, setFile] = useState<File | null>(null);
  const [storeId, setStoreId] = useState(() => sessionStorage.getItem(AI_STORE_ID_KEY) ?? "");
  const [trdarCd, setTrdarCd] = useState("");
  const [locations, setLocations] = useState<LocationDistrict[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [svcIndutyCd, setSvcIndutyCd] = useState("");
  const [industryName, setIndustryName] = useState("");
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [jobStatus, setJobStatus] = useState<AiAnalysisJobStatus | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const elapsedTimerRef = useRef<number | null>(null);

  // 언마운트 시 타이머가 남아있으면 정리한다.
  useEffect(() => () => {
    if (elapsedTimerRef.current !== null) window.clearInterval(elapsedTimerRef.current);
  }, []);

  // 새로고침 직후에도 마지막으로 완료한 매출 분석을 다시 불러와 화면을 유지한다.
  useEffect(() => {
    const analysisId = latestAnalysisIdFromSession();
    if (!analysisId) return;
    setRestoring(true);
    getAnalysis(analysisId)
      .then(setAnalysis)
      .catch(() => undefined)
      .finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    getLocations().then((result) => setLocations(result.regions)).catch(() => undefined);
    getIndustries().then((result) => setIndustries(result.industries)).catch(() => undefined);
    commerceApi.getStore().then((store) => setIndustryName(store.category)).catch(() => undefined);
  }, []);

  const locationOptions = useMemo(
    () => locations.flatMap((district) => district.areas.map((area) => ({
      ...area,
      label: `${district.name} · ${area.region_name} · ${area.name}`,
    }))),
    [locations],
  );

  const handleLocationSearch = (value: string) => {
    setLocationSearch(value);
    const matched = locationOptions.find((area) => area.label === value);
    if (matched) setTrdarCd(matched.code);
  };

  useEffect(() => {
    if (!industryName || industries.length === 0) return;
    const normalized = industryName.replace(/[·\s]/g, "");
    const matched = industries.find((industry) => {
      const name = industry.name.replace(/[·\s]/g, "");
      if (normalized.includes("카페") || normalized.includes("커피")) return name.includes("커피");
      if (normalized.includes("베이커리") || normalized.includes("제과")) return name.includes("제과");
      if (normalized.includes("한식")) return name.includes("한식");
      if (normalized.includes("중식")) return name.includes("중식");
      if (normalized.includes("일식")) return name.includes("일식");
      if (normalized.includes("양식")) return name.includes("양식");
      if (normalized.includes("분식")) return name.includes("분식");
      return name === normalized || name.includes(normalized) || normalized.includes(name);
    });
    if (matched) setSvcIndutyCd(matched.code);
  }, [industryName, industries]);

  const handleAnalysis = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) { setApiError("CSV 파일을 선택해 주세요."); return; }
    if (storeId.trim()) sessionStorage.setItem(AI_STORE_ID_KEY, storeId.trim());
    setRequesting(true);
    setApiError("");
    setJobStatus(null);
    setElapsedSeconds(0);
    elapsedTimerRef.current = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    try {
      setStatusMessage("분석 요청 중...");
      const job = await createAnalysis({
        file,
        storeId: storeId.trim() || undefined,
        trdarCd: trdarCd || undefined,
        svcIndutyCd: svcIndutyCd || undefined,
      });
      setJobStatus(job.status);

      setStatusMessage("분석 처리 중... (완료까지 몇 초~몇십 초 걸릴 수 있습니다)");
      const finishedJob = await pollAnalysisJob(job.job_id, {
        onUpdate: (update) => setJobStatus(update.status),
      });
      if (finishedJob.status === "failed" || !finishedJob.analysis_id) {
        setApiError(finishedJob.error_message ?? "분석 처리 중 오류가 발생했습니다.");
        return;
      }

      const result = await getAnalysis(finishedJob.analysis_id);
      setAnalysis(result);
      sessionStorage.setItem(AI_ANALYSIS_ID_KEY, result.analysis_id);
      const target = (result.diagnosis?.["대상"] ?? {}) as Record<string, unknown>;
      const label = [
        result.store_id ? `매장 ${result.store_id}` : null,
        target["상권명"], target["업종명"], target["기준분기"],
      ]
        .filter(Boolean).join(" · ") || "최근 매출 분석";
      let previous: Array<{ id: string; label: string }> = [];
      try {
        previous = JSON.parse(sessionStorage.getItem(AI_ANALYSIS_OPTIONS_KEY) ?? "[]");
      } catch {
        previous = [];
      }
      sessionStorage.setItem(
        AI_ANALYSIS_OPTIONS_KEY,
        JSON.stringify([{ id: result.analysis_id, label }, ...previous.filter((item) => item.id !== result.analysis_id)].slice(0, 10)),
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && !trdarCd && !svcIndutyCd) {
        setApiError("내 정보에 등록된 업종과 서울 지역·상권을 확인해 주세요. 이후부터는 파일만 올려도 자동으로 채워집니다.");
      } else {
        setApiError(error instanceof Error ? error.message : "분석 요청에 실패했습니다.");
      }
    } finally {
      if (elapsedTimerRef.current !== null) {
        window.clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      setRequesting(false);
      setStatusMessage("");
      setJobStatus(null);
    }
  };

  const currentStepIndex = jobStatus === "running" ? 2 : jobStatus === "queued" ? 1 : 0;

  const report = analysis?.report;
  const detailed = analysis?.detailed_analysis;
  const rootCause = detailed?.rootCauseAnalysis;
  const eventAnalysis = detailed?.eventAnalysis;
  const salesBreakdown = detailed?.salesBreakdown;
  const categoryRows = salesBreakdown?.dimensions?.product_category ?? [];
  const channelRows = salesBreakdown?.dimensions?.sales_channel ?? [];
  const breakdownSections: Array<[string, typeof categoryRows]> = [
    ["상품 카테고리", categoryRows],
    ["판매 채널", channelRows],
  ];
  const summary = report?.["간단분석 정보요약"];
  const salesAnalysis = report?.매출분석;
  const trend = report?.추이?.매출액;
  const allDailySales = detailed?.dailySales ?? [];
  const selectedDailySales = useMemo(
    () => filterDailySales(allDailySales, preset),
    [allDailySales, preset],
  );
  const selectedSummary = useMemo(
    () => summarizePeriod(allDailySales, selectedDailySales, preset),
    [allDailySales, selectedDailySales, preset],
  );
  const isQuarterlyChart = preset === "분기";
  const salesChartData = isQuarterlyChart
    ? trend
      ? trend.분기.map((date, index) => ({
          date,
          target: trend.계열["대상 상권"]?.[index] == null
            ? null
            : trend.계열["대상 상권"]![index]! * 3,
          benchmark: trend.계열["서울 동종업종 중앙값"]?.[index] == null
            ? null
            : trend.계열["서울 동종업종 중앙값"]![index]! * 3,
        }))
      : []
    : selectedDailySales.length
    ? selectedDailySales.map((row) => ({
        date: row.date.slice(5).replace("-", "."),
        target: row.revenue,
      }))
    : trend
      ? trend.분기.map((date, index) => ({
        date,
        target: trend.계열["대상 상권"]?.[index] ?? null,
        benchmark: trend.계열["동일 상권유형 중앙값"]?.[index] ?? null,
      }))
      : WEEKLY_SALES.map((item) => ({ date: item.date, target: item.offline, benchmark: item.online }));
  // 대상 상권은 매출이 있어야만 값이 잡혀 그래프가 비는 경우가 많아 제외하고,
  // 비교 대상인 두 중앙값(동일 상권유형·서울 동종업종)만 보여준다.
  const comparisonData = report?.상단비교요약
    ? Object.entries(report.상단비교요약)
        .filter(([name]) => name !== "대상 상권")
        .map(([name, values]) => ({
          name,
          value: values.월평균매출 ?? 0,
        }))
    : [];
  const hourData = analysis
    ? ratioChartData(report?.시기별_매출특성?.시간대별?.매출액비율, "hour")
    : HOURLY_DATA;
  const dayData = analysis
    ? ratioChartData(report?.시기별_매출특성?.요일별?.매출액비율, "day")
    : DOW_DATA.map((item) => ({ day: item.day, value: item.sales }));
  const trafficHourData = analysis ? ratioChartData(report?.유동인구_구성?.시간대별, "hour") : [];
  const trafficAgeData = analysis ? ratioChartData(report?.유동인구_구성?.연령대별, "age") : [];
  const trafficGenderData = analysis ? ratioChartData(report?.유동인구_구성?.성별, "gender") : [];
  const periodLabel = preset === "월별" ? "이번 달" : "이번 분기";
  // 분기 단위 상권 분석(report)과 월 단위 POS 상세 원인 분석(rootCause)은 서로 다른
  // 데이터 기준이라 하나로 합치지 않고 따로 보여준다.
  const quarterlyInsight = report?.["분석결과 해설"] ?? null;
  const monthlyInsight = [rootCause?.headline, rootCause?.narrative]
    .filter((value): value is string => Boolean(value))
    .join(" ") || null;
  const topCategory = rootCause?.topCategory;
  const metrics = analysis && selectedDailySales.length ? [
    {
      label: `${periodLabel} 총 매출`,
      value: formatManwon(selectedSummary.revenue),
      change: selectedSummary.change,
      changePeriod: preset === "분기" ? "전분기 대비" : "전월 대비",
    },
    { label: "일 평균 매출", value: formatManwon(selectedSummary.averageDaily) },
    { label: "거래 건수", value: `${selectedSummary.transactions.toLocaleString()}건` },
    {
      label: "최고 매출 카테고리",
      value: topCategory ? `${topCategory.category} (${formatManwon(topCategory.revenue)})` : "-",
    },
    {
      label: "상권 전분기 대비",
      value: String(salesAnalysis?.전분기대비 ?? "-"),
      change: parsePercent(salesAnalysis?.전분기대비),
      changePeriod: "전분기 대비",
    },
    { label: "일 평균 유동인구", value: `${Number(summary?.["일 평균 유동인구"] ?? 0).toLocaleString()}명` },
  ] : [
    { label: "총 매출", value: "1,475 만원", change: -8.4 },
    { label: "온라인 매출", value: "199 만원", change: 12.3 },
    { label: "오프라인 매출", value: "1,276 만원", change: -10.8 },
    { label: "주문 건수", value: "1,284건", change: -5.2 },
    { label: "최고 매출 카테고리", value: "커피 (312 만원)" },
    { label: "재방문율", value: "42.8%", change: 2.1 },
  ];

  return (
    <PageShell
      title="매출 분석"
      freshness="오늘 09:42 기준"
      actions={
        <button
          type="button"
          disabled={!analysis}
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
        >
          <Download className="w-3.5 h-3.5" />
          내보내기
        </button>
      }
    >
      <form onSubmit={handleAnalysis} className="bg-card border border-border rounded-2xl p-5 mb-5 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-[#246BFD]" />
          <h3 className="font-bold">매출 CSV 분석 연동</h3>
        </div>
        <input
          value={storeId}
          onChange={(event) => setStoreId(event.target.value)}
          placeholder="매장 ID (여러 매장을 구분하려면 입력)"
          className="w-full h-10 px-3 mb-3 text-sm bg-muted rounded-xl border border-border"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="text-xs bg-muted rounded-xl p-2" />
          <input
            value={locationSearch}
            onChange={(event) => handleLocationSearch(event.target.value)}
            list="seoul-location-options"
            placeholder="서울 구·동·상권 검색"
            className="h-10 px-3 text-sm bg-muted rounded-xl border border-border"
          />
          <datalist id="seoul-location-options">
            {locationOptions.map((area) => <option key={area.code} value={area.label} />)}
          </datalist>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          지역은 상권 코드로 자동 변환되고, 업종 코드는 내 정보에 등록된 업종을 기준으로 자동 반영됩니다.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <button disabled={requesting} className="px-4 py-2 bg-[#246BFD] text-white text-sm font-bold rounded-xl disabled:opacity-60 flex items-center gap-2">
            {requesting && <Loader2 className="w-4 h-4 animate-spin" />}
            {requesting ? "처리 중..." : "분석 시작"}
          </button>
        </div>
        {requesting && (
          <div className="mt-4 bg-muted/60 border border-border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Loader2 className="w-4 h-4 text-[#246BFD] animate-spin flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground">{statusMessage || "처리 중..."}</span>
              <span className="text-[11px] text-muted-foreground ml-auto flex-shrink-0">{elapsedSeconds}초 경과</span>
            </div>
            <div className="flex items-center gap-1">
              {PROGRESS_STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index <= currentStepIndex ? "bg-[#246BFD]" : "bg-border"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {PROGRESS_STEPS.map((step, index) => (
                <span
                  key={step}
                  className={`text-[10px] ${
                    index <= currentStepIndex ? "text-[#246BFD] font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        )}
        {restoring && (
          <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> 최근 매출 분석을 불러오는 중...
          </p>
        )}
        {apiError && <p className="mt-3 text-xs text-red-600">{apiError}</p>}
        {analysis && !restoring && <p className="mt-3 text-xs text-[#0E9F6E] font-semibold">분석 완료</p>}
      </form>

      {/* Date presets */}
      <div className="flex gap-1 mb-5 flex-wrap print:hidden">
        {DATE_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              preset === p ? "bg-[#246BFD] text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      {/* 인쇄본에는 토글 버튼 대신 어떤 기준으로 뽑은 리포트인지만 텍스트로 남긴다 */}
      <p className="hidden print:block text-xs text-muted-foreground mb-3">기준: {preset}</p>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {metrics.map((k) => (
          <MetricCard
            key={k.label}
            label={k.label}
            value={k.value}
            change={k.change}
            changePeriod={"changePeriod" in k ? k.changePeriod : undefined}
            mini
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Main chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">{isQuarterlyChart ? "분기별 매출 추이" : `${periodLabel} 일별 매출 추이`}</h3>
              <p className="text-xs text-muted-foreground">
                {isQuarterlyChart
                  ? "분기 총매출 기준 · 왼쪽 축 대상 상권 / 오른쪽 축 서울 동일업종 중앙값"
                  : "업로드한 내 업장 POS 일별 매출 기준"}
              </p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="offG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#246BFD" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#246BFD" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="onG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B6CFF" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#5B6CFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="target"
                  tick={{ fontSize: 11, fill: "#667085" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                />
                {isQuarterlyChart && (
                  <YAxis
                    yAxisId="benchmark"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#8B5CF6" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                  />
                )}
                <Tooltip
                  formatter={(v: number, n) => [
                    formatManwon(v),
                    n,
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="target"
                  type="monotone"
                  dataKey="target"
                  stroke="#246BFD"
                  fill="url(#offG)"
                  strokeWidth={2}
                  name={isQuarterlyChart ? "대상 상권 분기 총매출" : "내 매장 일별 매출"}
                />
                {isQuarterlyChart && (
                  <Area yAxisId="benchmark" type="monotone" dataKey="benchmark" stroke="#8B5CF6" fill="url(#onG)" strokeWidth={2} name="서울 동일업종 매출 중앙값" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commercial district sales comparison */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-1">월평균 매출 중앙값 비교</h3>
          <p className="text-xs text-muted-foreground mb-4">
            선택 업종 기준 · 동일 상권유형과 서울 동종업종의 월평균 매출 중앙값
          </p>
          {comparisonData.length ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} width={88} />
                  <Tooltip formatter={(v: number) => [formatManwon(v), "월평균 매출"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {comparisonData.map((entry) => (
                      <Cell key={entry.name} fill={REGION_COLORS[entry.name] ?? "#0E9F6E"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center rounded-xl bg-muted/50 px-6 text-center">
              <p className="text-sm text-muted-foreground">
                분석을 실행하면 동일 상권유형과 서울 동종업종의 월평균 매출 중앙값을 보여드립니다.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Hour heatmap — simplified as bar */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-1">시간대별 매출</h3>
          <p className="text-xs text-muted-foreground mb-4">오늘 기준</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}시`} />
                <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => analysis ? `${v}%` : `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => [analysis ? `${v}%` : formatManwon(v)]} />
                <Bar dataKey="value" fill="#5B6CFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of week */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-1">요일별 평균 매출</h3>
          <p className="text-xs text-muted-foreground mb-4">최근 4주 기준</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => analysis ? `${v}%` : `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => [analysis ? `${v}%` : formatManwon(v)]} />
                <Bar dataKey="value" fill="#0E9F6E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* POS 상세 매출 분해 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-1">상품·채널별 상세 매출</h3>
          <p className="text-xs text-muted-foreground mb-4">업로드 POS 기준 · 매출 비중과 거래 건수</p>
          {categoryRows.length || channelRows.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {breakdownSections.map(([title, rows]) => (
                <div key={String(title)}>
                  <p className="text-xs font-semibold mb-2">{title}</p>
                  <div className="space-y-2">
                    {rows.slice(0, 5).map((row) => (
                      <div key={row.value} className="flex items-center gap-2 text-xs">
                        <span className="w-24 truncate text-muted-foreground">{row.value}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-[#246BFD]" style={{ width: `${Math.min(100, row.revenueSharePct)}%` }} />
                        </div>
                        <span className="w-20 text-right font-semibold">{row.revenueSharePct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">분석을 실행하면 상품·채널별 매출 구성을 보여드립니다.</p>}
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-1">행사 노출 분석</h3>
          <p className="text-xs text-muted-foreground mb-4">인근 행사 데이터 기준 · 참고용 연관성</p>
          {eventAnalysis?.available ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">주변 행사 수</p><p className="font-bold">{eventAnalysis.eventCount ?? "-"}건</p></div>
                <div className="rounded-xl bg-muted/60 p-3"><p className="text-[11px] text-muted-foreground">행사 일수</p><p className="font-bold">{eventAnalysis.eventDays ?? "-"}일</p></div>
              </div>
              <p>행사 노출일 평균 매출 <b>{eventAnalysis.averageDailyRevenueExposed == null ? "-" : formatManwon(eventAnalysis.averageDailyRevenueExposed)}</b></p>
              <p>비노출일 대비 <b>{eventAnalysis.exposedVsUnexposedRevenuePct == null ? "비교 불가" : `${eventAnalysis.exposedVsUnexposedRevenuePct > 0 ? "+" : ""}${eventAnalysis.exposedVsUnexposedRevenuePct.toFixed(1)}%`}</b></p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{eventAnalysis.interpretation}</p>
            </div>
          ) : <p className="text-sm text-muted-foreground">POS 기간과 일치하는 행사 데이터가 없습니다.</p>}
        </div>
      </div>

      {salesBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {([
            { key: "daypart", title: "시간대 구간별 매출", rows: salesBreakdown.daypart ?? [], color: "#246BFD" },
            { key: "weekday", title: "요일별 매출", rows: salesBreakdown.weekday ?? [], color: "#8B5CF6" },
          ] as const).map(({ key, title, rows, color }) => (
            <div key={key} className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-3">{title}</h3>
              {rows.length ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                      <XAxis dataKey="value" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                      <Tooltip formatter={(v: number, _n, item) => [`${formatManwon(v)} · ${item.payload.revenueSharePct.toFixed(1)}%`, "매출"]} />
                      <Bar dataKey="revenue" fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-muted-foreground">데이터 없음</p>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Foot traffic — by time of day */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-1">시간대별 유동인구</h3>
          <p className="text-xs text-muted-foreground mb-4">대상 상권 · 비중 기준</p>
          {trafficHourData.length ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficHourData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "유동인구 비중"]} />
                  <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center rounded-xl bg-muted/50 px-6 text-center">
              <p className="text-sm text-muted-foreground">분석을 실행하면 시간대별 유동인구 비중을 보여드립니다.</p>
            </div>
          )}
        </div>

        {/* Foot traffic — by age group */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-1">연령대별 유동인구</h3>
          <p className="text-xs text-muted-foreground mb-4">대상 상권 · 비중 기준</p>
          {trafficAgeData.length ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficAgeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                  <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "유동인구 비중"]} />
                  <Bar dataKey="value" fill="#EC4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center rounded-xl bg-muted/50 px-6 text-center">
              <p className="text-sm text-muted-foreground">분석을 실행하면 연령대별 유동인구 비중을 보여드립니다.</p>
            </div>
          )}
        </div>

        {/* Foot traffic — by gender */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-1">남녀 성비</h3>
          <p className="text-xs text-muted-foreground mb-4">대상 상권 · 비중 기준</p>
          {trafficGenderData.length ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficGenderData}
                    dataKey="value"
                    nameKey="gender"
                    cx="50%"
                    cy="45%"
                    outerRadius={52}
                    label={(entry) => `${entry.gender} ${entry.value}%`}
                    labelLine={false}
                  >
                    {trafficGenderData.map((entry) => (
                      <Cell key={entry.gender} fill={GENDER_COLORS[entry.gender] ?? "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, _n, item) => [`${v}%`, item.payload.gender]} />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    formatter={(_value, entry) => (entry.payload as { gender?: string })?.gender ?? ""}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center rounded-xl bg-muted/50 px-6 text-center">
              <p className="text-sm text-muted-foreground">분석을 실행하면 남녀 성비를 보여드립니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI cause analysis */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-[#246BFD]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#246BFD]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[#246BFD] bg-[#246BFD]/10 px-1.5 py-0.5 rounded">AI 분석</span>
            </div>
            {quarterlyInsight || monthlyInsight ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">분기별 상권 분석</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {quarterlyInsight || "이번 분기 상권 데이터가 부족해 상권 분석 해설을 생성하지 못했습니다."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">월별 상세 원인 분석</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {monthlyInsight || "POS 상세 분석 데이터가 부족해 월별 원인 분석을 생성하지 못했습니다."}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed">
                분석을 실행하면 분기별 상권 분석과 월별 상세 POS 원인 분석을 함께 보여드립니다.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/60 mt-2">※ AI 분석은 참고용이며 인과관계를 보장하지 않습니다.</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
