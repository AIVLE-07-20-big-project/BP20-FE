import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, MessageSquare } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { Badge, RiskBadge, ConnectionBadge } from "../../shared/components/Badge";
import { MERCHANTS } from "../../mocks";

type Triage = "critical" | "high" | "watch" | "recovered";

const TRIAGE_LABELS: Record<Triage, { label: string; color: string; bg: string }> = {
  critical: { label: "긴급", color: "text-red-700", bg: "bg-red-50" },
  high: { label: "높음", color: "text-amber-700", bg: "bg-amber-50" },
  watch: { label: "관찰", color: "text-blue-700", bg: "bg-blue-50" },
  recovered: { label: "회복", color: "text-emerald-700", bg: "bg-emerald-50" },
};

export function RisksPage() {
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState<Triage>("critical");

  const riskMap: Record<Triage, typeof MERCHANTS> = {
    critical: MERCHANTS.filter(m => m.riskLevel === "critical"),
    high: MERCHANTS.filter(m => m.riskLevel === "high" || m.salesChange4w < -5),
    watch: MERCHANTS.filter(m => m.riskLevel === "watch"),
    recovered: MERCHANTS.filter(m => m.riskLevel === "stable" && m.salesChange4w > 5),
  };

  const merchants = riskMap[activeGroup];

  return (
    <PageShell title="위험 가맹점" subtitle="트리아지 기반 위험 가맹점 관리" freshness="오늘 09:42 기준">
      {/* Triage tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(Object.entries(TRIAGE_LABELS) as [Triage, typeof TRIAGE_LABELS[Triage]][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setActiveGroup(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeGroup === key
                ? "bg-[#087F65] text-white"
                : `${val.bg} ${val.color} hover:opacity-90`
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {val.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${activeGroup === key ? "bg-white/20" : "bg-white/60"}`}>
              {riskMap[key].length}
            </span>
          </button>
        ))}
      </div>

      {merchants.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">이 그룹에 해당하는 가맹점이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {merchants.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-2xl p-4 hover:border-muted-foreground/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-bold">{m.name}</h4>
                    <RiskBadge level={m.riskLevel} />
                    <ConnectionBadge status={m.posStatus} />
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{m.owner} · {m.region} · {m.industry} · 담당: {m.assignedManager}</div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "4주 매출", value: `${m.salesChange4w}%`, neg: m.salesChange4w < 0 },
                      { label: "리포트 열람", value: `${m.reportOpenRate}%`, neg: m.reportOpenRate < 40 },
                      { label: "추천 실행", value: `${m.executionRate}%`, neg: m.executionRate < 30 },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl p-2.5 ${s.neg ? "bg-red-50" : "bg-muted"}`}>
                        <div className="text-[11px] text-muted-foreground">{s.label}</div>
                        <div className={`text-sm font-bold tabular-nums ${s.neg ? "text-red-600" : "text-foreground"}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => navigate(`/admin/merchants/${m.id}`)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[#087F65] text-white rounded-xl hover:bg-[#066652] transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                    상세 보기
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" />
                    메모
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    담당 배정
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
