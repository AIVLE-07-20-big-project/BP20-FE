import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, CheckCircle2, AlertCircle, Edit3, FileText,
  ChevronRight, Sparkles, TrendingUp, ExternalLink, Info, Loader2, Download
} from "lucide-react";
import { ApiError } from "@/shared/api/httpClient";
import { createReceipt, getLedgerReportHtml, getReceipts, parseReceiptImage } from "@/entities/receipt/receipt.api";
import type {
  ReceiptItemData,
  ReceiptParseResult,
  ReceiptResponse,
  ReportType,
} from "@/entities/receipt/receipt.types";

// TODO: 로그인/매장 선택 기능이 붙으면 실제 storeId로 교체
const STORE_ID = 1;

type Step = "inbox" | "uploading" | "review" | "saving" | "done";

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  RECEIPT: "영수증",
  SIMPLE_RECEIPT: "간이영수증",
  TAX_INVOICE: "세금계산서",
  TRANSACTION_STATEMENT: "거래명세서",
  CARD_SALES_SLIP: "카드매출전표",
  DELIVERY_SETTLEMENT: "배달 정산서",
  BANK_TRANSFER: "계좌이체 내역",
  ONLINE_ORDER: "온라인 주문서",
};

const STATUS_META: Record<ReceiptResponse["status"], { label: string; color: string }> = {
  CONFIRMED: { label: "검토 완료", color: "text-[#0E9F6E] bg-[#0E9F6E]/10" },
  NEEDS_REVIEW: { label: "검토 필요", color: "text-[#246BFD] bg-[#246BFD]/10" },
  DUPLICATE_SUSPECTED: { label: "중복 의심", color: "text-amber-600 bg-amber-50" },
};

const STEPS_META = [
  { key: "inbox", label: "업로드" },
  { key: "uploading", label: "OCR 분석" },
  { key: "review", label: "검토" },
  { key: "saving", label: "저장" },
  { key: "done", label: "반영" },
] as const;

function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return month && day ? `${month}.${day}` : isoDate;
}

function toEditableForm(result: ReceiptParseResult) {
  return {
    documentType: result.documentType,
    storeName: result.storeName ?? "",
    businessNumber: result.businessNumber ?? "",
    transactionDate: result.transactionDate,
    transactionTime: result.transactionTime ?? "",
    paymentMethod: result.paymentMethod,
    category: result.category,
    items: result.items,
    supplyAmount: result.supplyAmount,
    vat: result.vat,
    taxFreeAmount: result.taxFreeAmount,
    totalAmount: result.totalAmount,
  };
}

type EditableForm = ReturnType<typeof toEditableForm>;

