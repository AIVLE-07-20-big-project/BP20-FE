import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, AlertTriangle, TrendingUp, BarChart3,
  ChevronRight, Sparkles, Activity
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { MetricCard } from "../../shared/components/MetricCard";
import { LiveDateTime } from "../../shared/components/LiveDateTime";
import { MERCHANTS } from "../../mocks";

const HEALTH_DATA = [
  { name: "안정", count: 842, color: "#0E9F6E", bg: "bg-emerald-50", text: "text-emerald-700" },
  { name: "관찰", count: 328, color: "#D97706", bg: "bg-amber-50", text: "text-amber-700" },
  { name: "위험", count: 114, color: "#D92D20", bg: "bg-red-50", text: "text-red-700" },
];

const TREND_DATA = [
  { month: "2월", active: 820, uplift: 4.2 },
  { month: "3월", active: 890, uplift: 5.1 },
  { month: "4월", active: 980, uplift: 5.8 },
  { month: "5월", active: 1050, uplift: 6.4 },
  { month: "6월", active: 1150, uplift: 7.2 },
  { month: "7월", active: 1170, uplift: 7.8 },
];

const INDUSTRY_DATA = [
  { industry: "카페", count: 384 },
  { industry: "한식", count: 218 },
  { industry: "베이커리", count: 142 },
  { industry: "양식", count: 98 },
  { industry: "미용", count: 84 },
  { industry: "기타", count: 358 },
];

export function PortfolioDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("전체");

  const critical = MERCHANTS.filter(m => m.riskLevel === "critical");

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">가맹점 운영 현황</h1>
            <LiveDateTime className="mt-1 flex" />
          </div>
          <div className="flex gap-2">
            {["전체", "서울", "경기", "부산"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                filter === f ? "bg-[#087F65] text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}>{f}</button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
          {[
            { label: "전체 가맹점", value: "1,284개" },
            { label: "AI 활성", value: "1,170개", change: 12.4 },
            { label: "위험 가맹점", value: "114개", change: -8.2 },
            { label: "AI 영향 매출 증가", value: "+7.8%", change: 0.6 },
            { label: "추천 실행률", value: "58.4%", change: 3.1 },
            { label: "리포트 열람률", value: "72.1%", change: 1.8 },
          ].map((k) => (
            <MetricCard key={k.label} label={k.label} value={k.value} change={k.change} mini />
          ))}
        </div>

        {/* Main bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Portfolio health */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-4">포트폴리오 건강도</h3>
            <div className="space-y-3 mb-4">
              {HEALTH_DATA.map((h) => (
                <div key={h.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-semibold ${h.text}`}>{h.name}</span>
                    <span className="font-bold tabular-nums">{h.count}개</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(h.count / 1284) * 100}%`, background: h.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {HEALTH_DATA.map((h) => (
                <div key={h.name} className={`flex-1 ${h.bg} rounded-xl p-2.5 text-center`}>
                  <div className={`text-lg font-black ${h.text}`}>{h.count}</div>
                  <div className="text-[11px] text-muted-foreground">{h.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI active trend */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">AI 활성 가맹점 추이</h3>
                <p className="text-xs text-muted-foreground">월별 AI 매출 기여도</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA}>
                  <defs>
                    <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#18C79A" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#18C79A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="active" stroke="#18C79A" fill="url(#activeGrad)" strokeWidth={2} name="AI 활성 가맹점" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Risk signal */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-red-800">위험 신호</h3>
            </div>
            <p className="text-sm text-red-700 mb-4">
              서울 강남구 카페 업종 중 최근 4주 매출이 20% 이상 하락한 매장이 <strong>38곳</strong>입니다.
              AI 비활성 상태이거나 추천 실행률이 20% 미만인 매장이 포함되어 있습니다.
            </p>
            <button onClick={() => navigate("/admin/risks")} className="flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline">
              위험 가맹점 확인 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Industry distribution */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-4">업종별 분포</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={INDUSTRY_DATA} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="industry" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#5B6CFF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Critical merchants needing attention */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">개입 필요 가맹점</h3>
            <button onClick={() => navigate("/admin/risks")} className="text-xs text-[#087F65] font-semibold hover:underline flex items-center gap-0.5">
              전체 보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {critical.map((m) => (
              <div key={m.id} onClick={() => navigate(`/admin/merchants/${m.id}`)} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl cursor-pointer hover:border-red-300 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.region} · {m.industry} · 담당: {m.assignedManager}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-red-600 tabular-nums">{m.salesChange4w}%</div>
                  <div className="text-xs text-muted-foreground">4주 매출 변화</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent incidents */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-bold">시스템 현황</h3>
          </div>
          <div className="space-y-2">
            {[
              { status: "정상", label: "POS 데이터 수집", detail: "1,240개 가맹점 정상 수신 중", color: "text-[#0E9F6E]", dot: "bg-[#0E9F6E]" },
              { status: "지연", label: "리뷰 데이터 연동", detail: "44개 가맹점 수집 지연 (12분)", color: "text-[#D97706]", dot: "bg-[#D97706]" },
              { status: "정상", label: "AI 분석 엔진", detail: "모든 가맹점 일일 분석 완료", color: "text-[#0E9F6E]", dot: "bg-[#0E9F6E]" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                <span className="font-medium w-32">{s.label}</span>
                <span className="text-muted-foreground flex-1">{s.detail}</span>
                <span className={`text-xs font-semibold ${s.color}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
