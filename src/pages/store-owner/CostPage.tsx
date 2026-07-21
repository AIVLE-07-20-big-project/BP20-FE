import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, LineChart, Line
} from "recharts";
import { Download, Upload, Sparkles, AlertCircle, ChevronRight, X, FileText, TrendingUp } from "lucide-react";

const DATE_PRESETS = ["이번 달", "지난달", "최근 3개월", "직접 설정"];

const EXPENSE_TREND = [
  { month: "2월", 식재료비: 2900000, 포장재비: 420000, 소모품비: 200000, 공과금: 295000, 광고비: 350000, 유지비: 160000 },
  { month: "3월", 식재료비: 3050000, 포장재비: 440000, 소모품비: 215000, 공과금: 302000, 광고비: 380000, 유지비: 170000 },
  { month: "4월", 식재료비: 3100000, 포장재비: 455000, 소모품비: 205000, 공과금: 310000, 광고비: 360000, 유지비: 175000 },
  { month: "5월", 식재료비: 3200000, 포장재비: 460000, 소모품비: 220000, 공과금: 308000, 광고비: 390000, 유지비: 180000 },
  { month: "6월", 식재료비: 3380000, 포장재비: 470000, 소모품비: 218000, 공과금: 312000, 광고비: 375000, 유지비: 195000 },
  { month: "7월", 식재료비: 3648000, 포장재비: 462000, 소모품비: 218000, 공과금: 358000, 광고비: 380000, 유지비: 204000 },
];

const BUDGET_DATA = [
  { name: "식재료비", budget: 3200000, actual: 3648000, over: true },
  { name: "포장재비", budget: 480000, actual: 462000, over: false },
  { name: "소모품비", budget: 240000, actual: 218000, over: false },
  { name: "공과금", budget: 320000, actual: 358000, over: true },
  { name: "광고비", budget: 400000, actual: 380000, over: false },
  { name: "유지비", budget: 180000, actual: 204000, over: true },
];

const INGREDIENT_TREND = [
  { month: "2월", 양파: 850, 원두: 18000, 우유: 2200, 닭가슴살: 8500 },
  { month: "3월", 양파: 900, 원두: 18200, 우유: 2250, 닭가슴살: 8600 },
  { month: "4월", 양파: 920, 원두: 18000, 우유: 2300, 닭가슴살: 8700 },
  { month: "5월", 양파: 980, 원두: 18500, 우유: 2280, 닭가슴살: 8800 },
  { month: "6월", 양파: 1050, 원두: 18300, 우유: 2320, 닭가슴살: 9000 },
  { month: "7월", 양파: 1240, 원두: 18800, 우유: 2350, 닭가슴살: 9100 },
];

const PROFIT_TABLE = [
  { name: "아이스 아메리카노", price: 5500, cost: 1320, discount: 200, margin: 3980, rate: 72.4 },
  { name: "카페라떼", price: 6000, cost: 1680, discount: 0, margin: 4320, rate: 72.0 },
  { name: "샌드위치", price: 8500, cost: 4250, discount: 500, margin: 3750, rate: 44.1 },
  { name: "크로아상", price: 4500, cost: 2100, discount: 0, margin: 2400, rate: 53.3 },
  { name: "딸기라떼", price: 7000, cost: 2800, discount: 300, margin: 3900, rate: 55.7 },
];

const TRANSACTIONS = [
  { id: "TX001", date: "07.20", vendor: "CJ프레시웨이", category: "식재료비", type: "세금계산서", amount: 228580, status: "검토 완료", confidence: 98 },
  { id: "TX002", date: "07.19", vendor: "한국전력", category: "공과금", type: "전자세금계산서", amount: 358000, status: "검토 완료", confidence: 100 },
  { id: "TX003", date: "07.18", vendor: "에코팩", category: "포장재비", type: "영수증", amount: 85000, status: "검토 완료", confidence: 95 },
  { id: "TX004", date: "07.15", vendor: "파리크라상", category: "식재료비", type: "영수증", amount: 96000, status: "검토 필요", confidence: 72 },
  { id: "TX005", date: "07.14", vendor: "네이버 광고", category: "광고비", type: "온라인 영수증", amount: 150000, status: "처리 중", confidence: 90 },
  { id: "TX006", date: "07.12", vendor: "GS25 성수점", category: "소모품비", type: "영수증", amount: 44500, status: "검토 완료", confidence: 88 },
  { id: "TX007", date: "07.10", vendor: "이마트 트레이더스", category: "식재료비", type: "영수증", amount: 312000, status: "검토 완료", confidence: 96 },
];

