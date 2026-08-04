import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, Sparkles, CheckCircle2,
  X, AlertCircle, Clock,
  TrendingUp, Package, Star, Users, DollarSign, BarChart3,
  Calendar, Info, Loader2
} from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { ReportSections } from "../../shared/components/ReportBox";
import type { AIRecommendation } from "../../entities/recommendation/recommendation.types";
import type { AiRecommendationDecision, AiRecommendationRun, AiStrategyAction } from "../../entities/ai-analysis/ai-analysis.types";
import { createRecommendation, resumeRecommendation } from "../../features/ai-analysis/api/aiAnalysisApi";
import { startRecommendationExecution } from "../../features/effect-verification/api/effectVerificationApi";

const AI_ANALYSIS_ID_KEY = "bp20:ai-analysis-id";
const AI_ANALYSIS_OPTIONS_KEY = "bp20:ai-analysis-options";

const RECOMMENDATION_PROGRESS_STEPS = ["요청 접수", "AI 전략 분석", "추천 결과 생성"];
type AnalysisOption = { id: string; label: string };

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function executionPeriodLabel(run: AiRecommendationRun) {
  const start = dateInputValue(run.execution_started_at);
  const end = dateInputValue(run.execution_ended_at);
  return start && end ? `${start} ~ ${end}` : "승인 시점부터 30일 예정";
}

const NEW_RECS = [
  {
    id: "new1",
    title: "오후 2~5시 재방문 쿠폰 발송",
    category: "매출",
    priority: "P1",
    problem: "평일 해당 시간대 방문 건수가 4주간 23% 감소했습니다.",
    evidenceCount: 4,
    evidencePeriod: "최근 4주",
    expectedValue: "해당 시간대 매출 12~16% 개선 예상",
    confidence: 87,
    effort: "낮음",
    deadline: "07.25",
    action: "전략 검토",
  },
  {
    id: "new2",
    title: "아이스 아메리카노 원두 2박스 발주",
    category: "재고",
    priority: "P1",
    problem: "현재 판매 속도 기준 내일 16:00 품절이 예상됩니다.",
    evidenceCount: 2,
    evidencePeriod: "최근 7일",
    expectedValue: "품절 위험 감소 · 예상 손실 420,000원 방어",
    confidence: 94,
    effort: "낮음",
    deadline: "오늘",
    action: "발주 검토",
  },
  {
    id: "new3",
    title: "대기시간 개선을 위한 밑작업 조정",
    category: "리뷰",
    priority: "P2",
    problem: "대기시간 관련 부정 리뷰가 최근 2주 동안 3배 증가했습니다.",
    evidenceCount: 5,
    evidencePeriod: "최근 2주",
    expectedValue: "피크 시간 평균 대기시간 3~5분 단축 예상",
    confidence: 81,
    effort: "보통",
    deadline: "07.28",
    action: "계획 확인",
  },
];

const CATEGORY_ICON: Record<string, typeof TrendingUp> = {
  매출: TrendingUp,
  재고: Package,
  리뷰: Star,
  고객: Users,
  원가: DollarSign,
};

const PRIORITY_STYLE: Record<string, string> = {
  P1: "bg-red-50 text-red-600 border border-red-200",
  P2: "bg-amber-50 text-amber-600 border border-amber-200",
  P3: "bg-muted text-muted-foreground border border-border",
};

const EFFORT_COLOR: Record<string, string> = { 낮음: "text-[#0E9F6E]", 보통: "text-amber-500", 높음: "text-red-500" };

interface NewRecCardProps {
  rec: typeof NEW_RECS[0];
  onOpen: () => void;
}