export function LedgerPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("inbox");
  const [editField, setEditField] = useState<string | null>(null);
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const [ocrText, setOcrText] = useState<string[]>([]);
  const [form, setForm] = useState<EditableForm | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [savedReceipt, setSavedReceipt] = useState<ReceiptResponse | null>(null);

  const [history, setHistory] = useState<ReceiptResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // AI 가계부 리포트 (기간 선택 가능, HTML로 렌더링)
  const now = new Date();
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [storeName, setStoreName] = useState("");
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportIframeHeight, setReportIframeHeight] = useState(600);

  const downloadReport = () => {
    if (!reportHtml) return;
    const periodLabel =
      reportType === "monthly" ? `${reportYear}-${String(reportMonth).padStart(2, "0")}` :
      reportType === "yearly" ? `${reportYear}` : "전체기간";

    const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AI가계부리포트_${periodLabel}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReport = async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const html = await getLedgerReportHtml(STORE_ID, {
        reportType,
        year: reportYear,
        month: reportType === "monthly" ? reportMonth : undefined,
        storeName: storeName || undefined,
      });
      setReportHtml(html);
    } catch (error) {
      setReportError(error instanceof ApiError ? error.message : "리포트 생성 중 오류가 발생했습니다.");
      setReportHtml(null);
    } finally {
      setReportLoading(false);
    }
  };

  const stepKeys: Step[] = ["inbox", "uploading", "review", "saving", "done"];
  const currentStepIdx = stepKeys.indexOf(step);

  const loadHistory = () => {
    setHistoryLoading(true);
    getReceipts(STORE_ID)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const resetToInbox = () => {
    setStep("inbox");
    setOcrText([]);
    setForm(null);
    setErrorMessage(null);
    setDuplicateWarning(null);
    setSavedReceipt(null);
  };

  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);
    setStep("uploading");
    try {
      const parsed = await parseReceiptImage(file);
      setOcrText(parsed.ocrText);
      setForm(toEditableForm(parsed.result));
      setStep("review");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "영수증 인식에 실패했습니다. 다시 시도해주세요.");
      setStep("inbox");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFileSelected(file);
    e.target.value = "";
  };

  const updateField = <K extends keyof EditableForm>(key: K, value: EditableForm[K]) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const submitReceipt = async (force: boolean) => {
    if (!form) return;
    setStep("saving");
    setErrorMessage(null);
    try {
      const saved = await createReceipt({
        storeId: STORE_ID,
        documentType: form.documentType,
        storeName: form.storeName || null,
        businessNumber: form.businessNumber || null,
        transactionDate: form.transactionDate,
        transactionTime: form.transactionTime || null,
        paymentMethod: form.paymentMethod,
        items: form.items,
        supplyAmount: form.supplyAmount,
        vat: form.vat,
        taxFreeAmount: form.taxFreeAmount,
        totalAmount: form.totalAmount,
        category: form.category,
        force,
      });
      setSavedReceipt(saved);
      setDuplicateWarning(null);
      setStep("done");
      loadHistory();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setDuplicateWarning(error.message);
        setStep("review");
        return;
      }
      setErrorMessage(error instanceof ApiError ? error.message : "저장 중 오류가 발생했습니다.");
      setStep("review");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-8 max-w-[1300px] mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI 가계부 · 영수증 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">영수증과 거래명세서를 업로드하면 AI가 지출 항목과 원가 정보를 자동으로 분류합니다.</p>
        </div>

        {/* Two-column top area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Upload panel — 2/3 */}
          <div className="lg:col-span-2">
            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-5 flex-wrap">
              {STEPS_META.map((s, i) => {
                const done = currentStepIdx > i;
                const active = currentStepIdx === i;
                return (
                  <div key={s.key} className="flex items-center gap-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                      done ? "bg-[#0E9F6E] text-white" : active ? "bg-[#246BFD] text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                    {i < STEPS_META.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                  </div>
                );
              })}
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{errorMessage}</p>
              </div>
            )}

            {step === "inbox" && (
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleFileSelected(file);
                }}
                className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-[#246BFD]/50 hover:bg-[#246BFD]/3 transition-colors"
              >
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileInputChange} />
                <div className="w-14 h-14 rounded-2xl bg-[#246BFD]/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-[#246BFD]" />
                </div>
                <div className="text-center">
                  <div className="text-base font-bold mb-1">영수증/거래명세서 업로드</div>
                  <div className="text-sm text-muted-foreground">파일을 올리면 AI가 품목, 금액, 거래처, 날짜를 자동 분류합니다.</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, PDF · 최대 10MB</div>
                </div>
                <span className="flex items-center gap-2 text-sm bg-[#246BFD] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#1D4ED8] transition-colors">
                  <Upload className="w-4 h-4" />
                  파일 선택
                </span>
              </label>
            )}

            {step === "uploading" && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Loader2 className="w-10 h-10 text-[#246BFD] mx-auto mb-4 animate-spin" />
                <div className="text-sm font-semibold mb-1">OCR 분석 중...</div>
                <div className="text-xs text-muted-foreground mb-5">AI가 문서를 읽고 상호명·품목·금액을 추출하고 있습니다</div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-[#246BFD] rounded-full w-2/3 animate-pulse" />
                </div>
              </div>
            )}

            {step === "review" && form && (
              <div className="space-y-4">
                {duplicateWarning && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-800">중복 거래 감지</p>
                      <p className="text-xs text-amber-700">{duplicateWarning}</p>
                      <button onClick={() => void submitReceipt(true)} className="text-xs text-amber-700 font-semibold underline mt-1">
                        다른 거래입니다 (확인 후 저장)
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <h4 className="font-bold text-sm">추출된 정보 검토</h4>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground w-20">문서 유형</span>
                    <span className="flex-1 text-foreground">{DOCUMENT_TYPE_LABEL[form.documentType] ?? form.documentType}</span>
                  </div>

                  {([
                    { key: "storeName", label: "상호명" },
                    { key: "transactionDate", label: "거래일" },
                    { key: "paymentMethod", label: "결제수단" },
                    { key: "category", label: "분류" },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground w-20">{label}</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        {editField === key ? (
                          <input
                            value={form[key] as string}
                            autoFocus
                            onChange={e => updateField(key, e.target.value as EditableForm[typeof key])}
                            className="flex-1 h-7 px-2 text-xs bg-muted rounded-lg border border-[#246BFD]/40 focus:outline-none"
                            onBlur={() => setEditField(null)}
                          />
                        ) : (
                          <span className="flex-1 text-foreground">{(form[key] as string) || "-"}</span>
                        )}
                        <button onClick={() => setEditField(key)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-2xl p-4">
                  <h4 className="font-bold text-sm mb-3">품목 ({form.items.length}건)</h4>
                  <div className="space-y-2">
                    {form.items.length === 0 && (
                      <p className="text-xs text-muted-foreground">인식된 품목이 없습니다. 필요하면 영수증을 다시 촬영해서 업로드해주세요.</p>
                    )}
                    {form.items.map((item: ReceiptItemData, i: number) => (
                      <div key={`${item.itemName}-${i}`} className="flex items-center justify-between text-xs">
                        <span className="flex-1 text-foreground">{item.itemName}</span>
                        <span className="text-muted-foreground mr-4">
                          {item.quantity}{item.unit ?? "개"} × ₩{(item.unitPrice ?? 0).toLocaleString()}
                        </span>
                        <span className="font-semibold tabular-nums">₩{item.totalPrice.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border mt-3 pt-3 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground"><span>공급가액</span><span className="tabular-nums">₩{(form.supplyAmount ?? 0).toLocaleString()}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>부가세</span><span className="tabular-nums">₩{(form.vat ?? 0).toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-sm"><span>합계</span><span className="tabular-nums">₩{form.totalAmount.toLocaleString()}</span></div>
                  </div>
                </div>

                {ocrText.length > 0 && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none hover:text-foreground">원본 OCR 텍스트 보기</summary>
                    <div className="mt-2 bg-muted rounded-xl p-3 space-y-0.5">
                      {ocrText.map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                  </details>
                )}

                <button
                  onClick={() => void submitReceipt(false)}
                  className="w-full h-11 bg-[#246BFD] text-white text-sm font-bold rounded-2xl hover:bg-[#1D4ED8] transition-colors"
                >
                  검토 완료 · 장부에 반영
                </button>
              </div>
            )}

            {step === "saving" && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Loader2 className="w-10 h-10 text-[#246BFD] mx-auto mb-4 animate-spin" />
                <div className="text-sm font-semibold">저장하는 중...</div>
              </div>
            )}

            {step === "done" && savedReceipt && (
              <div className="bg-card border border-border rounded-2xl p-10 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#0E9F6E] mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">장부에 반영되었습니다</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  ₩{savedReceipt.totalAmount.toLocaleString()}이 {savedReceipt.category}로 분류되었습니다.
                </p>
                <button onClick={resetToInbox} className="text-sm text-[#246BFD] font-semibold hover:underline">
                  새 영수증 등록
                </button>
              </div>
            )}
          </div>

          {/* AI Insight panel — 1/3 */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              AI 지출·원가 인사이트
            </h3>

            {/* Insight card 1 */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold">식재료 원가 상승</span>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">주의</span>
                  </div>
                  <p className="text-xs text-muted-foreground">원가 페이지에서 매입 단가 변화를 확인해보세요.</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/store/cost")}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#246BFD] bg-[#246BFD]/8 hover:bg-[#246BFD]/15 py-2 rounded-xl transition-colors"
              >
                원가 상세보기 <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Insight card 2 */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold">예산/이상지출 확인</span>
                  </div>
                  <p className="text-xs text-muted-foreground">이번 달 예산 초과 여부와 이상 지출을 확인해보세요.</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/store/cost")}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#246BFD] bg-[#246BFD]/8 hover:bg-[#246BFD]/15 py-2 rounded-xl transition-colors"
              >
                지출 내역보기 <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Savings estimate */}
            <div className="bg-[#246BFD]/5 border border-[#246BFD]/15 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">이번 달 절감 가능 금액</span>
                  <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-1.5 py-0.5 rounded">AI 분석</span>
                </div>
                <button onClick={() => setSavingsOpen(o => !o)} className="text-muted-foreground hover:text-foreground">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-2xl font-black text-[#246BFD] tabular-nums">준비 중</div>
              {savingsOpen && (
                <div className="mt-2 text-[11px] text-muted-foreground bg-white/60 rounded-xl p-2.5 space-y-0.5">
                  <p>· 절감액 추정 기능은 원가·매입단가 분석과 함께 준비 중입니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 업로드 내역 — 왼쪽 1/3 */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">최근 업로드 내역</h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">{history.length}건</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["상태", "날짜", "상호명", "총금액", "분류"].map(h => (
                    <th key={h} className="text-left text-muted-foreground font-semibold pb-2 pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyLoading && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">불러오는 중...</td></tr>
                )}
                {!historyLoading && history.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">아직 등록된 영수증이 없습니다.</td></tr>
                )}
                {history.map((row, i) => {
                  const meta = STATUS_META[row.status];
                  return (
                    <tr
                      key={row.receiptId}
                      onMouseEnter={() => setHoveredRow(i)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`border-b border-border last:border-0 transition-colors ${hoveredRow === i ? "bg-muted/50" : ""}`}
                    >
                      <td className="py-3 pr-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground font-medium">{formatShortDate(row.transactionDate)}</td>
                      <td className="py-3 pr-4 font-semibold text-foreground">{row.vendorName ?? "-"}</td>
                      <td className="py-3 pr-4 font-bold tabular-nums">₩{row.totalAmount.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{row.category}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI 가계부 리포트 — 오른쪽 2/3 (기간 선택 가능, HTML 리포트) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <h3 className="font-bold">AI 가계부 리포트</h3>
          </div>

          {/* 기간/옵션 선택 */}
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">기간 단위</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value as ReportType)}
                className="h-9 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none"
              >
                <option value="monthly">월간</option>
                <option value="yearly">연간</option>
                <option value="full">총기간</option>
              </select>
            </div>

            {(reportType === "monthly" || reportType === "yearly") && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">연도</label>
                <input
                  type="number"
                  value={reportYear}
                  onChange={e => setReportYear(Number(e.target.value))}
                  className="h-9 w-24 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none"
                />
              </div>
            )}

            {reportType === "monthly" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">월</label>
                <select
                  value={reportMonth}
                  onChange={e => setReportMonth(Number(e.target.value))}
                  className="h-9 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-muted-foreground mb-1">매장명 (선택)</label>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="예: 온기카페"
                className="h-9 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none"
              />
            </div>

            <button
              onClick={() => void generateReport()}
              disabled={reportLoading}
              className="flex items-center gap-1.5 text-sm bg-[#246BFD] text-white px-4 py-2 h-9 rounded-xl font-semibold hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
            >
              {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              리포트 생성
            </button>

            <button
              onClick={downloadReport}
              disabled={!reportHtml}
              className="flex items-center gap-1.5 text-sm bg-muted text-foreground px-4 py-2 h-9 rounded-xl font-semibold hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              다운로드
            </button>
          </div>

          {reportError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{reportError}</p>
            </div>
          )}

          {!reportHtml && !reportLoading && !reportError && (
            <p className="text-sm text-muted-foreground">
              기간을 선택하고 "리포트 생성"을 누르면, 지출·이상탐지·예산·매입단가 등을 종합한 경영 장부 리포트가 아래에 표시됩니다.
            </p>
          )}

          {reportHtml && (
            <iframe
              title="AI 가계부 리포트"
              srcDoc={reportHtml}
              onLoad={e => {
                const doc = e.currentTarget.contentDocument;
                if (doc) setReportIframeHeight(doc.documentElement.scrollHeight + 24);
              }}
              style={{ height: reportIframeHeight }}
              className="w-full border border-border rounded-xl"
            />
          )}
        </div>
        </div>
      </div>
    </div>
  );
}