const STACK_COLORS: Record<string, string> = {
  식재료비: "#246BFD",
  포장재비: "#8B5CF6",
  소모품비: "#38BDF8",
  공과금: "#D97706",
  광고비: "#D92D20",
  유지비: "#0E9F6E",
};

const INGR_COLORS: Record<string, string> = { 양파: "#D97706", 원두: "#246BFD", 우유: "#8B5CF6", 닭가슴살: "#0E9F6E" };

function KpiCard({ label, value, change, period, sparkData }: { label: string; value: string; change: number; period: string; sparkData: number[] }) {
  const pos = change >= 0;
  const sparkColor = pos ? "#0E9F6E" : "#D92D20";
  const pts = sparkData;
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const norm = pts.map(v => ((v - min) / range) * 28 + 4);
  const w = 60;
  const step = w / (pts.length - 1);
  const path = norm.map((y, i) => `${i === 0 ? "M" : "L"} ${i * step} ${32 - y}`).join(" ");

  return (
    <div className="bg-card border border-border rounded-2xl p-4 group relative">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-black tabular-nums">{value}</div>
          <div className={`text-xs font-semibold mt-0.5 ${pos ? "text-[#0E9F6E]" : "text-[#D92D20]"}`}>
            {pos ? "▲" : "▼"} {Math.abs(change)}% {period}
          </div>
        </div>
        <svg width={w} height={32} className="mb-1">
          <path d={path} fill="none" stroke={sparkColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#111A2E] text-white text-[11px] px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
        <div className="font-bold">{label}</div>
        <div>{value}</div>
        <div className={pos ? "text-[#0E9F6E]" : "text-[#F87171]"}>{pos ? "▲" : "▼"} {Math.abs(change)}% ({period})</div>
      </div>
    </div>
  );
}

interface TxDrawerProps { tx: typeof TRANSACTIONS[0]; onClose: () => void; }
function TxDrawer({ tx, onClose }: TxDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border-l border-border h-full overflow-y-auto z-10 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold">거래 상세</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 flex-1">
          {/* Thumbnail placeholder */}
          <div className="h-36 bg-muted rounded-2xl flex items-center justify-center">
            <FileText className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: "거래ID", value: tx.id },
              { label: "거래처", value: tx.vendor },
              { label: "거래일", value: tx.date },
              { label: "분류", value: tx.category },
              { label: "증빙 유형", value: tx.type },
              { label: "금액", value: `₩${tx.amount.toLocaleString()}` },
              { label: "OCR 신뢰도", value: `${tx.confidence}%` },
              { label: "검토 상태", value: tx.status },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="text-xs font-semibold mb-1">편집 이력</div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>07.20 09:42 — AI 자동 분류</div>
              <div>07.20 10:15 — 김민지 점주 검토 완료</div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button className="w-full text-xs text-[#246BFD] font-semibold py-2 bg-[#246BFD]/8 hover:bg-[#246BFD]/15 rounded-xl transition-colors">
            AI 가계부 원본 보기
          </button>
        </div>
      </div>
    </div>
  );
}

