import { useMemo, useState } from "react";
import { Download, Sparkles, ChevronRight, Upload } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";
import { PageShell } from "../../shared/components/PageShell";
import { MetricCard } from "../../shared/components/MetricCard";
import { WEEKLY_SALES, HOURLY_DATA } from "../../mocks";
import { createAnalysis } from "../../features/ai-analysis/api/aiAnalysisApi";
import { ApiError } from "../../shared/api/http";
import type { AiAnalysisResult, DetailedDailySales, RatioPayload } from "../../entities/ai-analysis/ai-analysis.types";

const AI_ACCESS_TOKEN_KEY = "bp20:ai-access-token";
const AI_ANALYSIS_ID_KEY = "bp20:ai-analysis-id";
const AI_STORE_ID_KEY = "bp20:ai-store-id";

const DATE_PRESETS = ["월별", "분기"];

// scripts/modeling/sales_report_renderer.py의 REGION_COLORS와 동일하게 맞춰,
// 같은 비교 대상이 HTML 리포트와 FE 화면에서 같은 색으로 보이게 한다.
const REGION_COLORS: Record<string, string> = {
  "대상 상권": "#1e40af",
  "동일 상권유형 중앙값": "#f97316",
  "서울 동종업종 중앙값": "#ec4899",
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

const diagnosisStrings = (diagnosis: Record<string, unknown> | undefined) => {
  const prescription = diagnosis?.["5_처방"];
  if (!prescription || typeof prescription !== "object") return [];
  const evidence = (prescription as Record<string, unknown>)["근거문장"];
  return Array.isArray(evidence) ? evidence.filter((item): item is string => typeof item === "string") : [];
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
    averageOrderValue: transactions ? revenue / transactions : 0,
    change: previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : undefined,
  };
};

// 단가성 소액(객단가 등)은 만원으로 반올림하면 의미가 사라지므로 원 단위를 유지한다.
const formatWon = (value: number) => `₩${Math.round(value).toLocaleString()}`;
// 집계성 금액(총매출·일평균매출 등)은 만원 단위로 통일한다. 백엔드 _fmt_money와 동일한 규칙
// (10,000으로 나눠 반올림 + 천단위 콤마)이라 report.매출분석 값들과 표기가 일치한다.
const formatManwon = (value: number) => `${Math.round(value / 10000).toLocaleString()} 만원`;

