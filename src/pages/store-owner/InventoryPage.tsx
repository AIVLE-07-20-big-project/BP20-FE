import { useEffect, useState, type ChangeEvent } from "react";
import { AlertTriangle, Check, CloudRain, FileSpreadsheet, MapPin, RefreshCw, Upload, X } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { MetricCard } from "../../shared/components/MetricCard";
import { DataTable } from "../../shared/components/DataTable";
import { Badge } from "../../shared/components/Badge";
import type { InventoryItem } from "../../entities/inventory/inventory.types";
import {
  getCsvUploadStatus,
  getUploadedInventories,
  uploadCsv,
  type CsvDataType,
  type CsvUploadStatus,
} from "../../features/inventory/api/inventoryApi";
import {
  generateAutomaticOrderRecommendation,
  type AutomaticOrderRecommendation,
} from "../../features/order-recommendation/api/orderRecommendationApi";
import { searchLocations, type LocationCandidate } from "../../features/location/api/locationApi";

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
  const [automaticResult, setAutomaticResult] = useState<AutomaticOrderRecommendation | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const [csvFiles, setCsvFiles] = useState<Partial<Record<CsvDataType, File>>>({});
  const [csvStatus, setCsvStatus] = useState<CsvUploadStatus | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvMessage, setCsvMessage] = useState("");
  const [csvError, setCsvError] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<LocationCandidate[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationCandidate | null>(null);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationError, setLocationError] = useState("");

  const filters = ["전체", "부족", "품절", "임박", "과잉"];

  const filtered = filterStatus === "전체"
    ? inventoryItems
    : inventoryItems.filter((i) => i.status === filterStatus);

  const lowStock = inventoryItems.filter((i) => i.status === "부족" || i.status === "품절").length;
  const expiry = inventoryItems.filter((i) => i.status === "임박").length;

  const openDrawer = (item: InventoryItem) => {
    setDrawerItem(item);
    setOrderQty(item.reorderQty || 0);
    setOrderConfirmed(false);
  };

  const loadAutomaticRecommendation = () => {
    if (!selectedLocation) {
      setRecommendationError("날씨를 조회할 위치를 먼저 선택해 주세요.");
      return;
    }
    setRecommendationLoading(true);
    setRecommendationError("");
    generateAutomaticOrderRecommendation(selectedLocation.latitude, selectedLocation.longitude)
      .then(setAutomaticResult)
      .catch((error) => setRecommendationError(error instanceof Error ? error.message : "발주 추천을 불러오지 못했습니다."))
      .finally(() => setRecommendationLoading(false));
  };

  const findLocations = async () => {
    const query = locationQuery.trim();
    if (query.length < 2) {
      setLocationError("위치는 두 글자 이상 입력해 주세요.");
      return;
    }
    setLocationSearching(true);
    setLocationError("");
    setLocationResults([]);
    try {
      const results = await searchLocations(query);
      setLocationResults(results);
      if (results.length === 0) setLocationError("검색 결과가 없습니다. 시·구·동을 함께 입력해 보세요.");
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "위치를 검색하지 못했습니다.");
    } finally {
      setLocationSearching(false);
    }
  };

  const chooseLocation = (location: LocationCandidate) => {
    setSelectedLocation(location);
    setLocationQuery(location.displayName);
    setLocationResults([]);
    setLocationError("");
    setAutomaticResult(null);
    setRecommendationError("");
  };

  const loadInventoryData = async () => {
    setInventoryLoading(true);
    setInventoryError("");
    try {
      const [items, status] = await Promise.all([getUploadedInventories(), getCsvUploadStatus()]);
      setInventoryItems(items);
      setCsvStatus(status);
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : "재고 목록을 불러오지 못했습니다.");
    } finally {
      setInventoryLoading(false);
    }
  };

  const selectCsvFile = (type: CsvDataType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setCsvFiles((current) => ({ ...current, [type]: file }));
    setCsvMessage("");
    setCsvError("");
  };

  const uploadSelectedCsvFiles = async () => {
    const selected = Object.entries(csvFiles) as [CsvDataType, File][];
    if (selected.length === 0) {
      setCsvError("업로드할 CSV 파일을 하나 이상 선택해 주세요.");
      return;
    }

    setCsvUploading(true);
    setCsvMessage("");
    setCsvError("");
    try {
      const results = [];
      for (const [type, file] of selected) {
        results.push(await uploadCsv(type, file));
      }
      setCsvMessage(`${results.length}개 CSV 파일을 MySQL에 저장했습니다.`);
      setCsvFiles({});
      await loadInventoryData();
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "CSV 업로드에 실패했습니다.");
    } finally {
      setCsvUploading(false);
    }
  };

  useEffect(() => {
    void loadInventoryData();
  }, []);

  return (
    <PageShell title="재고·발주" freshness="오늘 09:42 기준">
      <section className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <MapPin className="w-4 h-4 text-[#246BFD]" />
              날씨 기반 발주 추천
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              현재 위치: {selectedLocation?.displayName ?? "선택되지 않음"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">선택한 위치의 오늘·내일 날씨와 업로드된 상품·매출·재고 데이터를 함께 분석합니다.</p>
          </div>
          <button
            type="button"
            onClick={loadAutomaticRecommendation}
            disabled={recommendationLoading || !selectedLocation}
            className="flex items-center gap-2 px-3 h-9 bg-[#246BFD] text-white text-xs font-bold rounded-xl disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recommendationLoading ? "animate-spin" : ""}`} />
            {recommendationLoading ? "날씨 분석 중" : automaticResult ? "다시 분석" : "추천 실행"}
          </button>
        </div>

        <div className="mt-4">
          <div className="flex gap-2">
            <input
              type="search"
              value={locationQuery}
              onChange={(event) => {
                setLocationQuery(event.target.value);
                if (selectedLocation && event.target.value !== selectedLocation.displayName) setSelectedLocation(null);
              }}
              onKeyDown={(event) => { if (event.key === "Enter") void findLocations(); }}
              placeholder="예: 대전시 둔산동"
              className="flex-1 h-9 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40"
            />
            <button
              type="button"
              onClick={() => void findLocations()}
              disabled={locationSearching}
              className="px-4 h-9 bg-muted text-sm font-semibold rounded-xl border border-border disabled:opacity-60"
            >
              {locationSearching ? "검색 중" : "위치 검색"}
            </button>
          </div>
          {locationError && <div className="mt-2 text-xs text-red-600">{locationError}</div>}
          {locationResults.length > 0 && (
            <div className="mt-2 border border-border rounded-xl overflow-hidden">
              {locationResults.map((location) => (
                <button
                  key={`${location.displayName}-${location.latitude}-${location.longitude}`}
                  type="button"
                  onClick={() => chooseLocation(location)}
                  className="w-full text-left px-3 py-2.5 text-sm border-b border-border last:border-0 hover:bg-muted transition-colors"
                >
                  {location.displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        {recommendationError && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
            {recommendationError}
          </div>
        )}

        {automaticResult && (
          <div className="mt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {automaticResult.weatherForecasts.map((weather, index) => (
                <div key={`${weather.forecastDateTime}-${index}`} className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                    <CloudRain className="w-4 h-4" />
                    {index === 0 ? "오늘" : "내일"} 날씨
                  </div>
                  <div className="mt-2 text-sm font-semibold">{weather.sky ?? "정보 없음"} · {weather.temperature ?? "-"}℃</div>
                  <div className="mt-1 text-xs text-blue-700/70">강수 {weather.precipitationType ?? "정보 없음"} · 확률 {weather.rainProbability ?? "-"}% · 습도 {weather.humidity ?? "-"}%</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-sm font-bold mb-2">실시간 추천 결과 {automaticResult.recommendations.length}건</div>
              <div className="space-y-2">
                {automaticResult.recommendations.map((recommendation) => (
                  <div key={recommendation.ingredientName} className="border border-border rounded-xl p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold text-sm">{recommendation.ingredientName}</div>
                      <Badge variant={recommendation.orderRequired ? "warning" : "positive"}>
                        {recommendation.orderRequired ? `${recommendation.recommendedOrderQuantity}개 발주 권장` : "발주 불필요"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                      <span>현재 {recommendation.currentStock}</span>
                      <span>예상 사용 {recommendation.expectedUsage}</span>
                      <span>안전재고 {recommendation.safetyStock}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{recommendation.recommendationReason}</p>
                    <div className="text-[11px] text-muted-foreground/70 mt-1">모델 {recommendation.modelName} · 신뢰도 {(recommendation.confidenceScore * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-[#246BFD]" />
              CSV 데이터 업로드
            </div>
            <p className="text-xs text-muted-foreground mt-1">선택한 파일은 현재 점주 계정의 기존 데이터를 교체하고 MySQL에 저장됩니다.</p>
          </div>
          {csvStatus && (
            <div className="text-xs text-muted-foreground">
              상품 {csvStatus.productCount}건 · 매출 {csvStatus.salesCount}건 · 재고 {csvStatus.inventoryCount}건
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {([
            { type: "products" as const, label: "상품 CSV" },
            { type: "sales" as const, label: "매출 CSV" },
            { type: "inventories" as const, label: "재고 CSV" },
          ]).map(({ type, label }) => (
            <label key={type} className="border border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-[#246BFD]/50 transition-colors">
              <span className="block text-xs font-bold mb-1">{label}</span>
              <span className="block text-xs text-muted-foreground truncate">{csvFiles[type]?.name ?? "파일 선택"}</span>
              <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => selectCsvFile(type, event)} />
            </label>
          ))}
        </div>

        {csvMessage && <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3">{csvMessage}</div>}
        {csvError && <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">{csvError}</div>}

        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={uploadSelectedCsvFiles}
            disabled={csvUploading}
            className="flex items-center gap-2 px-4 h-9 bg-[#246BFD] text-white text-xs font-bold rounded-xl disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5" />
            {csvUploading ? "MySQL 저장 중" : "선택한 파일 업로드"}
          </button>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricCard label="관리 품목 수" value={`${inventoryItems.length}개`} mini />
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
      {inventoryError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">{inventoryError}</div>
      )}
      {!inventoryLoading && !inventoryError && inventoryItems.length === 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl p-3">
          업로드된 재고 CSV가 없습니다. 재고 CSV를 먼저 업로드해 주세요.
        </div>
      )}
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