export function CostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"expenses" | "cost" | "transactions">("expenses");
  const [datePreset, setDatePreset] = useState("이번 달");
  const [searchTx, setSearchTx] = useState("");
  const [selectedTx, setSelectedTx] = useState<typeof TRANSACTIONS[0] | null>(null);
  const [highlightItem, setHighlightItem] = useState<string | null>(null);
  const [highlightCategory, setHighlightCategory] = useState<string | null>(null);

  // Deep-link: parse query params on mount
  useEffect(() => {
    const tab = searchParams.get("tab");
    const item = searchParams.get("item");
    const category = searchParams.get("category");
    if (tab === "cost") { setActiveTab("cost"); setHighlightItem(item); }
    else if (tab === "expenses") { setActiveTab("expenses"); setHighlightCategory(category); }
    else if (tab === "transactions") { setActiveTab("transactions"); }
  }, [searchParams]);

  const filteredTx = TRANSACTIONS.filter(t =>
    t.vendor.includes(searchTx) || t.category.includes(searchTx) || t.type.includes(searchTx)
  );

  const tabs = [
    { key: "expenses" as const, label: "지출 현황" },
    { key: "cost" as const, label: "원가 분석" },
    { key: "transactions" as const, label: "거래 내역" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">지출·원가</h1>
            <p className="text-sm text-muted-foreground mt-0.5">AI 가계부와 POS 데이터를 연결해 지출, 매입 원가, 상품 수익성을 함께 분석합니다.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/store/ledger")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[#246BFD]/10 text-[#246BFD] border border-[#246BFD]/30 rounded-xl hover:bg-[#246BFD]/20 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />증빙 업로드
            </button>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors">
              <Download className="w-3.5 h-3.5" />내보내기
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {DATE_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setDatePreset(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                datePreset === p ? "bg-[#246BFD] text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
          <select className="ml-auto text-xs px-3 py-1.5 bg-card border border-border rounded-xl text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30">
            <option>전체 분류</option>
            <option>식재료비</option>
            <option>공과금</option>
            <option>광고비</option>
          </select>
          <select className="text-xs px-3 py-1.5 bg-card border border-border rounded-xl text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30">
            <option>전체 공급사</option>
            <option>CJ프레시웨이</option>
            <option>파리크라상</option>
          </select>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KpiCard label="이번 달 총지출" value="8,420,000원" change={6.2} period="지난달 대비" sparkData={[7.2, 7.5, 7.8, 7.6, 8.1, 8.42]} />
          <KpiCard label="매출원가율" value="31.8%" change={1.4} period="지난달 대비" sparkData={[29.8, 30.2, 30.8, 31.0, 31.4, 31.8]} />
          <KpiCard label="예상 순이익" value="8,420,000원" change={-1.8} period="목표 대비" sparkData={[9.2, 8.9, 8.7, 8.5, 8.6, 8.42]} />
          <KpiCard label="예산 초과 항목" value="2건" change={100} period="지난달 대비" sparkData={[0, 1, 1, 0, 1, 2]} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors relative ${
                activeTab === t.key
                  ? "text-[#246BFD] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#246BFD] after:rounded-t"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: 지출 현황 */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            {/* Monthly trend */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-1">월별 지출 추이</h3>
              <p className="text-xs text-muted-foreground mb-4">분류별 누적 지출</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={EXPENSE_TREND} stackOffset="none">
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/10000).toFixed(0)}만`} />
                    <Tooltip formatter={(v: number, n: string) => [`₩${v.toLocaleString()}`, n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {Object.entries(STACK_COLORS).map(([key, color]) => (
                      <Bar key={key} dataKey={key} stackId="a" fill={color} radius={key === "유지비" ? [4,4,0,0] : [0,0,0,0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Budget vs actual */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-4">예산 대비 실제 지출</h3>
                <div className="space-y-3">
                  {BUDGET_DATA.map(c => {
                    const isHighlighted = highlightCategory && c.name === highlightCategory;
                    const pct = Math.min(120, (c.actual / c.budget) * 100);
                    return (
                      <div key={c.name} className={`p-2 rounded-xl transition-colors ${isHighlighted ? "bg-[#246BFD]/8 ring-1 ring-[#246BFD]/30" : ""}`}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{c.name}{isHighlighted && <span className="ml-1.5 text-[10px] font-bold text-[#246BFD] bg-[#246BFD]/10 px-1.5 py-0.5 rounded">하이라이트</span>}</span>
                          <span className={`font-bold tabular-nums ${c.over ? "text-[#D92D20]" : "text-[#0E9F6E]"}`}>
                            ₩{c.actual.toLocaleString()} / ₩{c.budget.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.over ? "bg-[#D92D20]" : "bg-[#246BFD]"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {c.over ? `예산 ${Math.round((c.actual / c.budget - 1) * 100)}% 초과` : `예산 내 (${Math.round(pct)}%)`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI anomaly panel */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                  <h3 className="font-bold">AI 이상 지출 감지</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { title: "식재료비 급증", desc: "7월 식재료비가 전월 대비 13.9% 증가. 양파 단가 상승(+18%)이 주원인입니다.", link: "거래 내역 확인", urgent: true },
                    { title: "공과금 예산 초과", desc: "이번 달 공과금이 예산 대비 12% 초과했습니다. 냉방비 증가가 원인으로 분석됩니다.", link: "거래 내역 확인", urgent: true },
                    { title: "유지비 소폭 증가", desc: "6월 대비 유지비가 4.6% 상승했습니다. 특이 거래는 감지되지 않았습니다.", link: "상세 보기", urgent: false },
                  ].map(item => (
                    <div key={item.title} className={`rounded-xl p-3 flex items-start gap-3 ${item.urgent ? "bg-red-50/70 border border-red-100" : "bg-muted/60"}`}>
                      <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${item.urgent ? "text-red-500" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <div className="text-xs font-bold mb-0.5">{item.title}</div>
                        <p className="text-xs text-muted-foreground mb-1.5">{item.desc}</p>
                        <button
                          onClick={() => setActiveTab("transactions")}
                          className="text-[11px] text-[#246BFD] font-semibold flex items-center gap-0.5"
                        >
                          {item.link} <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent expense table */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-4">최근 지출 내역</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["거래일", "거래처", "분류", "증빙 유형", "금액", "검토 상태"].map(h => (
                        <th key={h} className="text-left text-muted-foreground font-semibold pb-2 pr-4 last:pr-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TRANSACTIONS.slice(0, 5).map(t => (
                      <tr key={t.id} onClick={() => setSelectedTx(t)} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                        <td className="py-3 pr-4 text-muted-foreground">{t.date}</td>
                        <td className="py-3 pr-4 font-semibold">{t.vendor}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{t.category}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{t.type}</td>
                        <td className="py-3 pr-4 font-bold tabular-nums">₩{t.amount.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === "검토 완료" ? "text-[#0E9F6E] bg-[#0E9F6E]/10" :
                            t.status === "검토 필요" ? "text-[#246BFD] bg-[#246BFD]/10" :
                            "text-muted-foreground bg-muted"
                          }`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: 원가 분석 */}
        {activeTab === "cost" && (
          <div className="space-y-4">
            {/* Ingredient price trend */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-bold">매입 단가 추이</h3>
                  <p className="text-xs text-muted-foreground mb-4">주요 식재료 월별 매입 단가 (원/단위)</p>
                </div>
                {highlightItem && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                    {highlightItem} 강조 표시 중
                  </span>
                )}
              </div>
              {highlightItem === "양파" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-800">양파 단가 지난달 대비 18% 상승</span>
                    <p className="text-xs text-amber-700 mt-0.5">6월 1,050원 → 7월 1,240원/kg. 여름철 기상이변 영향으로 분석됩니다.</p>
                  </div>
                </div>
              )}
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={INGREDIENT_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString()}원`, n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {Object.entries(INGR_COLORS).map(([key, color]) => (
                      <Line
                        key={key}
                        dataKey={key}
                        stroke={color}
                        strokeWidth={key === "양파" && highlightItem === "양파" ? 3 : 2}
                        dot={key === "양파" && highlightItem === "양파"}
                        strokeDasharray={key !== "양파" && highlightItem === "양파" ? "4 2" : undefined}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profitability table */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-4">상품별 수익성</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["상품명", "판매가", "재료비", "할인액", "공헌이익", "이익률"].map(h => (
                        <th key={h} className="text-left text-muted-foreground font-semibold pb-2 pr-4 last:pr-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PROFIT_TABLE.map(r => (
                      <tr key={r.name} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4 font-semibold">{r.name}</td>
                        <td className="py-3 pr-4 tabular-nums">₩{r.price.toLocaleString()}</td>
                        <td className="py-3 pr-4 tabular-nums text-muted-foreground">₩{r.cost.toLocaleString()}</td>
                        <td className="py-3 pr-4 tabular-nums text-muted-foreground">{r.discount ? `₩${r.discount.toLocaleString()}` : "—"}</td>
                        <td className="py-3 pr-4 tabular-nums font-bold">₩{r.margin.toLocaleString()}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
                              <div className={`h-full rounded-full ${r.rate >= 60 ? "bg-[#0E9F6E]" : r.rate >= 45 ? "bg-[#246BFD]" : "bg-amber-400"}`} style={{ width: `${r.rate}%` }} />
                            </div>
                            <span className="font-bold">{r.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* What-if calculator */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <h3 className="font-bold">원가 시뮬레이터</h3>
                <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-1.5 py-0.5 rounded">AI 분석</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: "식재료 단가 변동", unit: "%", placeholder: "예: +10" },
                  { label: "메뉴 가격 조정", unit: "%", placeholder: "예: +5" },
                  { label: "할인율 변경", unit: "%", placeholder: "예: -2" },
                  { label: "번들 구성 변경", unit: "개", placeholder: "예: 2+1" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold mb-1">{f.label}</label>
                    <div className="flex items-center gap-1">
                      <input placeholder={f.placeholder} className="flex-1 h-8 px-3 text-xs bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30" />
                      <span className="text-xs text-muted-foreground">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#246BFD]/5 border border-[#246BFD]/15 rounded-xl p-3 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 inline mr-1 text-[#8B5CF6]" />
                값을 입력하면 AI가 예상 이익률 변화를 분석합니다. 결과는 예상치이며 실제와 다를 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* TAB: 거래 내역 */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={searchTx}
                onChange={e => setSearchTx(e.target.value)}
                placeholder="거래처, 분류, 증빙 유형 검색"
                className="flex-1 h-9 px-4 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
              />
              <select className="text-xs px-3 h-9 bg-card border border-border rounded-xl text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30">
                <option>전체 상태</option>
                <option>검토 완료</option>
                <option>검토 필요</option>
                <option>처리 중</option>
              </select>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              {filteredTx.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">검색 결과가 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {["거래일", "거래처", "분류", "증빙 유형", "금액", "OCR 신뢰도", "검토 상태"].map(h => (
                          <th key={h} className="text-left text-muted-foreground font-semibold pb-2 pr-4 last:pr-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTx.map(t => (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTx(t)}
                          className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 pr-4 text-muted-foreground">{t.date}</td>
                          <td className="py-3 pr-4 font-semibold">{t.vendor}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{t.category}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{t.type}</td>
                          <td className="py-3 pr-4 font-bold tabular-nums">₩{t.amount.toLocaleString()}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${t.confidence >= 90 ? "bg-[#0E9F6E]" : t.confidence >= 75 ? "bg-[#246BFD]" : "bg-amber-400"}`} style={{ width: `${t.confidence}%` }} />
                              </div>
                              <span className="tabular-nums">{t.confidence}%</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              t.status === "검토 완료" ? "text-[#0E9F6E] bg-[#0E9F6E]/10" :
                              t.status === "검토 필요" ? "text-[#246BFD] bg-[#246BFD]/10" :
                              "text-muted-foreground bg-muted"
                            }`}>{t.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transaction side drawer */}
      {selectedTx && <TxDrawer tx={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  );
}
