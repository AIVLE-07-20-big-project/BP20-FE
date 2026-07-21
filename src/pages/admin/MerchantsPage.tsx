import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, Filter } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { DataTable } from "../../shared/components/DataTable";
import { Badge, RiskBadge, ConnectionBadge } from "../../shared/components/Badge";
import { MERCHANTS } from "../../mocks";

export function MerchantsPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = MERCHANTS.filter((m) =>
    query === "" || m.name.includes(query) || m.owner.includes(query) || m.region.includes(query)
  );

  return (
    <PageShell
      title="가맹점 관리"
      subtitle={`총 ${MERCHANTS.length}개 가맹점`}
      freshness="오늘 09:42 기준"
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
        </>
      }
    >
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="매장명, 점주명, 지역 검색"
          className="w-full h-10 pl-8 pr-4 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18C79A]/40"
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
