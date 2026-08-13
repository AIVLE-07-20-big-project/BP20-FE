import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, AlertTriangle, Check, ChevronDown, ChevronUp, CloudRain, FileSpreadsheet, MapPin, ShoppingCart, Upload, X } from "lucide-react";
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
import {
  getStoreLocation,
  type LocationCandidate,
} from "../../features/location/api/locationApi";

const STATUS_BADGE: Record<string, { variant: any; label: string }> = {
  "정상": { variant: "positive", label: "정상" },
  "부족": { variant: "warning", label: "부족" },
  "품절": { variant: "negative", label: "품절" },
  "과잉": { variant: "muted", label: "과잉" },
  "임박": { variant: "warning", label: "유통 임박" },
};

const STATUS_SORT_ORDER: Record<InventoryItem["status"], number> = {
  "정상": 0,
  "부족": 1,
  "품절": 2,
  "임박": 3,
  "과잉": 4,
};

type InventorySortKey = "name" | "status";

interface CompletedOrder {
  id: string;
  inventoryId: string;
  itemName: string;
  quantity: number;
  unit: string;
  supplier: string;
  orderedAt: string;
}

export function InventoryPage() {
  const [filterStatus, setFilterStatus] = useState<string>("전체");
  const [inventorySortKey, setInventorySortKey] = useState<InventorySortKey>("name");
  const [inventorySortDirection, setInventorySortDirection] = useState<"ASC" | "DESC">("ASC");
  const [drawerItem, setDrawerItem] = useState<InventoryItem | null>(null);
  const [orderQty, setOrderQty] = useState<number | "">("");
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
  const [selectedLocation, setSelectedLocation] = useState<LocationCandidate | null>(null);
  const [recommendationSortDirection, setRecommendationSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [orderRequiredOnly, setOrderRequiredOnly] = useState(false);
  const [bulkOrderOpen, setBulkOrderOpen] = useState(false);
  const [recommendationsExpanded, setRecommendationsExpanded] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkOrderQuantities, setBulkOrderQuantities] = useState<Record<string, number>>({});
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [completedOrderDetail, setCompletedOrderDetail] = useState<CompletedOrder | null>(null);
  const [orderSelectionMessage, setOrderSelectionMessage] = useState("");
  const initialRecommendationStarted = useRef(false);

  const filters = ["전체", "부족", "품절", "임박", "과잉"];

  const filtered = useMemo(() => {
    const statusFiltered = filterStatus === "전체"
      ? inventoryItems
      : inventoryItems.filter((item) => item.status === filterStatus);

    return [...statusFiltered].sort((left, right) => {
      const result = inventorySortKey === "name"
        ? left.name.localeCompare(right.name, "ko")
        : STATUS_SORT_ORDER[left.status] - STATUS_SORT_ORDER[right.status]
          || left.name.localeCompare(right.name, "ko");
      return inventorySortDirection === "ASC" ? result : -result;
    });
  }, [filterStatus, inventoryItems, inventorySortDirection, inventorySortKey]);

  const lowStock = inventoryItems.filter((i) => i.status === "부족" || i.status === "품절").length;
  const expiry = inventoryItems.filter((i) => i.status === "임박").length;

  const displayedRecommendations = useMemo(() => {
    if (!automaticResult) return [];

    const recommendations = orderRequiredOnly
      ? automaticResult.recommendations.filter((recommendation) => recommendation.orderRequired)
      : automaticResult.recommendations;

    return [...recommendations].sort((left, right) => {
      const quantityDifference = left.recommendedOrderQuantity - right.recommendedOrderQuantity;
      const result = quantityDifference || left.ingredientName.localeCompare(right.ingredientName, "ko");
      return recommendationSortDirection === "ASC" ? result : -result;
    });
  }, [automaticResult, orderRequiredOnly, recommendationSortDirection]);

  const selectedInventoryItems = inventoryItems.filter((item) => selectedOrderIds.has(item.id));
  const latestCompletedOrderByInventoryId = useMemo(() => {
    const result = new Map<string, CompletedOrder>();
    completedOrders.forEach((order) => {
      if (!result.has(order.inventoryId)) result.set(order.inventoryId, order);
    });
    return result;
  }, [completedOrders]);

  const getRecommendedQuantity = (item: InventoryItem) => automaticResult?.recommendations.find(
    (recommendation) => recommendation.ingredientName.trim() === item.name.trim(),
  )?.recommendedOrderQuantity;

  const drawerRecommendation = drawerItem
    ? automaticResult?.recommendations.find(
        (recommendation) => recommendation.ingredientName.trim() === drawerItem.name.trim(),
      )
    : undefined;

  const openDrawer = (item: InventoryItem) => {
    setDrawerItem(item);
    setOrderQty(getRecommendedQuantity(item) ?? "");
    setOrderConfirmed(latestCompletedOrderByInventoryId.has(item.id));
  };

  const toggleOrderSelection = (item: InventoryItem) => {
    setSelectedOrderIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const openBulkOrder = () => {
    const quantities = Object.fromEntries(selectedInventoryItems.map((item) => [
      item.id,
      getRecommendedQuantity(item) ?? Math.max(1, item.reorderQty || 1),
    ]));
    setBulkOrderQuantities(quantities);
    setBulkOrderOpen(true);
  };

  const selectRecommendedOrderItems = () => {
    if (!automaticResult) {
      setOrderSelectionMessage("발주 추천 기능을 실행해야 합니다.");
      return;
    }

    const recommendedNames = new Set(
      automaticResult.recommendations
        .filter((recommendation) => recommendation.orderRequired && recommendation.recommendedOrderQuantity > 0)
        .map((recommendation) => recommendation.ingredientName.trim()),
    );
    const recommendedInventoryIds = inventoryItems
      .filter((item) => recommendedNames.has(item.name.trim()))
      .map((item) => item.id);

    setSelectedOrderIds(new Set(recommendedInventoryIds));
    setOrderSelectionMessage(
      recommendedInventoryIds.length > 0
        ? `${recommendedInventoryIds.length}개 발주 추천 품목을 선택했습니다.`
        : "발주가 필요한 추천 품목이 없습니다.",
    );
  };

  const recordOrders = (items: Array<{ item: InventoryItem; quantity: number }>) => {
    const orderedAt = new Date().toISOString();
    const orders = items
      .filter(({ quantity }) => quantity > 0)
      .map(({ item, quantity }, index) => ({
        id: `${orderedAt}-${item.id}-${index}`,
        inventoryId: item.id,
        itemName: item.name,
        quantity,
        unit: item.unit,
        supplier: item.supplier,
        orderedAt,
      }));
    setCompletedOrders((current) => [...orders, ...current]);
    return orders;
  };

  const toggleInventorySort = (key: InventorySortKey) => {
    if (inventorySortKey === key) {
      setInventorySortDirection((current) => current === "ASC" ? "DESC" : "ASC");
      return;
    }
    setInventorySortKey(key);
    setInventorySortDirection("ASC");
  };

  const loadAutomaticRecommendation = (location: LocationCandidate | null = selectedLocation) => {
    if (!location) {
      setRecommendationError("매장 커머스에서 내 매장을 먼저 등록해 주세요.");
      return;
    }
    setRecommendationLoading(true);
    setRecommendationError("");
    setOrderSelectionMessage("");
    generateAutomaticOrderRecommendation(location.latitude, location.longitude)
      .then((result) => {
        setAutomaticResult(result);
        setRecommendationsExpanded(true);
      })
      .catch((error) => setRecommendationError(error instanceof Error ? error.message : "발주 추천을 불러오지 못했습니다."))
      .finally(() => setRecommendationLoading(false));
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
    if (initialRecommendationStarted.current) return;
    initialRecommendationStarted.current = true;

    void loadInventoryData();
    void getStoreLocation()
      .then((location) => {
        setSelectedLocation(location);
        loadAutomaticRecommendation(location);
      })
      .catch((error) => {
        setRecommendationError(
          error instanceof Error
            ? error.message
            : "등록된 매장 주소를 불러오지 못했습니다. 매장 커머스에서 내 매장을 먼저 등록해 주세요.",
        );
      });
  }, []);

  return (
    <PageShell title="재고·발주" liveFreshness>
      <section className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <MapPin className="w-4 h-4 text-[#246BFD]" />
              날씨 기반 발주 추천
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              매장 위치: {selectedLocation?.displayName ?? "매장 주소 확인 중"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">등록된 매장 주소의 일주일 날씨와 업로드된 상품·매출·재고 데이터를 자동으로 분석합니다.</p>
          </div>
          {recommendationLoading && (
            <span className="text-xs font-semibold text-[#246BFD]">날씨와 재고를 자동 분석하는 중입니다.</span>
          )}
        </div>

        {recommendationError && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
            {recommendationError}
          </div>
        )}

        {automaticResult && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-7 gap-2 overflow-x-auto">
              {automaticResult.weatherForecasts.map((weather, index) => (
                <div key={weather.date} className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                    <CloudRain className="w-4 h-4" />
                    {index === 0 ? "오늘" : new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }).format(new Date(`${weather.date}T00:00:00`))}
                  </div>
                  <div className="mt-2 text-sm font-semibold">{weather.weatherCondition ?? "정보 없음"}</div>
                  <div className="mt-1 text-xs text-blue-700/80">
                    최고 {weather.maximumTemperature == null ? "-" : weather.maximumTemperature.toFixed(1)}℃ · 최저 {weather.minimumTemperature == null ? "-" : weather.minimumTemperature.toFixed(1)}℃
                  </div>
                  <div className="mt-1 text-xs text-blue-700/70">강수확률 {weather.rainProbability ?? "-"}% · 습도 {weather.humidity ?? "-"}%</div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setRecommendationsExpanded((current) => !current)}
                  aria-expanded={recommendationsExpanded}
                  className="inline-flex items-center gap-1.5 text-base font-bold hover:text-[#246BFD] transition-colors"
                >
                  실시간 추천 결과 {displayedRecommendations.length}건
                  {recommendationsExpanded
                    ? <ChevronUp className="h-4 w-4" />
                    : <ChevronDown className="h-4 w-4" />}
                </button>
                {recommendationsExpanded && <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderRequiredOnly((current) => !current)}
                    aria-pressed={orderRequiredOnly}
                    className={`h-8 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      orderRequiredOnly
                        ? "bg-[#246BFD] border-[#246BFD] text-white"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {orderRequiredOnly ? "발주 필요 품목만" : "전체 품목"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendationSortDirection((current) => current === "ASC" ? "DESC" : "ASC")}
                    aria-label={`발주 수량 ${recommendationSortDirection === "ASC" ? "오름차순" : "내림차순"}`}
                    title={`발주 수량 ${recommendationSortDirection === "ASC" ? "오름차순" : "내림차순"}`}
                    className="h-8 px-2.5 flex items-center gap-1 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {recommendationSortDirection === "ASC" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                    발주량
                  </button>
                </div>}
              </div>
              {recommendationsExpanded && <div className="grid gap-3 lg:grid-cols-2">
                {displayedRecommendations.map((recommendation) => (
                  <div key={recommendation.ingredientName} className="border border-border rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-base font-bold">{recommendation.ingredientName}</div>
                      <Badge variant={recommendation.orderRequired ? "warning" : "positive"}>
                        {recommendation.orderRequired ? `${recommendation.recommendedOrderQuantity}개 발주 권장` : "발주 불필요"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-sm text-muted-foreground">
                      <span>현재 <strong className="text-foreground">{recommendation.currentStock}</strong></span>
                      <span>예상 사용 <strong className="text-foreground">{recommendation.expectedUsage}</strong></span>
                      <span>안전재고 <strong className="text-foreground">{recommendation.safetyStock}</strong></span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{recommendation.recommendationReason}</p>
                  </div>
                ))}
                {displayedRecommendations.length === 0 && (
                  <div className="border border-dashed border-border rounded-xl p-5 text-center text-sm text-muted-foreground lg:col-span-2">
                    발주가 필요한 품목이 없습니다.
                  </div>
                )}
              </div>}
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

      {/* Filters */}
      {inventoryError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">{inventoryError}</div>
      )}
      {!inventoryLoading && !inventoryError && inventoryItems.length === 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl p-3">
          업로드된 재고 CSV가 없습니다. 재고 CSV를 먼저 업로드해 주세요.
        </div>
      )}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 flex-wrap">{filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              filterStatus === f ? "bg-[#246BFD] text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectRecommendedOrderItems}
            className="h-9 px-4 rounded-xl border border-[#246BFD] bg-card text-[#246BFD] text-xs font-bold hover:bg-blue-50"
          >
            발주 추천 품목 선택
          </button>
          <button
            type="button"
            onClick={openBulkOrder}
            disabled={selectedInventoryItems.length === 0}
            className="h-9 px-4 inline-flex items-center gap-2 rounded-xl bg-[#246BFD] text-white text-xs font-bold disabled:opacity-40"
          >
            <ShoppingCart className="w-4 h-4" />
            선택 품목 일괄 발주 ({selectedInventoryItems.length})
          </button>
        </div>
      </div>
      {orderSelectionMessage && (
        <div className={`mb-3 rounded-xl border px-3 py-2 text-xs ${
          !automaticResult
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-blue-200 bg-blue-50 text-blue-700"
        }`}>
          {orderSelectionMessage}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={[
          { key: "selection", label: (
            <input
              type="checkbox"
              aria-label="현재 표시된 품목 전체 선택"
              checked={filtered.length > 0 && filtered.every((item) => selectedOrderIds.has(item.id))}
              onChange={(event) => {
                const checked = event.target.checked;
                setSelectedOrderIds((current) => {
                  const next = new Set(current);
                  filtered.forEach((item) => checked ? next.add(item.id) : next.delete(item.id));
                  return next;
                });
              }}
              onClick={(event) => event.stopPropagation()}
              className="h-4 w-4 accent-[#246BFD]"
            />
          ), render: (row) => (
            <input
              type="checkbox"
              aria-label={`${row.name} 발주 선택`}
              checked={selectedOrderIds.has(row.id)}
              onChange={() => toggleOrderSelection(row)}
              onClick={(event) => event.stopPropagation()}
              className="h-4 w-4 accent-[#246BFD]"
            />
          )},
          { key: "name", label: (
            <button
              type="button"
              onClick={() => toggleInventorySort("name")}
              aria-label={`품목명 ${inventorySortKey === "name" && inventorySortDirection === "DESC" ? "내림차순" : "오름차순"}`}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              품목명
              {inventorySortKey === "name" && inventorySortDirection === "DESC"
                ? <ArrowDown className="w-3.5 h-3.5" />
                : <ArrowUp className={`w-3.5 h-3.5 ${inventorySortKey === "name" ? "text-foreground" : "opacity-40"}`} />}
            </button>
          ), render: (row) => <div className="font-semibold text-foreground">{row.name}</div> },
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
          { key: "status", label: (
            <button
              type="button"
              onClick={() => toggleInventorySort("status")}
              aria-label={`상태 ${inventorySortKey === "status" && inventorySortDirection === "DESC" ? "내림차순" : "오름차순"}`}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              상태
              {inventorySortKey === "status" && inventorySortDirection === "DESC"
                ? <ArrowDown className="w-3.5 h-3.5" />
                : <ArrowUp className={`w-3.5 h-3.5 ${inventorySortKey === "status" ? "text-foreground" : "opacity-40"}`} />}
            </button>
          ), render: (row) => {
            const s = STATUS_BADGE[row.status];
            return <Badge variant={s.variant}>{s.label}</Badge>;
          }},
          { key: "action", label: "", render: (row) => {
            const completedOrder = latestCompletedOrderByInventoryId.get(row.id);
            return completedOrder ? (
              <button
                onClick={(event) => { event.stopPropagation(); setCompletedOrderDetail(completedOrder); }}
                className="text-xs text-emerald-600 font-semibold hover:underline whitespace-nowrap"
              >
                발주 완료
              </button>
            ) : null;
          }},
        ]}
        data={filtered}
        keyField="id"
        onRowClick={(row) => openDrawer(row)}
      />

      <section className="mt-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold">발주 완료 품목</h2>
          <span className="text-xs text-muted-foreground">총 {completedOrders.length}건</span>
        </div>
        <DataTable
          columns={[
            { key: "itemName", label: "품목명", render: (row) => <span className="font-semibold">{row.itemName}</span> },
            { key: "quantity", label: "발주 수량", align: "right", render: (row) => <span className="font-semibold tabular-nums">{row.quantity} {row.unit}</span> },
            { key: "supplier", label: "공급사", render: (row) => <span className="text-muted-foreground">{row.supplier}</span> },
            { key: "orderedAt", label: "발주 일시", render: (row) => <span className="text-muted-foreground">{new Date(row.orderedAt).toLocaleString("ko-KR")}</span> },
            { key: "detail", label: "", render: (row) => (
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); setCompletedOrderDetail(row); }}
                className="text-xs font-semibold text-[#246BFD] hover:underline"
              >
                상세 보기
              </button>
            )},
          ]}
          data={completedOrders}
          keyField="id"
          emptyMessage="아직 발주 완료된 품목이 없습니다."
        />
      </section>

      {bulkOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="font-bold">선택 품목 일괄 발주</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  선택한 {selectedInventoryItems.length}개 품목의 발주 수량을 확인해 주세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkOrderOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                aria-label="일괄 발주 창 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto p-5">
              {selectedInventoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5"
                >
                  <span className="text-sm font-semibold">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={bulkOrderQuantities[item.id] ?? 1}
                      onChange={(event) => setBulkOrderQuantities((current) => ({
                        ...current,
                        [item.id]: Math.max(1, Number(event.target.value)),
                      }))}
                      className="h-9 w-24 rounded-lg border border-border bg-card px-2 text-right text-sm"
                    />
                    <span className="w-8 text-xs text-muted-foreground">{item.unit}</span>
                  </div>
                  </div>
                ))}
              </div>
            <div className="flex gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  recordOrders(selectedInventoryItems.map((item) => ({
                    item,
                    quantity: bulkOrderQuantities[item.id] ?? 1,
                  })));
                  setSelectedOrderIds(new Set());
                  setBulkOrderOpen(false);
                }}
                className="h-11 flex-1 rounded-xl bg-[#246BFD] text-sm font-bold text-white hover:bg-[#1D4ED8]"
              >
                {selectedInventoryItems.length}개 품목 발주 확정
              </button>
              <button
                type="button"
                onClick={() => setBulkOrderOpen(false)}
                className="h-11 rounded-xl bg-muted px-4 text-sm font-semibold"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {completedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-bold">발주 완료 상세</h3>
              <button
                type="button"
                onClick={() => setCompletedOrderDetail(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                aria-label="발주 상세 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">품목명</span><strong>{completedOrderDetail.itemName}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">발주 수량</span><strong className="text-[#246BFD]">{completedOrderDetail.quantity} {completedOrderDetail.unit}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">공급사</span><strong>{completedOrderDetail.supplier}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">발주 일시</span><strong>{new Date(completedOrderDetail.orderedAt).toLocaleString("ko-KR")}</strong></div>
            </div>
            <div className="border-t border-border p-4">
              <button type="button" onClick={() => setCompletedOrderDetail(null)} className="h-10 w-full rounded-xl bg-muted text-sm font-semibold">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* Order drawer */}
      {drawerItem && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerItem(null)} />
          <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold">발주 등록</h3>
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

              {drawerRecommendation && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  AI 추천: {drawerRecommendation.recommendedOrderQuantity}{drawerItem.unit} 발주 권장 (재고·매출·날씨 분석)
                </div>
              )}

              <div>
                <label className="text-xs font-semibold mb-1.5 block">발주 수량</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={orderQty}
                    min={1}
                    placeholder={automaticResult ? "추천 수량 없음" : "자동 분석 완료 후 추천 수량 입력"}
                    onChange={(e) => setOrderQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="flex-1 h-10 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40"
                  />
                  <span className="text-sm text-muted-foreground">{drawerItem.unit}</span>
                </div>
              </div>

              {drawerItem.supplierPrice != null && drawerItem.supplierPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">예상 발주 금액</span>
                  <span className="font-bold tabular-nums">₩{(drawerItem.supplierPrice * (orderQty || 0)).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border flex gap-2">
              {!orderConfirmed ? (
                <>
                  <button
                    onClick={() => {
                      if (drawerItem && orderQty !== "" && orderQty > 0) {
                        recordOrders([{ item: drawerItem, quantity: orderQty }]);
                        setOrderConfirmed(true);
                      }
                    }}
                    disabled={orderQty === "" || orderQty <= 0}
                    className="flex-1 h-11 bg-[#246BFD] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors disabled:opacity-40"
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
