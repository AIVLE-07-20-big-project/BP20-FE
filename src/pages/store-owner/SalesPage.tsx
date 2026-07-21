import { useState } from "react";
import { Download, ChevronDown, Sparkles, ChevronRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";
import { PageShell } from "../../shared/components/PageShell";
import { MetricCard } from "../../shared/components/MetricCard";
import { WEEKLY_SALES, HOURLY_DATA } from "../../mocks";

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

export function SalesPage() {
  const [preset, setPreset] = useState("7일");
  const [showEvidence, setShowEvidence] = useState(false);

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
        {[
          { label: "총 매출", value: "₩14,749,000", change: -8.4 },
          { label: "온라인 매출", value: "₩1,987,000", change: 12.3 },
          { label: "오프라인 매출", value: "₩12,762,000", change: -10.8 },
          { label: "주문 건수", value: "1,284건", change: -5.2 },
          { label: "객단가", value: "₩11,487", change: -3.4 },
          { label: "재방문율", value: "42.8%", change: 2.1 },
        ].map((k) => (
          <MetricCard key={k.label} label={k.label} value={k.value} change={k.change} mini />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Main chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">온·오프라인 매출 비교</h3>
              <p className="text-xs text-muted-foreground">전주 동기간 대비</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_SALES}>
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
                <Tooltip formatter={(v: number, n) => [`₩${v.toLocaleString()}`, n === "offline" ? "오프라인" : "온라인"]} />
                <Area key="area-offline" type="monotone" dataKey="offline" stroke="#246BFD" fill="url(#offG)" strokeWidth={2} name="offline" />
                <Area key="area-online" type="monotone" dataKey="online" stroke="#8B5CF6" fill="url(#onG)" strokeWidth={2} name="online" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">카테고리별 기여</h3>
          <div className="h-40 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_DATA} layout="vertical">
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
              <BarChart data={HOURLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}시`} />
                <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => [`₩${v.toLocaleString()}`]} labelFormatter={(l) => `${l}시`} />
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
              <BarChart data={DOW_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => [`₩${v.toLocaleString()}`]} />
                <Bar dataKey="sales" fill="#0E9F6E" radius={[4, 4, 0, 0]} />
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
              <span className="text-xs text-muted-foreground">신뢰도 81%</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              지난주 대비 매출이 <strong>8.4% 감소</strong>한 주요 원인은 평일 14~17시 방문 감소로 분석됩니다.
              이 시간대 방문 건수가 전주 대비 31% 감소했으며, 날씨 영향(비) 및 인근 신규 경쟁 카페 오픈이 복합 요인으로 작용한 것으로 추정됩니다.
            </p>
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="flex items-center gap-1 mt-3 text-xs text-[#246BFD] font-semibold"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showEvidence ? "rotate-90" : ""}`} />
              분석 근거 보기 (4개)
            </button>
            {showEvidence && (
              <ul className="mt-2 space-y-1">
                {["POS 시간대별 판매 데이터 28일", "날씨 API 강수 데이터", "상권 신규 업체 입점 정보", "유사 매장 동기간 트래픽 비교"].map((e) => (
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
