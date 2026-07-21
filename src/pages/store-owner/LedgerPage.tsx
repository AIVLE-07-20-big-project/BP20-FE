import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, CheckCircle2, AlertCircle, Edit3, FileText,
  ChevronRight, Sparkles, TrendingUp, ExternalLink, Info
} from "lucide-react";

type Step = "inbox" | "uploading" | "ocr" | "review" | "done";

const MOCK_OCR = {
  docType: "영수증",
  storeName: "CJ프레시웨이",
  businessNumber: "123-81-XXXXX",
  date: "2025-07-19",
  payment: "법인카드",
  items: [
    { name: "국산 원두 (1kg)", qty: 5, unitPrice: 18000, total: 90000, confident: true },
    { name: "우유 1L x12", qty: 3, unitPrice: 28600, total: 85800, confident: true },
    { name: "딸기잼 5kg", qty: 1, unitPrice: 32000, total: 32000, confident: false },
  ],
  subtotal: 207800,
  vat: 20780,
  total: 228580,
  category: "식재료비",
};

const HISTORY_ROWS = [
  { status: "검토 완료", statusColor: "text-[#0E9F6E] bg-[#0E9F6E]/10", date: "07.20", name: "CJ프레시웨이", amount: 228580, category: "식재료비", action: "상세보기" },
  { status: "중복 의심", statusColor: "text-amber-600 bg-amber-50", date: "07.19", name: "한국전력", amount: 312000, category: "공과금", action: "검토" },
  { status: "검토 완료", statusColor: "text-[#0E9F6E] bg-[#0E9F6E]/10", date: "07.18", name: "에코팩", amount: 85000, category: "포장재비", action: "상세보기" },
  { status: "검토 필요", statusColor: "text-[#246BFD] bg-[#246BFD]/10", date: "07.15", name: "파리크라상", amount: 96000, category: "식재료비", action: "검토" },
  { status: "처리 중", statusColor: "text-muted-foreground bg-muted", date: "07.14", name: "네이버 광고", amount: 150000, category: "광고비", action: "대기" },
  { status: "검토 완료", statusColor: "text-[#0E9F6E] bg-[#0E9F6E]/10", date: "07.12", name: "GS25 성수점", amount: 44500, category: "소모품비", action: "상세보기" },
];

const STEPS_META = [
  { key: "inbox", label: "업로드" },
  { key: "uploading", label: "이미지 검사" },
  { key: "ocr", label: "OCR 분석" },
  { key: "review", label: "검토" },
  { key: "done", label: "반영" },
] as const;

