import { useState } from "react";
import { Download, Sparkles, ChevronRight, Upload } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";
import { PageShell } from "../../shared/components/PageShell";
import { MetricCard } from "../../shared/components/MetricCard";
import { WEEKLY_SALES, HOURLY_DATA } from "../../mocks";
import { createAnalysis } from "../../features/ai-analysis/api/aiAnalysisApi";
import type { AiAnalysisResult, RatioPayload } from "../../entities/ai-analysis/ai-analysis.types";

const AI_ACCESS_TOKEN_KEY = "bp20:ai-access-token";
const AI_ANALYSIS_ID_KEY = "bp20:ai-analysis-id";

const DATE_PRESETS = ["오늘", "7일", "4주", "3개월", "직접 설정"];

const CATEGORY_DATA = [
  { name: "아메리카노", value: 1840000 },
  { name: "라떼류", value: 1240000 },
  { name: "베이커리", value: 920000 },
  { name: "에이드", value: 480000 },
  { name: "기타", value: 230000 },
];

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

export function SalesPage() {
  const [preset, setPreset] = useState("7일");
  const [showEvidence, setShowEvidence] = useState(false);
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem(AI_ACCESS_TOKEN_KEY) ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [trdarCd, setTrdarCd] = useState("");
  const [svcIndutyCd, setSvcIndutyCd] = useState("");
  const [yyquCd, setYyquCd] = useState("");
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleAnalysis = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken.trim()) { setApiError("Swagger 로그인으로 발급받은 JWT를 입력해 주세요."); return; }
    if (!file || !trdarCd || !svcIndutyCd) { setApiError("CSV 파일, 상권 코드, 업종 코드를 입력해 주세요."); return; }
    sessionStorage.setItem(AI_ACCESS_TOKEN_KEY, accessToken.trim());
    setRequesting(true);
    setApiError("");
    try {
      const result = await createAnalysis({
        file,
        trdarCd,
        svcIndutyCd,
        yyquCd: yyquCd ? Number(yyquCd) : undefined,
      }, accessToken.trim());
      setAnalysis(result);
      sessionStorage.setItem(AI_ANALYSIS_ID_KEY, result.analysis_id);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "분석 요청에 실패했습니다.");
    } finally {
      setRequesting(false);
    }
  };

  const report = analysis?.report;
  const summary = report?.["간단분석 정보요약"];
  const salesAnalysis = report?.매출분석;
  const trend = report?.추이?.매출액;
  const salesChartData = trend
    ? trend.분기.map((date, index) => ({
        date,
        target: trend.계열["대상 상권"]?.[index] ?? null,
        benchmark: trend.계열["동일 상권유형 중앙값"]?.[index] ?? null,
      }))
    : WEEKLY_SALES.map((item) => ({ date: item.date, target: item.offline, benchmark: item.online }));
  const comparisonData = report?.상단비교요약
    ? Object.entries(report.상단비교요약).map(([name, values]) => ({ name, value: values.월평균매출 ?? 0 }))
    : CATEGORY_DATA;
  const hourData = analysis
    ? ratioChartData(report?.시기별_매출특성?.시간대별?.매출액비율, "hour")
    : HOURLY_DATA;
  const dayData = analysis
    ? ratioChartData(report?.시기별_매출특성?.요일별?.매출액비율, "day")
    : DOW_DATA.map((item) => ({ day: item.day, value: item.sales }));
  const evidence = diagnosisStrings(analysis?.diagnosis);
  const confidence = (() => {
    const prescription = analysis?.diagnosis?.["5_처방"];
    const value = prescription && typeof prescription === "object"
      ? (prescription as Record<string, unknown>)["신뢰도"] : undefined;
    return typeof value === "number" ? Math.round(value * 100) : 81;
  })();
  const metrics = analysis ? [
    { label: "월 평균 매출", value: String(summary?.["월 평균 매출"] ?? "-") , change: parsePercent(salesAnalysis?.전분기대비) },
    { label: "전년동분기 대비", value: String(salesAnalysis?.전년동분기대비 ?? "-"), change: parsePercent(salesAnalysis?.전년동분기대비) },
    { label: "선택업종 업소수", value: `${summary?.["선택업종 업소수"] ?? "-"}개` },
    { label: "일 평균 유동인구", value: `${Number(summary?.["일 평균 유동인구"] ?? 0).toLocaleString()}명` },
    { label: "유동인구 집중 요일", value: String(summary?.["유동인구 많은 요일"] ?? "-") },
    { label: "유동인구 집중 시간", value: String(summary?.["유동인구 많은 시간대"] ?? "-") },
  ] : [
    { label: "총 매출", value: "₩14,749,000", change: -8.4 },
    { label: "온라인 매출", value: "₩1,987,000", change: 12.3 },
    { label: "오프라인 매출", value: "₩12,762,000", change: -10.8 },
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="text-xs bg-muted rounded-xl p-2" />
          <input value={trdarCd} onChange={(event) => setTrdarCd(event.target.value)} placeholder="상권 코드" className="h-10 px-3 text-sm bg-muted rounded-xl border border-border" />
          <input value={svcIndutyCd} onChange={(event) => setSvcIndutyCd(event.target.value)} placeholder="업종 코드" className="h-10 px-3 text-sm bg-muted rounded-xl border border-border" />
          <input value={yyquCd} onChange={(event) => setYyquCd(event.target.value)} placeholder="분기 코드 (선택)" inputMode="numeric" className="h-10 px-3 text-sm bg-muted rounded-xl border border-border" />
        </div>
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
          <MetricCard key={k.label} label={k.label} value={k.value} change={k.change} mini />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Main chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">분기별 매출 추이</h3>
              <p className="text-xs text-muted-foreground">대상 상권과 동일 상권유형 중앙값 비교</p>
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
                <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number, n) => [`₩${v.toLocaleString()}`, n === "target" ? "대상 상권" : "상권유형 중앙값"]} />
                <Legend />
                <Area type="monotone" dataKey="target" stroke="#246BFD" fill="url(#offG)" strokeWidth={2} name="대상 상권" />
                <Area type="monotone" dataKey="benchmark" stroke="#8B5CF6" fill="url(#onG)" strokeWidth={2} name="상권유형 중앙값" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">상권 매출 비교</h3>
          <div className="h-40 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v: number) => [`₩${v.toLocaleString()}`]} />
                <Bar dataKey="value" fill="#0E9F6E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                <Tooltip formatter={(v: number) => [analysis ? `${v}%` : `₩${v.toLocaleString()}`]} />
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
                <Tooltip formatter={(v: number) => [analysis ? `${v}%` : `₩${v.toLocaleString()}`]} />
                <Bar dataKey="value" fill="#0E9F6E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
              {report?.["분석결과 해설"] ?? "지난주 대비 매출이 8.4% 감소한 주요 원인은 평일 14~17시 방문 감소로 분석됩니다."}
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
