import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Sparkles, AlertCircle, CheckCircle2, Clock, Calendar,
  ChevronDown, ChevronUp
} from "lucide-react";
import { AI_RECOMMENDATIONS } from "../../mocks";

export function AiStrategyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rec = AI_RECOMMENDATIONS.find((r) => r.id === id) || AI_RECOMMENDATIONS[0];
  const [showEvidence, setShowEvidence] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [executed, setExecuted] = useState(rec.status === "측정 중" || rec.status === "효과 확인");

  const confidenceColor = rec.confidence >= 80 ? "text-[#0E9F6E]" : rec.confidence >= 60 ? "text-[#D97706]" : "text-[#D92D20]";

  const handleExecute = () => {
    setShowConfirm(false);
    setExecuted(true);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Back */}
        <button onClick={() => navigate("/store/actions")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          AI 전략 추천으로 돌아가기
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#246BFD]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#246BFD]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-[#246BFD] bg-[#246BFD]/10 px-1.5 py-0.5 rounded">AI 분석</span>
              <span className="text-xs text-muted-foreground">{rec.category}</span>
              <span className={`text-xs font-bold ${confidenceColor}`}>신뢰도 {rec.confidence}%</span>
            </div>
            <h1 className="text-xl font-bold">{rec.title}</h1>
          </div>
          <div className="flex-shrink-0">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              rec.status === "효과 확인" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              rec.status === "측정 중" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
              "bg-amber-50 text-amber-700 border-amber-200"
            }`}>{executed ? "측정 중" : rec.status}</span>
          </div>
        </div>

        {/* Problem */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-bold mb-2">발견된 문제</h3>
          <p className="text-sm text-foreground leading-relaxed">{rec.problem}</p>
        </div>

        {/* Prediction */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#246BFD]/5 border border-[#246BFD]/20 rounded-2xl p-4">
            <div className="text-xs font-semibold text-[#246BFD] mb-1">예상 효과</div>
            <div className="text-sm font-bold text-foreground">{rec.expectedImpact}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{rec.predictionRange}</div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-1">측정 기간</div>
            <div className="text-sm font-bold text-foreground">{rec.measurementDays}일</div>
            <div className="text-xs text-muted-foreground mt-0.5">실행 후 효과 검증</div>
          </div>
        </div>

        {/* Assumptions */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-bold mb-3">전제 조건</h3>
          <ul className="space-y-2">
            {rec.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0 mt-0.5">{i + 1}</span>
                {a}
              </li>
            ))}
          </ul>
        </div>

        {/* Evidence */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="w-full flex items-center justify-between text-sm font-bold"
          >
            <span>분석 근거 보기 ({rec.evidence.length}개 데이터 소스)</span>
            {showEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showEvidence && (
            <ul className="mt-3 space-y-2">
              {rec.evidence.map((e, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5B6CFF] flex-shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-muted-foreground/60 mt-3">※ AI 분석은 참고용이며 인과관계를 보장하지 않습니다.</p>
        </div>

        {/* Verified result */}
        {rec.status === "효과 확인" && rec.verifiedResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-800">효과 검증 완료</span>
            </div>
            <p className="text-sm text-emerald-700 leading-relaxed">{rec.verifiedResult}</p>
            <p className="text-xs text-emerald-600/60 mt-2">※ 관찰된 차이이며, 날씨·이벤트 보정 적용됨. 인과관계 확정이 아닙니다.</p>
          </div>
        )}

        {/* Measuring state */}
        {executed && rec.status !== "효과 확인" && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-bold text-indigo-800">효과 측정 진행 중</span>
            </div>
            <div className="text-xs text-indigo-600">효과 측정 8일째 · {rec.measurementDays}일 중</div>
            <div className="mt-3 h-2 bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: "57%" }} />
            </div>
          </div>
        )}

        {/* CTA */}
        {!executed && rec.status !== "효과 확인" && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-1 h-11 bg-[#246BFD] text-white text-sm font-bold rounded-2xl hover:bg-[#1D4ED8] transition-colors"
            >
              실행 시작
            </button>
            <button className="px-4 h-11 bg-card border border-border text-sm font-semibold rounded-2xl hover:bg-muted transition-colors text-muted-foreground">
              나중에
            </button>
          </div>
        )}

        {/* Confirm modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[#246BFD]" />
                <h3 className="font-bold">실행 확인</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>"{rec.title}"</strong>을 실행하시겠습니까? 실행 후 {rec.measurementDays}일간 효과를 측정합니다.
              </p>
              <div className="mb-4">
                <label className="text-xs font-semibold mb-1.5 block">실행 시작일</label>
                <input type="date" defaultValue="2025-07-20" className="w-full h-10 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleExecute} className="flex-1 h-10 bg-[#246BFD] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors">
                  실행 시작
                </button>
                <button onClick={() => setShowConfirm(false)} className="flex-1 h-10 bg-muted text-sm font-semibold rounded-xl hover:bg-muted-foreground/10 transition-colors">
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
