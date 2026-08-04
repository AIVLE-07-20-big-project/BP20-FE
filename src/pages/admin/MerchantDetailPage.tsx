import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Building2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MERCHANTS, WEEKLY_SALES } from "../../mocks";
import { Badge, RiskBadge, ConnectionBadge } from "../../shared/components/Badge";

const TABS = ["개요", "매출", "AI 사용", "추천·실행", "리뷰", "구독·계약", "활동 기록"];

const TIMELINE = [
  { date: "2025-07-20", event: "위험 신호 감지", detail: "4주 매출 -28.7% → 위험 등급 상향", type: "risk" },
  { date: "2025-07-15", event: "POS 연동 오류", detail: "연결 오류 발생, 미해결 상태", type: "system" },
  { date: "2025-07-10", event: "리포트 미열람", detail: "7월 2주차 리포트 미열람 (7일 경과)", type: "engagement" },
  { date: "2025-06-20", event: "AI 활성화", detail: "AI 기능 최초 활성화", type: "positive" },
];

export function MerchantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const merchant = MERCHANTS.find((m) => m.id === id) || MERCHANTS[0];
  const [activeTab, setActiveTab] = useState("개요");

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Back */}
        <button onClick={() => navigate("/admin/risks")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          위험 신호 목록으로
        </button>

        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-2xl bg-[#18C79A]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-[#18C79A]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">{merchant.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{merchant.owner} 점주</span>
                <span>·</span>
                <span>{merchant.region}</span>
                <span>·</span>
                <span>{merchant.industry}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <RiskBadge level={merchant.riskLevel} />
                <ConnectionBadge status={merchant.posStatus} />
                <Badge variant={merchant.aiStatus === "active" ? "mint" : "muted"}>
                  AI {merchant.aiStatus === "active" ? "활성" : "비활성"}
                </Badge>
                <Badge variant="muted">{merchant.subscription} 플랜</Badge>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="text-xs px-3 py-2 bg-muted rounded-xl font-semibold hover:bg-muted-foreground/10 transition-colors">
                담당자 변경
              </button>
              <button className="text-xs px-3 py-2 bg-[#087F65] text-white rounded-xl font-semibold hover:bg-[#066652] transition-colors">
                메모 추가
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            {[
              { label: "4주 매출 변화", value: `${merchant.salesChange4w}%`, color: merchant.salesChange4w >= 0 ? "text-[#0E9F6E]" : "text-[#D92D20]" },
              { label: "리포트 열람률", value: `${merchant.reportOpenRate}%`, color: "text-foreground" },
              { label: "추천 실행률", value: `${merchant.executionRate}%`, color: "text-foreground" },
              { label: "담당자", value: merchant.assignedManager, color: "text-foreground" },
            ].map((m) => (
              <div key={m.label} className="bg-muted rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-0.5">{m.label}</div>
                <div className={`text-sm font-bold tabular-nums ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab ? "bg-[#087F65] text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "개요" && (
          <div className="space-y-4">
            {/* Sales chart */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-4">매출 추이 (최근 7일)</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={WEEKLY_SALES}>
                    <defs>
                      <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#18C79A" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#18C79A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/10000).toFixed(0)}만`} />
                    <Tooltip formatter={(v: number) => [`₩${v.toLocaleString()}`]} />
                    <Area type="monotone" dataKey="total" stroke="#18C79A" fill="url(#mGrad)" strokeWidth={2} name="매출" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-4">활동 타임라인</h3>
              <div className="space-y-4">
                {TIMELINE.map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      t.type === "risk" ? "bg-red-500" : t.type === "system" ? "bg-amber-500" : t.type === "positive" ? "bg-emerald-500" : "bg-muted-foreground"
                    }`} />
                    <div>
                      <div className="text-xs text-muted-foreground">{t.date}</div>
                      <div className="text-sm font-semibold">{t.event}</div>
                      <div className="text-xs text-muted-foreground">{t.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab !== "개요" && (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm text-muted-foreground">{activeTab} 데이터를 불러오는 중...</p>
          </div>
        )}
      </div>
    </div>
  );
}