function NewRecCard({ rec, onOpen }: NewRecCardProps) {
  const CatIcon = CATEGORY_ICON[rec.category] || BarChart3;
  return (
    <div
      onClick={onOpen}
      className="bg-card border border-border rounded-2xl p-4 hover:border-[#246BFD]/40 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#246BFD]/10 text-[#246BFD] border border-[#246BFD]/20">새 추천</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_STYLE[rec.priority]}`}>{rec.priority}</span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <CatIcon className="w-3 h-3" /> {rec.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-[#246BFD] flex-shrink-0">
          <Sparkles className="w-3 h-3" />
          {rec.confidence}%
        </div>
      </div>

      <h4 className="font-bold text-sm mb-1">{rec.title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rec.problem}</p>

      <div className="flex items-center gap-3 text-xs mb-3">
        <span className="text-[#0E9F6E] font-semibold">{rec.expectedValue}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>근거 {rec.evidenceCount}개 ({rec.evidencePeriod})</span>
          <span>노력: <span className={EFFORT_COLOR[rec.effort]}>{rec.effort}</span></span>
          <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {rec.deadline}</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          className="text-xs font-semibold text-white bg-[#246BFD] hover:bg-[#1D4ED8] px-3 py-1 rounded-lg transition-colors"
        >
          {rec.action}
        </button>
      </div>
    </div>
  );
}

interface ExistingRecCardProps {
  rec: AIRecommendation;
  onClick: () => void;
}

function ExistingRecCard({ rec, onClick }: ExistingRecCardProps) {
  const CatIcon = CATEGORY_ICON[rec.category] || BarChart3;
  const statusStyle: Record<string, string> = {
    "추천됨": "bg-amber-50 text-amber-700 border-amber-200",
    "실행 예정": "bg-[#246BFD]/10 text-[#246BFD] border-[#246BFD]/20",
    "측정 중": "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20",
    "효과 확인": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "보류": "bg-muted text-muted-foreground border-border",
  };
  const s = statusStyle[rec.status] || "bg-muted text-muted-foreground border-border";

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-2xl p-4 hover:border-[#246BFD]/40 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s}`}>{rec.status}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_STYLE[rec.priority]}`}>{rec.priority}</span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <CatIcon className="w-3 h-3" /> {rec.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-[#246BFD] flex-shrink-0">
          <Sparkles className="w-3 h-3" />
          {rec.confidence}%
        </div>
      </div>

      <h4 className="font-bold text-sm mb-1">{rec.title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{rec.problem}</p>

      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="text-[#0E9F6E] font-semibold">{rec.expectedValue}</span>
          <span>노력: {rec.effort}</span>
          <span>근거 {rec.evidenceCount}개</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {rec.status === "효과 확인" && rec.verifiedResult && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-700">
          ✓ {rec.verifiedResult.slice(0, 80)}...
        </div>
      )}
    </div>
  );
}

interface DetailDrawerProps {
  rec: typeof NEW_RECS[0] | null;
  onClose: () => void;
  onExecute: () => void;
}

function DetailDrawer({ rec, onClose, onExecute }: DetailDrawerProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [execDate, setExecDate] = useState("2025-07-25");
  const [param, setParam] = useState("10");
  if (!rec) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto z-10 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-[#246BFD] bg-[#246BFD]/10 px-1.5 py-0.5 rounded">새 추천</span>
              <span className="text-[10px] text-muted-foreground">{rec.category}</span>
            </div>
            <h3 className="font-bold text-sm">{rec.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          <div className="space-y-3">
            <Section title="감지된 내용" icon={AlertCircle}>
              <p className="text-sm text-foreground">{rec.problem}</p>
              <div className="text-xs text-muted-foreground mt-1">데이터 기간: {rec.evidencePeriod} · 근거 {rec.evidenceCount}개</div>
            </Section>

            <Section title="왜 중요한가" icon={Info}>
              <p className="text-xs text-muted-foreground">이 지표가 지속되면 월간 매출 목표 달성에 영향을 미칠 수 있습니다. 지금 조치하면 손실을 최소화할 수 있습니다.</p>
            </Section>

            <Section title="예상 효과" icon={TrendingUp}>
              <div className="bg-[#0E9F6E]/8 border border-[#0E9F6E]/20 rounded-xl p-3">
                <div className="text-sm font-semibold text-[#0E9F6E]">{rec.expectedValue}</div>
                <div className="text-xs text-muted-foreground mt-1">신뢰도 {rec.confidence}% · AI 예측이며 실제와 다를 수 있습니다.</div>
              </div>
            </Section>

            <Section title="실행 정보" icon={Clock}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-muted-foreground mb-0.5">예상 노력</div>
                  <div className={`font-bold ${EFFORT_COLOR[rec.effort]}`}>{rec.effort}</div>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-muted-foreground mb-0.5">권장 마감</div>
                  <div className="font-bold">{rec.deadline}</div>
                </div>
              </div>
            </Section>

            <Section title="실행 체크리스트" icon={CheckCircle2}>
              <ul className="space-y-1.5">
                {["담당 직원에게 사전 안내", "쿠폰 발송 시스템 확인", "캠페인 내용 최종 검토", "실행 일정 확정"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-2">
          {!showConfirm ? (
            <>
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full h-10 bg-[#246BFD] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors"
              >
                실행 계획 만들기
              </button>
              <div className="flex gap-2">
                <button className="flex-1 h-9 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">보류</button>
                <button className="flex-1 h-9 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">추천 제외</button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#246BFD]/5 border border-[#246BFD]/20 rounded-xl p-3">
                <div className="text-xs font-bold mb-2">실행 계획 설정</div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">실행 날짜</label>
                    <input type="date" value={execDate} onChange={e => setExecDate(e.target.value)} className="w-full h-8 px-3 text-xs bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">쿠폰 할인율 (%)</label>
                    <input type="number" value={param} onChange={e => setParam(e.target.value)} className="w-full h-8 px-3 text-xs bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => { onExecute(); setShowConfirm(false); onClose(); }}
                className="w-full h-10 bg-[#246BFD] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors"
              >
                실행 확정
              </button>
              <button onClick={() => setShowConfirm(false)} className="w-full h-9 text-xs text-muted-foreground hover:text-foreground">취소</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof AlertCircle; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function AiStrategyPage() {
  const navigate = useNavigate();
  const [drawerRec, setDrawerRec] = useState<typeof NEW_RECS[0] | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOption[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(AI_ANALYSIS_OPTIONS_KEY) ?? "[]");
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {
      // 오래된 세션 값은 아래 fallback으로 처리한다.
    }
    const legacyId = sessionStorage.getItem(AI_ANALYSIS_ID_KEY);
    return legacyId ? [{ id: legacyId, label: "최근 매출 분석" }] : [];
  });
  const [analysisId, setAnalysisId] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(AI_ANALYSIS_OPTIONS_KEY) ?? "[]");
      if (Array.isArray(saved) && saved[0]?.id) return saved[0].id;
    } catch {
      // fallback
    }
    return sessionStorage.getItem(AI_ANALYSIS_ID_KEY) ?? "";
  });
  const [recommendationRun, setRecommendationRun] = useState<AiRecommendationRun | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationStage, setRecommendationStage] = useState(0);
  const [recommendationError, setRecommendationError] = useState("");
  const [executionStartedAt, setExecutionStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [executionEndedAt, setExecutionEndedAt] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  });
  const recommendedActions = recommendationRun?.recommended_actions?.length
    ? recommendationRun.recommended_actions
    : (recommendationRun?.candidate_actions ?? []).slice(0, 2);
  const requestRecommendation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!analysisId) {
      setRecommendationError("먼저 매출 분석을 완료하고 분석 대상을 선택해 주세요.");
      return;
    }
    sessionStorage.setItem(AI_ANALYSIS_ID_KEY, analysisId.trim());
    setRecommendationLoading(true);
    setRecommendationStage(1);
    setRecommendationError("");
    try {
      const result = await createRecommendation(analysisId.trim());
      setRecommendationRun(result);
    } catch (error) {
      setRecommendationError(error instanceof Error ? error.message : "전략 추천 요청에 실패했습니다.");
    } finally {
      setRecommendationLoading(false);
      setRecommendationStage(0);
    }
  };

  const decideRecommendation = async (decision: AiRecommendationDecision, selectedAction?: string) => {
    if (!recommendationRun) return;
    if (decision === "approve" && (!executionStartedAt || !executionEndedAt || executionEndedAt < executionStartedAt)) {
      setRecommendationError("적용 시작일과 종료일을 올바르게 입력해 주세요.");
      return;
    }
    setRecommendationLoading(true);
    setRecommendationStage(1);
    setRecommendationError("");
    try {
      const result = await resumeRecommendation(
        recommendationRun.thread_id,
        decision,
        selectedAction,
        decision === "approve"
          ? {
              execution_started_at: `${executionStartedAt}T00:00:00`,
              execution_ended_at: `${executionEndedAt}T00:00:00`,
            }
          : undefined,
      );
      setRecommendationRun(result);
      if (decision === "approve" && result.approval_status === "approved") {
        await startRecommendationExecution({
          thread_id: result.thread_id,
          recommendation_type: "SALES",
          execution_started_at: `${executionStartedAt}T00:00:00`,
          execution_ended_at: `${executionEndedAt}T00:00:00`,
        });
      }
    } catch (error) {
      setRecommendationError(error instanceof Error ? error.message : "추천 처리에 실패했습니다.");
    } finally {
      setRecommendationLoading(false);
      setRecommendationStage(0);
    }
  };

  return (
    <PageShell
      title="매출 기반 전략 추천"
      subtitle="매출, 재고, 원가, 리뷰 데이터를 분석한 전략을 검토하고 실행 효과를 관리합니다."
      freshness="오늘 09:42 기준"
      actions={null}
    >
      <form onSubmit={requestRecommendation} className="bg-card border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          <h3 className="font-bold">매출 분석 기반 전략 생성</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={analysisId}
            onChange={(event) => setAnalysisId(event.target.value)}
            disabled={analysisOptions.length === 0 || recommendationLoading}
            className="flex-1 h-10 px-3 text-sm bg-muted rounded-xl border border-border"
          >
            {analysisOptions.length === 0 ? (
              <option value="">완료된 매출 분석이 없습니다</option>
            ) : analysisOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          <button disabled={recommendationLoading || !analysisId} className="h-10 px-4 bg-[#246BFD] text-white text-sm font-bold rounded-xl disabled:opacity-60">
            {recommendationLoading ? "AI 처리 중..." : "추천방안 선택"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">완료된 매출 분석 대상을 선택하면 AI 추천 검증이 시작됩니다.</p>
        {recommendationLoading && (
          <div className="mt-4 bg-muted/60 border border-border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Loader2 className="w-4 h-4 text-[#246BFD] animate-spin flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                {RECOMMENDATION_PROGRESS_STEPS[recommendationStage]} 중...
              </span>
            </div>
            <div className="flex items-center gap-1">
              {RECOMMENDATION_PROGRESS_STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index <= recommendationStage ? "bg-[#246BFD]" : "bg-border"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {RECOMMENDATION_PROGRESS_STEPS.map((step, index) => (
                <span
                  key={step}
                  className={`text-[10px] ${
                    index <= recommendationStage ? "text-[#246BFD] font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        )}
        {recommendationError && <p className="mt-3 text-xs text-red-600">{recommendationError}</p>}
      </form>

      {recommendationRun && (
        <div className="bg-card border border-[#246BFD]/30 rounded-2xl p-5 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-xs font-semibold text-[#246BFD] mb-1">실제 AI 추천 결과</div>
              <h3 className="text-xl font-black">
                {recommendedActions.length === 1
                  ? recommendedActions[0].방안
                  : `AI 추천 방안 ${recommendedActions.length}개`}
              </h3>
              {recommendedActions.length > 1 && recommendationRun.selected_action?.방안 && (
                <p className="text-xs text-muted-foreground mt-1">
                  기본 추천: <span className="font-semibold text-foreground">{recommendationRun.selected_action.방안}</span>
                </p>
              )}
              {recommendationRun.문제유형 && (
                <p className="text-xs text-muted-foreground mt-0.5">진단 유형: {recommendationRun.문제유형}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs px-2 py-1 rounded-lg bg-[#246BFD]/10 text-[#246BFD] font-semibold whitespace-nowrap">{recommendationRun.상태}</span>
            </div>
          </div>

          <div className="mt-3 p-3 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground">
            추천 승인 시 승인일을 시작일로 하여 30일 동안 적용됩니다.
          </div>

          <CandidateChips
            actions={recommendedActions}
            selected={recommendationRun.selected_action?.방안}
            candidateStatus={recommendationRun.candidate_status}
            selectable={Boolean(recommendationRun.대기중_승인) && !recommendationLoading}
            onSelect={(방안) => decideRecommendation("edit", 방안)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <EffectSummaryCard scm={recommendationRun.scm_result} />
          </div>

          <EvidenceSection rag={recommendationRun.rag_evidence} />

          {recommendationRun.warnings && recommendationRun.warnings.length > 0 && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">{recommendationRun.warnings.join(" · ")}</div>
          )}

          {recommendationRun.대기중_승인 && (
            <div className="flex gap-2 mt-4">
              <button type="button" disabled={recommendationLoading} onClick={() => decideRecommendation("approve")} className="px-4 py-2 bg-[#0E9F6E] text-white text-xs font-bold rounded-xl disabled:opacity-60">추천 승인 및 리포트 생성</button>
              <button type="button" disabled={recommendationLoading} onClick={() => decideRecommendation("reject")} className="px-4 py-2 border border-border text-xs font-bold rounded-xl disabled:opacity-60">추천 반려</button>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-[#246BFD]/20 bg-[#246BFD]/5 p-4">
            <p className="text-xs font-bold">추천 적용 기간 설정</p>
            <p className="mt-1 text-[11px] text-muted-foreground">승인하기 전에 직접 적용 시작일과 종료일을 선택할 수 있습니다.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">시작일
                <input type="date" value={executionStartedAt} onChange={(event) => setExecutionStartedAt(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border bg-card px-2 text-xs text-foreground" />
              </label>
              <label className="text-xs text-muted-foreground">종료일
                <input type="date" value={executionEndedAt} min={executionStartedAt} onChange={(event) => setExecutionEndedAt(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border bg-card px-2 text-xs text-foreground" />
              </label>
            </div>
          </div>

          <FinalReportSection report={recommendationRun.final_report} />

          <div className="text-xs text-muted-foreground mt-3">적용 기간: <span className="font-semibold text-foreground">{executionPeriodLabel(recommendationRun)}</span></div>

        </div>
      )}

      {drawerRec && (
        <DetailDrawer
          rec={drawerRec}
          onClose={() => setDrawerRec(null)}
          onExecute={() => setDrawerRec(null)}
        />
      )}
    </PageShell>
  );
}

const VERDICT_STYLE: Record<string, string> = {
  "양호": "text-[#0E9F6E] bg-[#0E9F6E]/10",
  "사용가능": "text-[#0E9F6E] bg-[#0E9F6E]/10",
  "탐색적": "text-amber-600 bg-amber-50",
  "적합도 미달": "text-amber-600 bg-amber-50",
  "판정불가": "text-muted-foreground bg-muted",
};

function VerdictBadge({ verdict }: { verdict?: string }) {
  if (!verdict) return null;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${VERDICT_STYLE[verdict] ?? "text-muted-foreground bg-muted"}`}>
      {verdict}
    </span>
  );
}

const formatPct = (value: unknown) => (typeof value === "number" ? `${(value * 100).toFixed(1)}%` : undefined);

interface CandidateChipsProps {
  actions: AiStrategyAction[];
  selected?: string;
  candidateStatus?: Record<string, string> | null;
  selectable?: boolean;
  onSelect?: (방안: string) => void;
}

function CandidateChips({ actions, selected, candidateStatus, selectable, onSelect }: CandidateChipsProps) {
  if (actions.length <= 1) return null;
  return (
    <div className="mt-4 mb-1">
      <span className="block text-xs font-semibold text-muted-foreground mb-2">추천 후보 2개 중 하나를 선택하세요:</span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {actions.map((action) => {
        const isSelected = action.방안 === selected;
        const isBlocked = candidateStatus?.[action.방안] === "blocked";
        const canPick = Boolean(selectable) && !isSelected && !isBlocked && Boolean(onSelect);
        const score = action.policy_score && typeof action.policy_score === "object"
          ? (action.policy_score as Record<string, unknown>).expected_reward
          : undefined;
        return (
          <button
            key={action.방안}
            type="button"
            disabled={!canPick}
            onClick={() => onSelect?.(action.방안)}
            title={isBlocked ? "안전성 검사에서 차단된 방안입니다." : undefined}
            className={`text-left rounded-xl border p-3 transition-colors ${
              isSelected
                ? "bg-[#246BFD]/10 text-[#246BFD] border-[#246BFD]/40 font-bold"
                : isBlocked
                  ? "text-muted-foreground/50 border-border cursor-not-allowed"
                  : canPick
                    ? "text-muted-foreground border-border hover:border-[#246BFD]/40 hover:text-[#246BFD] cursor-pointer"
                    : "text-muted-foreground border-border cursor-default"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold">{typeof action.recommendation_rank === "number" ? `${action.recommendation_rank}순위 추천` : "추천 후보"}</span>
              {isSelected && <span className="text-[10px]">현재 선택됨</span>}
            </div>
            <div className="text-sm font-bold text-foreground">{action.방안}</div>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
              {action.axis && <span>{String(action.axis)}</span>}
              {typeof score === "number" && <span>정책 점수 {score.toFixed(3)}</span>}
            </div>
          </button>
        );
      })}
      </div>
    </div>
  );
}

// scm_result = {베이스라인, 실측효과: {판정, 효과율_평균?, 효과율_95%CI?, 사유?}}
function EffectSummaryCard({ scm }: { scm?: Record<string, unknown> | null }) {
  const measured = scm?.["실측효과"] as Record<string, unknown> | undefined;
  const verdict = measured?.["판정"] as string | undefined;
  const avg = formatPct(measured?.["효과율_평균"]);
  return (
    <div className="bg-muted rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-muted-foreground">예상 효과</span>
        <VerdictBadge verdict={verdict} />
      </div>
      {avg ? (
        <div className="text-lg font-black text-[#0E9F6E]">{avg}</div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {(measured?.["사유"] as string) ?? "실측 데이터가 아직 충분하지 않아 참고용 수치가 없습니다."}
        </p>
      )}
    </div>
  );
}

// ope_result = {판정, 기준정책_대비_차이?, 사유?}
function PolicyCheckCard({ ope }: { ope?: Record<string, unknown> | null }) {
  const verdict = ope?.["판정"] as string | undefined;
  const diff = ope?.["기준정책_대비_차이"] as number | undefined;
  return (
    <div className="bg-muted rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-muted-foreground">정책 사전 검증</span>
        <VerdictBadge verdict={verdict} />
      </div>
      {typeof diff === "number" ? (
        <div className={`text-lg font-black ${diff >= 0 ? "text-[#0E9F6E]" : "text-red-500"}`}>
          기준 대비 {diff >= 0 ? "+" : ""}{diff.toFixed(3)}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {(ope?.["사유"] as string) ?? "비교할 실행 로그가 아직 부족합니다."}
        </p>
      )}
    </div>
  );
}

// rag_evidence = {direction_refs: [{text, tier_label}], allowed_numbers: [{sentence}], has_magnitude}
function EvidenceSection({ rag }: { rag?: Record<string, unknown> | null }) {
  const directionRefs = (rag?.["direction_refs"] as Array<Record<string, unknown>> | undefined) ?? [];
  if (!directionRefs.length) return null;
  return (
    <div className="bg-muted rounded-xl p-3 mt-3">
      <div className="text-xs font-bold text-muted-foreground mb-2">추천 근거</div>
      <ul className="space-y-1.5">
        {directionRefs.slice(0, 3).map((ref, index) => (
          <li key={index} className="flex items-start gap-1.5 text-xs text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B6CFF] mt-1.5 flex-shrink-0" />
            <span>
              {String(ref["text"] ?? "")}
              {ref["tier_label"] ? <span className="text-[10px] text-muted-foreground"> ({String(ref["tier_label"])})</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// final_report = {report, verified, error?}
function FinalReportSection({ report }: { report?: Record<string, unknown> | null }) {
  if (!report) return null;
  const error = report["error"] as string | undefined;
  const text = String(report["report"] ?? "");
  const verified = Boolean(report["verified"]);
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground">최종 리포트</span>
        {!error && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${verified ? "text-[#0E9F6E] bg-[#0E9F6E]/10" : "text-amber-600 bg-amber-50"}`}>
            {verified ? "수치 검증됨" : "수치 재확인 필요"}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
      ) : (
        <ReportSections text={text || "리포트 내용이 비어 있습니다."} />
      )}
    </div>
  );
}
