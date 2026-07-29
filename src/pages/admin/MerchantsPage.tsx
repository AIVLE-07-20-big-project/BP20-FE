import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Download,
  Filter,
  Search,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { DataTable } from "../../shared/components/DataTable";
import { Badge, RiskBadge, ConnectionBadge } from "../../shared/components/Badge";
import { useLiveDateTime } from "../../shared/hooks/useLiveDateTime";
import { MERCHANTS } from "../../mocks";

type RiskGroup = "critical" | "high" | "watch" | "recovered";

const RISK_GROUP_META: Record<RiskGroup, {
  label: string;
  description: string;
  color: string;
  selected: string;
}> = {
  critical: {
    label: "긴급",
    description: "즉시 확인 필요",
    color: "border-red-200 bg-red-50 text-red-700",
    selected: "border-red-500 bg-red-600 text-white shadow-red-100",
  },
  high: {
    label: "높음",
    description: "우선 대응 필요",
    color: "border-amber-200 bg-amber-50 text-amber-700",
    selected: "border-amber-500 bg-amber-500 text-white shadow-amber-100",
  },
  watch: {
    label: "관찰",
    description: "지속 모니터링",
    color: "border-blue-200 bg-blue-50 text-blue-700",
    selected: "border-blue-500 bg-blue-600 text-white shadow-blue-100",
  },
  recovered: {
    label: "회복",
    description: "지표 개선 확인",
    color: "border-emerald-200 bg-emerald-50 text-emerald-700",
    selected: "border-emerald-500 bg-emerald-600 text-white shadow-emerald-100",
  },
};

