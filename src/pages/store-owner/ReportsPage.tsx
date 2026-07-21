import { useState } from "react";
import { FileText, Download, Share2, CheckCircle2, Sparkles, ChevronRight } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";

const REPORTS = [
  { id: "r1", title: "2025년 7월 3주차 주간 리포트", period: "2025.07.14 ~ 2025.07.20", type: "주간", unread: false, date: "07.20" },
  { id: "r2", title: "2025년 7월 2주차 주간 리포트", period: "2025.07.07 ~ 2025.07.13", type: "주간", unread: false, date: "07.14" },
  { id: "r3", title: "2025년 6월 월간 리포트", period: "2025.06.01 ~ 2025.06.30", type: "월간", unread: false, date: "07.01" },
];

const REPORT_SECTIONS = [
  {
    title: "핵심 요약",
    icon: "📊",
    content: "이번 주 매출은 ₩14,749,000으로 전주 대비 8.4% 감소했습니다. 배달 매출은 12.3% 증가한 반면, 오프라인 방문 매출이 10.8% 감소했습니다. 비 예보와 인근 신규 카페 오픈이 주요 영향 요인으로 분석됩니다.",
    evidences: ["POS 데이터 7일", "날씨 데이터", "상권 분석"],
  },
  {
    title: "매출 변동 원인",
    icon: "📉",
    content: "평일 오후 2~5시 방문객이 전주 대비 31% 감소했습니다. AI 분석 결과 인근 600m 내 신규 카페 2곳 오픈이 방문 감소의 주요 원인으로 추정됩니다. 재방문 쿠폰 발송으로 이 시간대 매출 회복을 권장합니다.",
    evidences: ["시간대별 POS", "상권 신규 업체 데이터"],
  },
  {
    title: "재고·원가 위험",
    icon: "⚠️",
    content: "에스프레소 원두 재고가 2.4kg으로 내일 오후 4시 품절 예상됩니다. 식재료비가 4주 평균 대비 14% 상승 중이며, 샌드위치 원가 검토가 필요합니다.",
    evidences: ["재고 데이터", "매입 단가 이력"],
  },
  {
    title: "고객·리뷰 이슈",
    icon: "⭐",
    content: "'대기시간이 길다' 관련 리뷰가 최근 2주간 3배 증가했습니다. 평균 평점이 4.4에서 4.2로 하락 추세입니다. 주문 처리 속도 개선과 피크타임 인력 보강을 권장합니다.",
    evidences: ["리뷰 데이터", "주문 처리 시간 로그"],
  },
  {
    title: "이번 주 우선 행동",
    icon: "✅",
    content: "1. 오늘 오전 에스프레소 원두 2박스 발주 (긴급)\n2. 평일 오후 2~5시 재방문 쿠폰 발송\n3. 피크타임 인력 1명 추가 투입 검토",
    evidences: [],
  },
  {
    title: "지난 추천의 검증 결과",
    icon: "🎯",
    content: "샌드위치 원가 개선 실행 후 기여마진율이 18.3%에서 22.1%로 회복되었습니다. 같은 기간 전체 매출 변화율은 +1.8%였습니다. 날씨·이벤트 보정을 적용한 순수 효과로 판단됩니다.",
    evidences: ["POS 판매 데이터", "매입 원가 이력"],
  },
];

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(REPORTS[0]);

  return (
    <PageShell title="경영 리포트" freshness="오늘 09:42 기준">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Report list */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-muted-foreground px-1 mb-3">리포트 목록</h3>
          {REPORTS.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r)}
              className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors ${
                selectedReport.id === r.id
                  ? "bg-[#246BFD]/5 border-[#246BFD]/30"
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                r.type === "월간" ? "bg-[#5B6CFF]/10" : "bg-[#246BFD]/10"
              }`}>
                <FileText className={`w-4 h-4 ${r.type === "월간" ? "text-[#5B6CFF]" : "text-[#246BFD]"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.type === "월간" ? "bg-[#5B6CFF]/10 text-[#5B6CFF]" : "bg-[#246BFD]/10 text-[#246BFD]"}`}>{r.type}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                </div>
                <div className="text-xs font-semibold truncate">{r.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{r.period}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Report detail */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#246BFD] bg-[#246BFD]/10 px-1.5 py-0.5 rounded">{selectedReport.type} 리포트</span>
                    <span className="text-xs text-muted-foreground">{selectedReport.period}</span>
                  </div>
                  <h2 className="font-bold text-lg">{selectedReport.title}</h2>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-muted rounded-xl hover:bg-muted-foreground/10 transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                    공유
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[#246BFD] text-white rounded-xl hover:bg-[#1D4ED8] transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-[#246BFD]" />
                AI 생성 리포트 · 데이터 기준: 2025.07.20 09:42
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {REPORT_SECTIONS.map((section, i) => (
                <div key={i} className="border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{section.icon}</span>
                    <h3 className="font-bold text-sm">{section.title}</h3>
                    {section.evidences.length > 0 && (
                      <div className="flex gap-1 ml-auto">
                        {section.evidences.map((e) => (
                          <span key={e} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{e}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
                  {section.title === "지난 추천의 검증 결과" && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-[#0E9F6E]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      효과 검증 완료 · 날씨·이벤트 보정 적용됨
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 pb-5 border-t border-border pt-4">
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[#246BFD]/10 text-[#246BFD] rounded-xl hover:bg-[#246BFD]/20 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  실행 항목으로 추가
                </button>
                <button className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-muted transition-colors">
                  읽음 표시
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
