import { useEffect, useState } from "react";
import {
  Upload, CheckCircle2, AlertCircle, Edit3, FileText,
  ChevronRight, ChevronLeft, Sparkles, Loader2, Download, Trash2, Check, X
} from "lucide-react";
import { ApiError } from "@/shared/api/apiClient";
import {
  createReceipt, deleteReceipt, getLedgerReportHtml, getReceipts,
  parseReceiptImage, updateReceipt,
} from "@/entities/receipt/receipt.api";
import { commerceApi } from "@/features/commerce/api/commerceApi";
import type {
  ReceiptItemData,
  ReceiptParseResult,
  ReceiptResponse,
  ReportType,
} from "@/entities/receipt/receipt.types";

const HISTORY_PAGE_SIZE = 30;

/** 업로드 내역 인라인 수정 시 편집 가능한 필드 (테이블에 보이는 컬럼만) */
interface HistoryEditDraft {
  transactionDate: string;
  vendorName: string;
  totalAmount: string;
  category: string;
}

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
  const [step, setStep] = useState<Step>("inbox");
  const [editField, setEditField] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const [ocrText, setOcrText] = useState<string[]>([]);
  const [form, setForm] = useState<EditableForm | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [savedReceipt, setSavedReceipt] = useState<ReceiptResponse | null>(null);

  const [history, setHistory] = useState<ReceiptResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);
  const [editingReceiptId, setEditingReceiptId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<HistoryEditDraft | null>(null);
  const [rowActionError, setRowActionError] = useState<string | null>(null);
  const [rowActionLoading, setRowActionLoading] = useState(false);

  // 로그인한 점주에게 귀속된 실제 매장 id (하드코딩 금지 - 매장마다 다름)
  const [storeId, setStoreId] = useState<number | null>(null);
  const [storeIdError, setStoreIdError] = useState<string | null>(null);

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
    if (!storeId) {
      setReportError("매장 정보를 아직 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const html = await getLedgerReportHtml(storeId, {
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

  const loadHistory = (currentStoreId: number, page = 0) => {
    setHistoryLoading(true);
    getReceipts(currentStoreId, page, HISTORY_PAGE_SIZE)
      .then((result) => {
        setHistory(result.content);
        setHistoryPage(result.page);
        setHistoryTotalPages(result.totalPages);
        setHistoryTotalElements(result.totalElements);
      })
      .catch(() => {
        setHistory([]);
        setHistoryTotalPages(0);
        setHistoryTotalElements(0);
      })
      .finally(() => setHistoryLoading(false));
  };

  const goToHistoryPage = (page: number) => {
    if (!storeId || page < 0 || page >= historyTotalPages) return;
    setEditingReceiptId(null);
    setEditDraft(null);
    loadHistory(storeId, page);
  };

  const startEditReceipt = (row: ReceiptResponse) => {
    setRowActionError(null);
    setEditingReceiptId(row.receiptId);
    setEditDraft({
      transactionDate: row.transactionDate,
      vendorName: row.vendorName ?? "",
      totalAmount: String(row.totalAmount),
      category: row.category,
    });
  };

  const cancelEditReceipt = () => {
    setEditingReceiptId(null);
    setEditDraft(null);
    setRowActionError(null);
  };

  const saveEditReceipt = async (row: ReceiptResponse) => {
    if (!editDraft) return;
    const totalAmount = Number(editDraft.totalAmount);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      setRowActionError("총금액을 올바르게 입력해주세요.");
      return;
    }
    setRowActionLoading(true);
    setRowActionError(null);
    try {
      await updateReceipt(row.receiptId, {
        documentType: row.documentType,
        storeName: editDraft.vendorName || null,
        businessNumber: row.businessNumber,
        transactionDate: editDraft.transactionDate,
        transactionTime: row.transactionTime,
        paymentMethod: row.paymentMethod,
        items: row.items,
        supplyAmount: row.supplyAmount,
        vat: row.vat,
        taxFreeAmount: row.taxFreeAmount,
        totalAmount,
        category: editDraft.category,
      });
      setEditingReceiptId(null);
      setEditDraft(null);
      if (storeId) loadHistory(storeId, historyPage);
    } catch (error) {
      setRowActionError(error instanceof ApiError ? error.message : "수정 중 오류가 발생했습니다.");
    } finally {
      setRowActionLoading(false);
    }
  };

  const handleDeleteReceipt = async (row: ReceiptResponse) => {
    if (!window.confirm(`${formatShortDate(row.transactionDate)} · ${row.vendorName ?? "상호명 없음"} 영수증을 삭제할까요?`)) {
      return;
    }
    setRowActionLoading(true);
    setRowActionError(null);
    try {
      await deleteReceipt(row.receiptId);
      if (!storeId) return;
      const isLastItemOnPage = history.length === 1 && historyPage > 0;
      loadHistory(storeId, isLastItemOnPage ? historyPage - 1 : historyPage);
    } catch (error) {
      setRowActionError(error instanceof ApiError ? error.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setRowActionLoading(false);
    }
  };

  useEffect(() => {
    commerceApi.getStore()
      .then((store) => {
        setStoreId(store.id);
        setStoreIdError(null);
      })
      .catch(() => {
        setStoreIdError("매장 정보를 불러오지 못했습니다. 매장 등록 여부를 확인해주세요.");
      });
  }, []);

  useEffect(() => {
    if (storeId) loadHistory(storeId, 0);
  }, [storeId]);

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
    if (!storeId) {
      setErrorMessage("매장 정보를 아직 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setStep("saving");
    setErrorMessage(null);
    try {
      const saved = await createReceipt({
        storeId,
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
      loadHistory(storeId);
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
          <p className="text-sm text-muted-foreground mt-0.5">영수증을 업로드하면 AI가 지출 항목과 원가 정보를 자동으로 분류합니다.</p>
        </div>

        {storeIdError && (
          <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {storeIdError}
          </div>
        )}

        <div className="mb-5">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 업로드 내역 — 왼쪽 1/3 */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">최근 업로드 내역</h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">{historyTotalElements}건</span>
            </div>
          </div>

          {rowActionError && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {rowActionError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["상태", "날짜", "상호명", "총금액", "분류", ""].map(h => (
                    <th key={h} className="text-left text-muted-foreground font-semibold pb-2 pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyLoading && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">불러오는 중...</td></tr>
                )}
                {!historyLoading && history.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">아직 등록된 영수증이 없습니다.</td></tr>
                )}
                {history.map((row, i) => {
                  const meta = STATUS_META[row.status];
                  const isEditing = editingReceiptId === row.receiptId;
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
                      {isEditing && editDraft ? (
                        <>
                          <td className="py-2 pr-4">
                            <input
                              type="date"
                              value={editDraft.transactionDate}
                              onChange={e => setEditDraft({ ...editDraft, transactionDate: e.target.value })}
                              className="w-28 h-7 px-1.5 text-xs bg-muted rounded-lg border border-[#246BFD]/40 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              value={editDraft.vendorName}
                              onChange={e => setEditDraft({ ...editDraft, vendorName: e.target.value })}
                              className="w-24 h-7 px-1.5 text-xs bg-muted rounded-lg border border-[#246BFD]/40 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              type="number"
                              value={editDraft.totalAmount}
                              onChange={e => setEditDraft({ ...editDraft, totalAmount: e.target.value })}
                              className="w-20 h-7 px-1.5 text-xs bg-muted rounded-lg border border-[#246BFD]/40 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              value={editDraft.category}
                              onChange={e => setEditDraft({ ...editDraft, category: e.target.value })}
                              className="w-20 h-7 px-1.5 text-xs bg-muted rounded-lg border border-[#246BFD]/40 focus:outline-none"
                            />
                          </td>
                          <td className="py-3 pr-0">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => void saveEditReceipt(row)}
                                disabled={rowActionLoading}
                                className="p-1 rounded text-[#0E9F6E] hover:bg-[#0E9F6E]/10 disabled:opacity-50"
                                title="저장"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEditReceipt}
                                disabled={rowActionLoading}
                                className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-50"
                                title="취소"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 pr-4 text-muted-foreground font-medium">{formatShortDate(row.transactionDate)}</td>
                          <td className="py-3 pr-4 font-semibold text-foreground">{row.vendorName ?? "-"}</td>
                          <td className="py-3 pr-4 font-bold tabular-nums">₩{row.totalAmount.toLocaleString()}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{row.category}</td>
                          <td className="py-3 pr-0">
                            <div className={`flex items-center gap-1 transition-opacity ${hoveredRow === i ? "opacity-100" : "opacity-0"}`}>
                              <button
                                onClick={() => startEditReceipt(row)}
                                className="p-1 rounded text-muted-foreground hover:text-[#246BFD] hover:bg-[#246BFD]/10"
                                title="수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => void handleDeleteReceipt(row)}
                                disabled={rowActionLoading}
                                className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {historyTotalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {historyPage + 1} / {historyTotalPages} 페이지
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToHistoryPage(historyPage - 1)}
                  disabled={historyPage === 0 || historyLoading}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  title="이전 페이지"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => goToHistoryPage(historyPage + 1)}
                  disabled={historyPage >= historyTotalPages - 1 || historyLoading}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  title="다음 페이지"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
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