export function MerchantsPage() {
  const [query, setQuery] = useState("");
  const [activeRiskGroup, setActiveRiskGroup] = useState<RiskGroup>("critical");
  const navigate = useNavigate();
  const { label: freshness } = useLiveDateTime();

  const riskMap: Record<RiskGroup, typeof MERCHANTS> = {
    critical: MERCHANTS.filter((merchant) => merchant.riskLevel === "critical"),
    high: MERCHANTS.filter((merchant) =>
      merchant.riskLevel === "high"
      || (merchant.riskLevel !== "critical" && merchant.salesChange4w < -15)),
    watch: MERCHANTS.filter((merchant) =>
      merchant.riskLevel === "watch" && merchant.salesChange4w >= -15),
    recovered: MERCHANTS.filter((merchant) =>
      merchant.riskLevel === "stable" && merchant.salesChange4w > 5),
  };
  const highlightedMerchants = riskMap[activeRiskGroup];

  const filtered = MERCHANTS.filter((m) =>
    query === "" || m.name.includes(query) || m.owner.includes(query) || m.region.includes(query)
  );

  return (
    <PageShell
      title="가맹점 관리"
      subtitle={`총 ${MERCHANTS.length}개 가맹점`}
      freshness={freshness}
      actions={
        <>
          <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors">
            <Filter className="w-3.5 h-3.5" />
            필터
          </button>
          <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors">
            <Download className="w-3.5 h-3.5" />
            내보내기
          </button>
          <button
            onClick={() => navigate("/admin/accounts/store-owners")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[#246BFD] text-white rounded-xl hover:bg-[#1D4ED8] transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            점주 초대
          </button>
        </>
      }
    >
      <section className="mb-5 overflow-hidden rounded-3xl border border-[#D8E3F2] bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#E1E8F2] bg-gradient-to-r from-[#FFF7F6] via-white to-[#F4F8FF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold">위험 가맹점 모니터링</h2>
                <Badge variant="negative">
                  확인 필요 {riskMap.critical.length + riskMap.high.length}곳
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                매출 변화와 서비스 활용 지표를 기준으로 우선 확인할 가맹점을 분류했습니다.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">현재 프론트엔드 샘플 데이터 기준</span>
        </div>

        <div className="grid gap-2 border-b border-border bg-[#FBFCFE] p-4 sm:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(RISK_GROUP_META) as RiskGroup[]).map((group) => {
            const meta = RISK_GROUP_META[group];
            const active = activeRiskGroup === group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => setActiveRiskGroup(group)}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  active ? `${meta.selected} shadow-lg` : `${meta.color} hover:-translate-y-0.5 hover:shadow-sm`
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold">{meta.label}</span>
                  <span className="text-xl font-black tabular-nums">{riskMap[group].length}</span>
                </div>
                <p className={`mt-1 text-[11px] ${active ? "text-white/75" : "opacity-75"}`}>
                  {meta.description}
                </p>
              </button>
            );
          })}
        </div>

        {highlightedMerchants.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            해당 그룹에 포함된 가맹점이 없습니다.
          </div>
        ) : (
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {highlightedMerchants.map((merchant) => (
              <article
                key={merchant.id}
                className="rounded-2xl border border-[#E1E7F0] bg-white p-4 transition hover:border-[#BFCDE1] hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold">{merchant.name}</h3>
                      <RiskBadge level={merchant.riskLevel} />
                      <ConnectionBadge status={merchant.posStatus} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {merchant.owner} · {merchant.region} · 담당 {merchant.assignedManager}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/merchants/${merchant.id}`)}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl bg-[#246BFD] px-3 text-[11px] font-bold text-white hover:bg-[#1D4ED8]"
                  >
                    상세 <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <RiskMetric
                    label="4주 매출"
                    value={`${merchant.salesChange4w >= 0 ? "+" : ""}${merchant.salesChange4w}%`}
                    warning={merchant.salesChange4w < 0}
                  />
                  <RiskMetric
                    label="리포트 열람"
                    value={`${merchant.reportOpenRate}%`}
                    warning={merchant.reportOpenRate < 40}
                  />
                  <RiskMetric
                    label="추천 실행"
                    value={`${merchant.executionRate}%`}
                    warning={merchant.executionRate < 30}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Search */}
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-bold">전체 가맹점</h2>
          <p className="mt-1 text-xs text-muted-foreground">가맹점별 연결·활용·위험 상태를 한 번에 확인합니다.</p>
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="매장명, 점주명, 지역 검색"
          className="h-10 w-full rounded-xl border border-border bg-card pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "name",
            label: "매장",
            render: (row) => (
              <div>
                <div className="font-semibold">{row.name}</div>
                <div className="text-xs text-muted-foreground">{row.owner} · {row.region}</div>
              </div>
            ),
          },
          { key: "industry", label: "업종" },
          {
            key: "posStatus",
            label: "POS 상태",
            render: (row) => <ConnectionBadge status={row.posStatus} />,
          },
          {
            key: "aiStatus",
            label: "AI 상태",
            render: (row) => (
              <Badge variant={row.aiStatus === "active" ? "positive" : row.aiStatus === "trial" ? "info" : "muted"}>
                {row.aiStatus === "active" ? "활성" : row.aiStatus === "trial" ? "트라이얼" : "비활성"}
              </Badge>
            ),
          },
          {
            key: "riskLevel",
            label: "위험도",
            render: (row) => <RiskBadge level={row.riskLevel} />,
          },
          {
            key: "salesChange4w",
            label: "4주 매출 변화",
            align: "right",
            render: (row) => (
              <span className={`tabular-nums font-semibold ${row.salesChange4w >= 0 ? "text-[#0E9F6E]" : "text-[#D92D20]"}`}>
                {row.salesChange4w >= 0 ? "+" : ""}{row.salesChange4w}%
              </span>
            ),
          },
          {
            key: "reportOpenRate",
            label: "리포트 열람률",
            align: "right",
            render: (row) => <span className="tabular-nums text-muted-foreground">{row.reportOpenRate}%</span>,
          },
          {
            key: "executionRate",
            label: "추천 실행률",
            align: "right",
            render: (row) => <span className="tabular-nums text-muted-foreground">{row.executionRate}%</span>,
          },
          {
            key: "subscription",
            label: "구독",
            render: (row) => <Badge variant="muted">{row.subscription}</Badge>,
          },
          {
            key: "assignedManager",
            label: "담당자",
            render: (row) => <span className="text-muted-foreground">{row.assignedManager}</span>,
          },
        ]}
        data={filtered}
        keyField="id"
        onRowClick={(row) => navigate(`/admin/merchants/${row.id}`)}
        emptyMessage="검색 결과가 없습니다."
      />
    </PageShell>
  );
}

function RiskMetric({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning: boolean;
}) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${warning ? "bg-red-50" : "bg-muted/70"}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-black tabular-nums ${warning ? "text-red-600" : "text-foreground"}`}>
        {warning && <AlertTriangle className="mr-1 inline h-3 w-3" />}
        {value}
      </div>
    </div>
  );
}