export function SalesPage() {
  const [preset, setPreset] = useState("월별");
  const [showEvidence, setShowEvidence] = useState(false);
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem(AI_ACCESS_TOKEN_KEY) ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [storeId, setStoreId] = useState(() => sessionStorage.getItem(AI_STORE_ID_KEY) ?? "");
  const [trdarCd, setTrdarCd] = useState("");
  const [svcIndutyCd, setSvcIndutyCd] = useState("");
  const [yyquCd, setYyquCd] = useState("");
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleAnalysis = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken.trim()) { setApiError("Swagger 로그인으로 발급받은 JWT를 입력해 주세요."); return; }
    if (!file) { setApiError("CSV 파일을 선택해 주세요."); return; }
    sessionStorage.setItem(AI_ACCESS_TOKEN_KEY, accessToken.trim());
    if (storeId.trim()) sessionStorage.setItem(AI_STORE_ID_KEY, storeId.trim());
    setRequesting(true);
    setApiError("");
    try {
      const result = await createAnalysis({
        file,
        storeId: storeId.trim() || undefined,
        trdarCd: trdarCd || undefined,
        svcIndutyCd: svcIndutyCd || undefined,
        yyquCd: yyquCd ? Number(yyquCd) : undefined,
      }, accessToken.trim());
      setAnalysis(result);
      sessionStorage.setItem(AI_ANALYSIS_ID_KEY, result.analysis_id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && !trdarCd && !svcIndutyCd) {
        setApiError("최초 업로드는 상권 코드와 업종 코드를 함께 입력해야 합니다. 이후부터는 파일만 올려도 자동으로 채워집니다.");
      } else {
        setApiError(error instanceof Error ? error.message : "분석 요청에 실패했습니다.");
      }
    } finally {
      setRequesting(false);
    }
  };

  const report = analysis?.report;
  const detailed = analysis?.detailed_analysis;
  const rootCause = detailed?.rootCauseAnalysis;
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
  const comparisonData = report?.상단비교요약
    ? Object.entries(report.상단비교요약).map(([name, values]) => ({
        name,
        value: preset === "분기"
          ? values.분기총매출 ?? ((values.월평균매출 ?? 0) * 3)
          : values.월평균매출 ?? 0,
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
  const detailedEvidence = [
    ...(rootCause?.internalDetailedDrivers ?? []).map((driver) =>
      `${driver.label ?? driver.factor ?? "내부 요인"}: 매출 기여 ${formatManwon(driver.contributionAmount ?? 0)}`
    ),
    ...(rootCause?.externalDrivers ?? []).map((driver) =>
      `${String(driver.factor ?? "외부 요인")}: 검증 기준을 통과한 연관성`
    ),
    ...(rootCause?.limitations ?? []),
  ];
  const evidence = [...diagnosisStrings(analysis?.diagnosis), ...detailedEvidence];
  const confidence = (() => {
    const reliability = analysis?.diagnosis?.["6_신뢰도"];
    if (!reliability || typeof reliability !== "object") return 81;
    return (reliability as Record<string, unknown>)["분석사용가능"] === false ? 55 : 81;
  })();
  const periodLabel = preset === "월별" ? "이번 달" : "이번 분기";
  const overallInsight = [report?.["분석결과 해설"], rootCause?.headline, rootCause?.narrative]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  const metrics = analysis && selectedDailySales.length ? [
    {
      label: `${periodLabel} 총 매출`,
      value: formatManwon(selectedSummary.revenue),
      change: selectedSummary.change,
      changePeriod: preset === "분기" ? "전분기 대비" : "전월 대비",
    },
    { label: "일 평균 매출", value: formatManwon(selectedSummary.averageDaily) },
    { label: "거래 건수", value: `${selectedSummary.transactions.toLocaleString()}건` },
    { label: "평균 객단가", value: formatWon(selectedSummary.averageOrderValue) },
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
    { label: "객단가", value: "₩11,487", change: -3.4 },
    { label: "재방문율", value: "42.8%", change: 2.1 },
  ];

  return (
    <PageShell
      title="매출 분석"
      freshness="오늘 09:42 기준"
      actions={
        <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors">
          <Download className="w-3.5 h-3.5" />
          내보내기
        </button>
      }
    >
      <form onSubmit={handleAnalysis} className="bg-card border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-[#246BFD]" />
          <h3 className="font-bold">매출 CSV 분석 연동</h3>
        </div>
        <input
          type="password"
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          placeholder="임시 JWT accessToken (로그인 연동 후 제거 예정)"
          className="w-full h-10 px-3 mb-3 text-sm bg-muted rounded-xl border border-border"
        />
        <input
          value={storeId}
          onChange={(event) => setStoreId(event.target.value)}
          placeholder="매장 ID (여러 매장을 구분하려면 입력)"
          className="w-full h-10 px-3 mb-3 text-sm bg-muted rounded-xl border border-border"
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="text-xs bg-muted rounded-xl p-2" />
          <input value={trdarCd} onChange={(event) => setTrdarCd(event.target.value)} placeholder="상권 코드 (최초 1회만)" className="h-10 px-3 text-sm bg-muted rounded-xl border border-border" />
          <input value={svcIndutyCd} onChange={(event) => setSvcIndutyCd(event.target.value)} placeholder="업종 코드 (최초 1회만)" className="h-10 px-3 text-sm bg-muted rounded-xl border border-border" />
          <input value={yyquCd} onChange={(event) => setYyquCd(event.target.value)} placeholder="분기 코드 (선택)" inputMode="numeric" className="h-10 px-3 text-sm bg-muted rounded-xl border border-border" />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          상권/업종 코드는 최초 업로드 때 한 번만 입력하면 이후에는 저장된 값으로 자동 채워집니다.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <button disabled={requesting} className="px-4 py-2 bg-[#246BFD] text-white text-sm font-bold rounded-xl disabled:opacity-60">
            {requesting ? "요청 중..." : "분석 시작"}
          </button>
        </div>
        {apiError && <p className="mt-3 text-xs text-red-600">{apiError}</p>}
        {analysis && <p className="mt-3 text-xs text-[#0E9F6E] font-semibold">분석 완료 · ID {analysis.analysis_id}</p>}
      </form>

      {/* Date presets */}
      <div className="flex gap-1 mb-5 flex-wrap">
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
          <h3 className="font-bold mb-1">
            {preset === "분기" ? "분기 총매출" : "월평균 매출"} · 대상 상권 vs 타 상권 동일업종
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            선택 업종 기준 · 대상 상권과 서울 타 상권의 {preset === "분기" ? "분기 총매출" : "해당 분기 월평균 매출"} 중앙값 비교
          </p>
          {comparisonData.length ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} width={88} />
                  <Tooltip formatter={(v: number) => [formatManwon(v), preset === "분기" ? "분기 총매출" : "월평균 매출"]} />
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
                분석을 실행하면 대상 상권과 서울 타 상권 동일 업종의 {preset === "분기" ? "분기 총매출" : "월평균 매출"}을 비교합니다.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
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
              <span className="text-xs text-muted-foreground">신뢰도 {confidence}%</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {overallInsight || "분석을 실행하면 상권 분석과 상세 POS 원인 분석을 종합해 보여드립니다."}
            </p>
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="flex items-center gap-1 mt-3 text-xs text-[#246BFD] font-semibold"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showEvidence ? "rotate-90" : ""}`} />
              분석 근거 보기 ({evidence.length || 4}개)
            </button>
            {showEvidence && (
              <ul className="mt-2 space-y-1">
                {(evidence.length ? evidence : ["POS 시간대별 판매 데이터 28일", "날씨 API 강수 데이터", "상권 신규 업체 입점 정보", "유사 매장 동기간 트래픽 비교"]).map((e) => (
                  <li key={e} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B6CFF] mt-1.5 flex-shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-muted-foreground/60 mt-2">※ AI 분석은 참고용이며 인과관계를 보장하지 않습니다.</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
