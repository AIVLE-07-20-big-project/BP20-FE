import { useState } from "react";
import { Sparkles, Info, ChevronDown, ChevronUp } from "lucide-react";
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { PageShell } from "../../shared/components/PageShell";
import { MetricCard } from "../../shared/components/MetricCard";
import { EffectVerificationPerformanceSection } from "./components/EffectVerificationPerformanceSection";

const CUMULATIVE_DATA = [
  { month: "2월", aiActive: 4.2, nonAi: 1.1, cumulative: 4.2 },
  { month: "3월", aiActive: 5.1, nonAi: 0.8, cumulative: 9.5 },
  { month: "4월", aiActive: 5.8, nonAi: 1.2, cumulative: 15.8 },
  { month: "5월", aiActive: 6.4, nonAi: 0.9, cumulative: 22.8 },
  { month: "6월", aiActive: 7.2, nonAi: 1.5, cumulative: 30.6 },
  { month: "7월", aiActive: 7.8, nonAi: 1.3, cumulative: 39.2 },
];

const COHORT_DATA = [
  { cohort: "카페", uplift: 8.4, execRate: 64, retention: 88 },
  { cohort: "베이커리", uplift: 7.2, execRate: 71, retention: 92 },
  { cohort: "한식", uplift: 6.1, execRate: 52, retention: 79 },
  { cohort: "미용", uplift: 5.8, execRate: 48, retention: 75 },
  { cohort: "양식", uplift: 9.2, execRate: 78, retention: 94 },
];

export function ROIPage() {
  const [showFormula, setShowFormula] = useState(false);

  return (
    <PageShell title="AI 성과·ROI" subtitle="AI 서비스 도입 가맹점의 실제 비즈니스 기여도를 분석합니다." freshness="오늘 09:42 기준">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: "누적 매출 증가 기여", value: "+₩2.4B", change: undefined },
          { label: "AI 영향 매출 증가율", value: "+7.8%", change: 0.6 },
          { label: "추천 실행률", value: "58.4%", change: 3.1 },
          { label: "리포트 열람률", value: "72.1%", change: 1.8 },
          { label: "위험 가맹점 회복률", value: "44.2%", change: 5.8 },
          { label: "AI 사용자 유지율", value: "88.4%", change: 1.2 },
        ].map((k) => (
          <MetricCard key={k.label} label={k.label} value={k.value} change={k.change} mini />
        ))}
      </div>

      {/* Methodology disclaimer */}
      <div className="bg-[#5B6CFF]/5 border border-[#5B6CFF]/20 rounded-2xl p-4 mb-5 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[#5B6CFF] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">분석 방법론 안내</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            AI 활성 그룹과 매칭된 비AI 그룹을 비교한 관찰 차이입니다. 동일 기간, 동일 업종·지역·규모 기준으로 매칭했습니다.
            <strong className="text-foreground"> 관찰된 차이이며 인과관계의 완전한 증명이 아닙니다.</strong>
            날씨, 외부 이벤트, 시장 트렌드 등 통제되지 않은 변수가 존재합니다.
          </p>
          <button onClick={() => setShowFormula(!showFormula)} className="flex items-center gap-1 mt-2 text-xs text-[#5B6CFF] font-semibold">
            {showFormula ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            산출 공식 자세히 보기
          </button>
          {showFormula && (
            <div className="mt-2 bg-white border border-[#5B6CFF]/20 rounded-xl p-3 text-xs text-muted-foreground font-mono">
              AI 기여 증가율 = (AI 그룹 평균 매출 변화율) - (비AI 매칭 그룹 평균 매출 변화율)<br />
              매칭 기준: 업종 동일 + 가입 시점 ±30일 + 지역 광역시도 동일
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* AI vs non-AI comparison */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">AI 활성 vs 비AI 코호트 비교</h3>
              <p className="text-xs text-muted-foreground">월별 매출 증가율 (%)</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#18C79A] rounded" />AI 활성</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-muted-foreground rounded border-dashed border-t border-muted-foreground" />비AI</span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CUMULATIVE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`]} />
                <Line type="monotone" dataKey="aiActive" stroke="#18C79A" strokeWidth={2.5} dot={false} name="AI 활성" />
                <Line type="monotone" dataKey="nonAi" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="비AI" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cohort table */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">업종별 코호트 비교</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["업종", "매출 증가율", "실행률", "유지율"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground py-2 pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COHORT_DATA.map((row) => (
                  <tr key={row.cohort} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{row.cohort}</td>
                    <td className="py-2.5 pr-3 text-[#0E9F6E] font-bold tabular-nums">+{row.uplift}%</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{row.execRate}%</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{row.retention}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-3">※ 관찰된 차이이며 인과관계를 보장하지 않습니다.</p>
        </div>
      </div>

      {/* Merchant ROI cards */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold mb-4">가맹점별 ROI 사례</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { name: "성수 브루랩", period: "4개월", uplift: "+18.7%", saved: "₩1.2M", category: "카페" },
            { name: "수원 팜투테이블", period: "8개월", uplift: "+31.4%", saved: "₩4.8M", category: "양식" },
            { name: "홍대 더브레드", period: "5개월", uplift: "+14.2%", saved: "₩1.8M", category: "베이커리" },
          ].map((m) => (
            <div key={m.name} className="bg-muted rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#18C79A]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#18C79A]" />
                </div>
                <div>
                  <div className="text-sm font-bold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.category} · {m.period}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">매출 증가</div>
                  <div className="text-base font-black text-[#0E9F6E]">{m.uplift}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">비용 절감</div>
                  <div className="text-base font-black text-[#2563EB]">{m.saved}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-3">※ 가명 처리된 실제 가맹점 데이터 기반. 개별 결과는 다를 수 있습니다.</p>
      </div>

      <EffectVerificationPerformanceSection />
    </PageShell>
  );
}
