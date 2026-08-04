import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { DataTable } from "../../shared/components/DataTable";
import { Badge } from "../../shared/components/Badge";
import { useLiveDateTime } from "../../shared/hooks/useLiveDateTime";
import { getMerchantMonitoring, type MerchantMonitoringItem } from "../../features/admin/api/merchantMonitoringApi";

type MonitorGroup = "inactive" | "notExecuted" | "verified" | "analyzed";
const GROUP_META: Record<MonitorGroup, { label: string; description: string; color: string; selected: string }> = {
  inactive: { label: "AI 비활성", description: "분석 데이터 없음", color: "border-slate-200 bg-slate-50 text-slate-700", selected: "border-slate-500 bg-slate-600 text-white" },
  notExecuted: { label: "추천 미실행", description: "실행 여부 확인 필요", color: "border-amber-200 bg-amber-50 text-amber-700", selected: "border-amber-500 bg-amber-500 text-white" },
  verified: { label: "검증 완료", description: "효과 검증 결과 있음", color: "border-emerald-200 bg-emerald-50 text-emerald-700", selected: "border-emerald-500 bg-emerald-600 text-white" },
  analyzed: { label: "분석 완료", description: "분석 결과 저장됨", color: "border-blue-200 bg-blue-50 text-blue-700", selected: "border-blue-500 bg-blue-600 text-white" },
};

function getGroup(merchant: MerchantMonitoringItem): MonitorGroup {
  if (!merchant.aiActive) return "inactive";
  if (merchant.recommendationRuns > 0 && merchant.executedRecommendations === 0) return "notExecuted";
  if (merchant.verifiedRecommendations > 0) return "verified";
  return "analyzed";
}

export function MerchantsPage() {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<MonitorGroup>("inactive");
  const [merchants, setMerchants] = useState<MerchantMonitoringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { label: freshness } = useLiveDateTime();

  useEffect(() => {
    getMerchantMonitoring().then((response) => setMerchants(response.merchants)).finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const result: Record<MonitorGroup, MerchantMonitoringItem[]> = { inactive: [], notExecuted: [], verified: [], analyzed: [] };
    merchants.forEach((merchant) => result[getGroup(merchant)].push(merchant));
    return result;
  }, [merchants]);
  const selectedMerchants = grouped[activeGroup];
  const filtered = merchants.filter((merchant) => query === "" || merchant.name.toLowerCase().includes(query.toLowerCase()) || merchant.owner.includes(query) || merchant.address.includes(query));

  return (
    <PageShell title="가맹점 관리" subtitle={`총 ${merchants.length}개 가맹점`} freshness={freshness}>
      <section className="mb-5 overflow-hidden rounded-3xl border border-[#D8E3F2] bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#E1E8F2] bg-gradient-to-r from-[#F8FAFC] via-white to-[#F4F8FF] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><AlertTriangle className="h-5 w-5" /></div><div><h2 className="font-bold">가맹점 운영 모니터링</h2><p className="mt-1 text-xs text-muted-foreground">MySQL에 저장된 가맹점·AI 분석·추천·검증 데이터만 표시합니다.</p></div></div>
          <span className="text-[11px] text-muted-foreground">실제 저장 데이터 기준</span>
        </div>
        <div className="grid gap-2 border-b border-border bg-[#FBFCFE] p-4 sm:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(GROUP_META) as MonitorGroup[]).map((group) => { const meta = GROUP_META[group]; const active = activeGroup === group; return <button key={group} type="button" onClick={() => setActiveGroup(group)} className={`rounded-2xl border px-4 py-3 text-left transition-all ${active ? `${meta.selected} shadow-lg` : `${meta.color} hover:-translate-y-0.5 hover:shadow-sm`}`}><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold">{meta.label}</span><span className="text-xl font-black tabular-nums">{grouped[group].length}</span></div><p className={`mt-1 text-[11px] ${active ? "text-white/75" : "opacity-75"}`}>{meta.description}</p></button>; })}
        </div>
        {loading ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">가맹점 데이터를 불러오는 중입니다.</div> : selectedMerchants.length === 0 ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">해당 상태의 가맹점이 없습니다.</div> : <div className="grid gap-3 p-4 xl:grid-cols-2">{selectedMerchants.map((merchant) => <article key={merchant.id} className="rounded-2xl border border-[#E1E7F0] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold">{merchant.name}</h3><p className="mt-1 text-xs text-muted-foreground">{merchant.owner} · {merchant.address} · {merchant.category}</p></div><Badge variant={merchant.aiActive ? "positive" : "muted"}>{merchant.aiActive ? "AI 활성" : "AI 비활성"}</Badge></div><div className="mt-3 grid grid-cols-4 gap-2"><MonitorMetric label="분석" value={`${merchant.analysisCount}건`} /><MonitorMetric label="추천" value={`${merchant.recommendationRuns}건`} /><MonitorMetric label="실행률" value={`${merchant.executionRate.toFixed(1)}%`} /><MonitorMetric label="검증" value={`${merchant.verifiedRecommendations}건`} /></div></article>)}</div>}
      </section>
      <div className="mb-3"><h2 className="font-bold">전체 가맹점</h2><p className="mt-1 text-xs text-muted-foreground">실제 저장된 가맹점과 AI 운영 데이터입니다.</p></div>
      <div className="relative mb-4"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="가맹점명·점주·주소 검색" className="h-10 w-full rounded-xl border border-border bg-card pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40" /></div>
      <DataTable columns={[
        { key: "name", label: "가맹점", render: (row) => <div><div className="font-semibold">{row.name}</div><div className="text-xs text-muted-foreground">{row.owner} · {row.address}</div></div> },
        { key: "category", label: "업종" },
        { key: "aiActive", label: "AI 상태", render: (row) => <Badge variant={row.aiActive ? "positive" : "muted"}>{row.aiActive ? "활성" : "비활성"}</Badge> },
        { key: "analysisCount", label: "분석", align: "right", render: (row) => <span>{row.analysisCount}건</span> },
        { key: "recommendationRuns", label: "추천", align: "right", render: (row) => <span>{row.recommendationRuns}건</span> },
        { key: "executionRate", label: "실행률", align: "right", render: (row) => <span>{row.executionRate.toFixed(1)}%</span> },
        { key: "verifiedRecommendations", label: "검증", align: "right", render: (row) => <span>{row.verifiedRecommendations}건</span> },
        { key: "averageEffectScore", label: "평균 효과 점수", align: "right", render: (row) => <span>{row.averageEffectScore == null ? "-" : row.averageEffectScore.toFixed(1)}</span> },
      ]} data={filtered} keyField="id" emptyMessage="검색 결과가 없습니다." />
    </PageShell>
  );
}

function MonitorMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted/70 px-3 py-2.5"><div className="text-[10px] text-muted-foreground">{label}</div><div className="mt-0.5 text-sm font-black tabular-nums">{value}</div></div>; }