export function LedgerPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("inbox");
  const [editField, setEditField] = useState<string | null>(null);
  const [isDuplicate] = useState(true);
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const stepKeys: Step[] = ["inbox", "uploading", "ocr", "review", "done"];

  const advance = () => {
    const idx = stepKeys.indexOf(step);
    if (idx < stepKeys.length - 1) setStep(stepKeys[idx + 1]);
  };

  const currentStepIdx = stepKeys.indexOf(step);

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

            {step === "inbox" && (
              <div
                onClick={advance}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); advance(); }}
                className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-[#246BFD]/50 hover:bg-[#246BFD]/3 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#246BFD]/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-[#246BFD]" />
                </div>
                <div className="text-center">
                  <div className="text-base font-bold mb-1">영수증/거래명세서 업로드</div>
                  <div className="text-sm text-muted-foreground">파일을 올리면 AI가 품목, 금액, 거래처, 날짜를 자동 분류합니다.</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, PDF · 최대 10MB</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); advance(); }}
                  className="flex items-center gap-2 text-sm bg-[#246BFD] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#1D4ED8] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  파일 선택
                </button>
              </div>
            )}

            {step === "uploading" && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-10 h-10 border-4 border-[#246BFD]/20 border-t-[#246BFD] rounded-full animate-spin mx-auto mb-4" />
                <div className="text-sm font-semibold mb-1">이미지 검사 중...</div>
                <div className="text-xs text-muted-foreground mb-5">해상도, 흐림, 그림자 상태를 확인합니다</div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-5">
                  <div className="h-full bg-[#246BFD] rounded-full w-2/3 animate-pulse" />
                </div>
                <button onClick={advance} className="text-xs bg-[#246BFD] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#1D4ED8] transition-colors">다음 (시뮬레이션)</button>
              </div>
            )}

            {step === "ocr" && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <div className="text-sm font-semibold mb-1">OCR 분석 중...</div>
                <div className="text-xs text-muted-foreground mb-5">AI가 문서를 읽고 항목을 추출합니다</div>
                <div className="space-y-2 mb-5 text-left max-w-xs mx-auto">
                  {["텍스트 영역 인식", "품목명 추출", "금액 파싱", "거래처 매칭"].map((t, i) => (
                    <div key={t} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${i < 3 ? "text-[#0E9F6E]" : "text-muted-foreground animate-pulse"}`} />
                      <span className={i < 3 ? "text-foreground" : "text-muted-foreground"}>{t}</span>
                    </div>
                  ))}
                </div>
                <button onClick={advance} className="text-xs bg-[#246BFD] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#1D4ED8] transition-colors">분석 완료 (시뮬레이션)</button>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-4">
                {isDuplicate && !duplicateAcknowledged && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-800">중복 거래 감지</p>
                      <p className="text-xs text-amber-700">7월 10일 등록된 66,000원 영수증과 동일한 거래로 보입니다.</p>
                      <button onClick={() => setDuplicateAcknowledged(true)} className="text-xs text-amber-700 font-semibold underline mt-1">다른 거래입니다 (확인 후 진행)</button>
                    </div>
                  </div>
                )}

                <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <h4 className="font-bold text-sm">추출된 정보 검토</h4>
                  {[
                    { label: "문서 유형", value: MOCK_OCR.docType, confident: true },
                    { label: "상호명", value: MOCK_OCR.storeName, confident: true },
                    { label: "거래일", value: MOCK_OCR.date, confident: true },
                    { label: "결제수단", value: MOCK_OCR.payment, confident: true },
                    { label: "분류", value: MOCK_OCR.category, confident: true },
                  ].map(({ label, value, confident }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground w-20">{label}</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        {editField === label ? (
                          <input defaultValue={value} autoFocus className="flex-1 h-7 px-2 text-xs bg-muted rounded-lg border border-[#246BFD]/40 focus:outline-none" onBlur={() => setEditField(null)} />
                        ) : (
                          <span className={`flex-1 ${!confident ? "text-amber-600 font-semibold" : "text-foreground"}`}>{value}</span>
                        )}
                        {!confident && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">낮음</span>}
                        <button onClick={() => setEditField(label)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-2xl p-4">
                  <h4 className="font-bold text-sm mb-3">품목</h4>
                  <div className="space-y-2">
                    {MOCK_OCR.items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <span className={`flex-1 ${!item.confident ? "text-amber-600" : "text-foreground"}`}>{item.name}</span>
                        <span className="text-muted-foreground mr-4">{item.qty}개 × ₩{item.unitPrice.toLocaleString()}</span>
                        <span className="font-semibold tabular-nums">₩{item.total.toLocaleString()}</span>
                        {!item.confident && <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-600 px-1 rounded font-bold">확인요</span>}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border mt-3 pt-3 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground"><span>공급가액</span><span className="tabular-nums">₩{MOCK_OCR.subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>부가세 (10%)</span><span className="tabular-nums">₩{MOCK_OCR.vat.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-sm"><span>합계</span><span className="tabular-nums">₩{MOCK_OCR.total.toLocaleString()}</span></div>
                  </div>
                </div>

                <button
                  onClick={() => { if (!isDuplicate || duplicateAcknowledged) advance(); }}
                  disabled={isDuplicate && !duplicateAcknowledged}
                  className="w-full h-11 bg-[#246BFD] text-white text-sm font-bold rounded-2xl hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
                >
                  검토 완료 · 장부에 반영
                </button>
              </div>
            )}

            {step === "done" && (
              <div className="bg-card border border-border rounded-2xl p-10 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#0E9F6E] mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">장부에 반영되었습니다</h3>
                <p className="text-sm text-muted-foreground mb-5">₩{MOCK_OCR.total.toLocaleString()}이 식재료비로 분류되었습니다.</p>
                <button onClick={() => { setStep("inbox"); setDuplicateAcknowledged(false); }} className="text-sm text-[#246BFD] font-semibold hover:underline">
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
                  <p className="text-xs text-muted-foreground">양파 매입 단가가 지난달 평균 대비 18% 상승했습니다.</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/store/cost?tab=cost&item=양파")}
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
                    <span className="text-xs font-bold">예산 초과 감지</span>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">초과</span>
                  </div>
                  <p className="text-xs text-muted-foreground">이번 달 공과금이 예산 대비 12% 초과했습니다.</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/store/cost?tab=expenses&category=공과금")}
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
              <div className="text-2xl font-black text-[#246BFD] tabular-nums">128,000원</div>
              {savingsOpen && (
                <div className="mt-2 text-[11px] text-muted-foreground bg-white/60 rounded-xl p-2.5 space-y-0.5">
                  <p>· 대체 공급사 활용 시 식재료비 절감 예상: ~90,000원</p>
                  <p>· 소모품 일괄 구매 전환 시 절감 예상: ~38,000원</p>
                  <p className="text-muted-foreground/60 pt-1">※ AI 예측 결과이며 실제 절감액은 다를 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-width upload history */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">최근 업로드 내역</h3>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">{HISTORY_ROWS.length}건</span>
            </div>
            <button className="text-xs text-[#246BFD] font-semibold hover:underline">전체 보기</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["상태", "날짜", "상호명", "총금액", "분류", "작업"].map(h => (
                    <th key={h} className="text-left text-muted-foreground font-semibold pb-2 pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HISTORY_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`border-b border-border last:border-0 transition-colors cursor-pointer ${hoveredRow === i ? "bg-muted/50" : ""}`}
                  >
                    <td className="py-3 pr-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.statusColor}`}>{row.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground font-medium">{row.date}</td>
                    <td className="py-3 pr-4 font-semibold text-foreground">{row.name}</td>
                    <td className="py-3 pr-4 font-bold tabular-nums">₩{row.amount.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.category}</td>
                    <td className="py-3">
                      <button className="text-[#246BFD] font-semibold hover:underline">{row.action}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
