import { useState } from "react";
import { Package, AlertTriangle, X, Edit3, Check, ChevronDown } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { MetricCard } from "../../shared/components/MetricCard";
import { DataTable } from "../../shared/components/DataTable";
import { Badge } from "../../shared/components/Badge";
import { INVENTORY_ITEMS } from "../../mocks";
import type { InventoryItem } from "../../entities/inventory/inventory.types";

const STATUS_BADGE: Record<string, { variant: any; label: string }> = {
  "정상": { variant: "positive", label: "정상" },
  "부족": { variant: "warning", label: "부족" },
  "품절": { variant: "negative", label: "품절" },
  "과잉": { variant: "muted", label: "과잉" },
  "임박": { variant: "warning", label: "유통 임박" },
};

export function InventoryPage() {
  const [filterStatus, setFilterStatus] = useState<string>("전체");
  const [drawerItem, setDrawerItem] = useState<InventoryItem | null>(null);
  const [orderQty, setOrderQty] = useState<number>(0);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const filters = ["전체", "부족", "품절", "임박", "과잉"];

  const filtered = filterStatus === "전체"
    ? INVENTORY_ITEMS
    : INVENTORY_ITEMS.filter((i) => i.status === filterStatus);

  const lowStock = INVENTORY_ITEMS.filter((i) => i.status === "부족" || i.status === "품절").length;
  const expiry = INVENTORY_ITEMS.filter((i) => i.status === "임박").length;

  const openDrawer = (item: InventoryItem) => {
    setDrawerItem(item);
    setOrderQty(item.reorderQty || 0);
    setOrderConfirmed(false);
  };

  return (
    <PageShell title="재고·발주" freshness="오늘 09:42 기준">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricCard label="관리 품목 수" value={`${INVENTORY_ITEMS.length}개`} mini />
        <MetricCard label="부족·품절" value={`${lowStock}개`} mini />
        <MetricCard label="유통기한 임박" value={`${expiry}개`} mini />
        <MetricCard label="예상 폐기 비용" value="₩84,000" change={12} changePeriod="전주 대비" mini />
      </div>

      {/* AI prep recommendation */}
      <div className="bg-[#111A2E] rounded-2xl p-4 mb-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-[#246BFD]">AI 오늘의 밑작업 추천</span>
          <span className="text-xs text-white/40">신뢰도 88%</span>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">
          비 예보를 반영해 <strong className="text-white">배달 품목은 +10%</strong>, 홀 전용 품목은 -15% 보정했습니다.
          샌드위치 밑작업 18개, 크루아상 반죽 30개를 권장합니다.
        </p>
        <p className="text-[11px] text-white/30 mt-2">※ AI 추정치이며 실제 수요는 다를 수 있습니다.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              filterStatus === f ? "bg-[#246BFD] text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={[
          { key: "name", label: "품목명", render: (row) => <div className="font-semibold text-foreground">{row.name}</div> },
          { key: "lot", label: "로트", render: (row) => <span className="text-xs text-muted-foreground font-mono">{row.lot}</span> },
          { key: "stock", label: "재고량", align: "right", render: (row) => <span className="tabular-nums font-semibold">{row.stock} {row.unit}</span> },
          { key: "expectedDepletion", label: "소진 예상", render: (row) => (
            <span className={row.status === "부족" || row.status === "품절" ? "text-red-600 font-semibold" : "text-muted-foreground"}>
              {row.expectedDepletion}
            </span>
          )},
          { key: "expiry", label: "유통기한", render: (row) => (
            <span className={row.status === "임박" ? "text-amber-600 font-semibold" : "text-muted-foreground"}>{row.expiry}</span>
          )},
          { key: "supplier", label: "공급사", render: (row) => <span className="text-muted-foreground">{row.supplier}</span> },
          { key: "status", label: "상태", render: (row) => {
            const s = STATUS_BADGE[row.status];
            return <Badge variant={s.variant}>{s.label}</Badge>;
          }},
          { key: "action", label: "", render: (row) => (
            <button
              onClick={(e) => { e.stopPropagation(); openDrawer(row); }}
              className="text-xs text-[#246BFD] font-semibold hover:underline whitespace-nowrap"
            >
              발주 추천
            </button>
          )},
        ]}
        data={filtered}
        keyField="id"
        onRowClick={(row) => openDrawer(row)}
      />

      {/* Order drawer */}
      {drawerItem && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerItem(null)} />
          <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold">발주 추천</h3>
              <button onClick={() => setDrawerItem(null)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">품목</div>
                <div className="font-bold">{drawerItem.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "현재 재고", value: `${drawerItem.stock} ${drawerItem.unit}` },
                  { label: "소진 예상", value: drawerItem.expectedDepletion },
                  { label: "공급사", value: drawerItem.supplier },
                  { label: "리드타임", value: `${drawerItem.leadTime}일` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                    <div className="text-sm font-semibold">{value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                AI 추천: {drawerItem.reorderQty}{drawerItem.unit} 발주 권장 (안전재고 기준 + 날씨 보정)
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block">발주 수량</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={orderQty}
                    onChange={(e) => setOrderQty(Number(e.target.value))}
                    className="flex-1 h-10 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40"
                  />
                  <span className="text-sm text-muted-foreground">{drawerItem.unit}</span>
                </div>
              </div>

              {drawerItem.supplierPrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">예상 발주 금액</span>
                  <span className="font-bold tabular-nums">₩{(drawerItem.supplierPrice * orderQty).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border flex gap-2">
              {!orderConfirmed ? (
                <>
                  <button
                    onClick={() => setOrderConfirmed(true)}
                    className="flex-1 h-11 bg-[#246BFD] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors"
                  >
                    발주안 확정
                  </button>
                  <button onClick={() => setDrawerItem(null)} className="px-4 h-11 bg-muted text-sm font-semibold rounded-xl hover:bg-muted-foreground/10 transition-colors">
                    취소
                  </button>
                </>
              ) : (
                <div className="flex-1 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">발주안이 확정되었습니다.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
