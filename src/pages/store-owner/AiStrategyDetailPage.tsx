import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type {
  EffectVerificationResult,
  VerificationExecution,
  VerificationMetricResult,
} from "../../entities/effect-verification/effect-verification.types";
import {
  completeMockVerification,
  EffectVerificationApiError,
  getVerificationExecution,
  getVerificationResult,
  registerMockExecution,
} from "../../features/effect-verification/api/effectVerificationApi";
import { AI_RECOMMENDATIONS } from "../../mocks";

const METRIC_LABELS: Record<string, string> = {
  target_sales: "추천 대상 매출",
  total_sales: "전체 매출",
  visit_count: "방문 건수",
  average_order_value: "객단가",
  revisit_rate: "재방문율",
  coupon_usage_rate: "쿠폰 사용률",
  new_customer_count: "신규 고객 수",
  dormant_customer_return_count: "장기 미방문 고객 복귀",
  average_rating: "평균 별점",
  negative_review_rate: "부정 리뷰 비율",
  target_aspect_review_count: "대상 속성 리뷰 수",
  target_aspect_negative_rate: "대상 속성 부정 비율",
  target_aspect_average_confidence: "대상 속성 감성 신뢰도",
  review_count: "전체 리뷰 수",
  sales: "매출",
};

const MONEY_METRICS = new Set(["target_sales", "total_sales", "average_order_value", "sales"]);
const RATE_METRICS = new Set(["revisit_rate", "coupon_usage_rate", "negative_review_rate", "target_aspect_negative_rate"]);

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}

function formatMetricValue(metric: VerificationMetricResult, value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (MONEY_METRICS.has(metric.metric_name)) return `${Math.round(value).toLocaleString("ko-KR")}원`;
  if (RATE_METRICS.has(metric.metric_name)) return `${value.toLocaleString("ko-KR")}%`;
  if (metric.metric_name === "average_rating") return `${value.toLocaleString("ko-KR")}점`;
  if (metric.metric_name === "target_aspect_average_confidence") return `${Math.round(value * 100)}%`;
  return value.toLocaleString("ko-KR");
}

function errorMessage(error: unknown) {
  if (error instanceof EffectVerificationApiError) {
    if (error.status === 401 || error.status === 403) {
      return "시연 API 접근 권한이 없습니다. 백엔드를 local,mock 프로필로 실행했는지 확인해 주세요.";
    }
    return error.message;
  }
  if (error instanceof TypeError) return "백엔드 서버에 연결할 수 없습니다. 8080 포트를 확인해 주세요.";
  return "요청 처리 중 오류가 발생했습니다.";
}

function VerificationStatusBadge({ execution, result, loading }: {
  execution: VerificationExecution | null;
  result: EffectVerificationResult | null;
  loading: boolean;
}) {
  if (loading) return <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-muted text-muted-foreground border-border">확인 중</span>;
  if (result || execution?.status === "VERIFIED") return <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">효과 확인</span>;
  if (execution?.status === "FAILED") return <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">검증 실패</span>;
  if (execution?.status === "READY") return <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">분석 대기</span>;
  if (execution) return <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">측정 중</span>;
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">실행 예정</span>;
}

function VerificationResultCard({ result }: { result: EffectVerificationResult }) {
  const verdict = {
    EFFECTIVE: { label: "효과 있음", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    PARTIALLY_EFFECTIVE: { label: "일부 효과", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    INCONCLUSIVE: { label: "판단 보류", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    INEFFECTIVE: { label: "효과 미확인", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    NOT_EFFECTIVE: { label: "효과 미확인", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  }[result.verdict];
  const metrics = result.metric_results ?? [];

  return (
    <section className={`border rounded-2xl p-5 mb-4 ${verdict.bg}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className={`w-5 h-5 ${verdict.color}`} />
            <span className={`text-sm font-bold ${verdict.color}`}>효과 검증 완료</span>
          </div>
          <p className="text-xs text-muted-foreground">{formatDate(result.verified_date)} 기준</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black tabular-nums ${verdict.color}`}>
            {result.effect_score == null ? "—" : result.effect_score}
            {result.effect_score != null && <span className="text-sm ml-0.5">점</span>}
          </div>
          <div className={`text-xs font-bold ${verdict.color}`}>{verdict.label}</div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground bg-white/60 rounded-xl p-3 mb-4">
        {result.summary || "아직 제공된 분석 설명이 없습니다."}
      </p>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white/70">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-2 px-3 py-2 text-[11px] font-bold text-muted-foreground bg-black/[0.025]">
          <span>평가 지표</span><span className="text-right">실행 전</span><span className="text-right">실행 후</span><span className="text-right">변화</span>
        </div>
        {metrics.length === 0 ? (
          <div className="border-t border-black/5 px-3 py-8 text-center text-xs text-muted-foreground">
            표시할 세부 지표가 없습니다.
          </div>
        ) : metrics.map((metric, index) => (
          <div key={`${metric.metric_name}-${index}`} className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-2 items-center px-3 py-2.5 text-xs border-t border-black/5">
            <span className="font-semibold">{METRIC_LABELS[metric.metric_name] ?? metric.metric_name}</span>
            <span className="text-right text-muted-foreground tabular-nums">{formatMetricValue(metric, metric.before_value)}</span>
            <span className="text-right font-semibold tabular-nums">{formatMetricValue(metric, metric.after_value)}</span>
            <span className={`flex items-center justify-end gap-0.5 font-bold tabular-nums ${
              metric.improved == null ? "text-muted-foreground" : metric.improved ? "text-emerald-600" : "text-red-600"
            }`}>
              {metric.improved == null
                ? null
                : metric.improved
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />}
              {metric.change_rate == null ? "-" : `${metric.change_rate > 0 ? "+" : ""}${metric.change_rate}%`}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">※ 관찰된 전후 차이를 정책 가중치로 평가한 결과이며 인과관계를 보장하지 않습니다.</p>
    </section>
  );
}

export function AiStrategyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rec = AI_RECOMMENDATIONS.find((item) => item.id === id) || AI_RECOMMENDATIONS[0];
  const recommendationId = rec.effectVerificationEnabled ? rec.id : undefined;
  const [showEvidence, setShowEvidence] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [execution, setExecution] = useState<VerificationExecution | null>(null);
  const [result, setResult] = useState<EffectVerificationResult | null>(null);
  const [loading, setLoading] = useState(Boolean(recommendationId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recommendationId) return;
    let active = true;
    setLoading(true);
    Promise.all([
      getVerificationExecution(recommendationId),
      getVerificationResult(recommendationId),
    ])
      .then(([nextExecution, nextResult]) => {
        if (!active) return;
        setExecution(nextExecution);
        setResult(nextResult);
        setError(null);
      })
      .catch((nextError) => active && setError(errorMessage(nextError)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [recommendationId]);

  const progress = useMemo(() => {
    if (!execution) return 0;
    const start = new Date(execution.executed_at).getTime();
    const due = new Date(execution.verification_due_at).getTime();
    if (due <= start) return 100;
    return Math.max(0, Math.min(100, Math.round(((Date.now() - start) / (due - start)) * 100)));
  }, [execution]);

  const canComplete = execution
    && !result
    && execution.status !== "VERIFIED"
    && new Date(execution.verification_due_at).getTime() <= Date.now();

  const handleExecute = async () => {
    if (!recommendationId) return;
    setSubmitting(true);
    try {
      const nextExecution = await registerMockExecution(recommendationId);
      setExecution(nextExecution);
      setError(null);
      setShowConfirm(false);
    } catch (nextError) {
      if (nextError instanceof EffectVerificationApiError && nextError.status === 409) {
        setExecution(await getVerificationExecution(recommendationId));
        setShowConfirm(false);
      } else {
        setError(errorMessage(nextError));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!recommendationId) return;
    setSubmitting(true);
    try {
      const nextResult = await completeMockVerification(recommendationId);
      setResult(nextResult);
      setExecution(await getVerificationExecution(recommendationId));
      setError(null);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  const confidenceColor = rec.confidence >= 80 ? "text-[#0E9F6E]" : rec.confidence >= 60 ? "text-[#D97706]" : "text-[#D92D20]";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <button onClick={() => navigate("/store/actions")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> AI 전략 추천으로 돌아가기
        </button>

        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#246BFD]/10 flex items-center justify-center flex-shrink-0"><Sparkles className="w-5 h-5 text-[#246BFD]" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-[#246BFD] bg-[#246BFD]/10 px-1.5 py-0.5 rounded">AI 분석</span>
              <span className="text-xs text-muted-foreground">{rec.category}</span>
              <span className={`text-xs font-bold ${confidenceColor}`}>신뢰도 {rec.confidence}%</span>
              {recommendationId && <span className="text-[11px] text-muted-foreground">검증 ID {recommendationId}</span>}
            </div>
            <h1 className="text-xl font-bold">{rec.title}</h1>
          </div>
          {recommendationId
            ? <VerificationStatusBadge execution={execution} result={result} loading={loading} />
            : <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-muted text-muted-foreground border-border">연동 예정</span>}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-bold mb-2">발견된 문제</h3>
          <p className="text-sm text-foreground leading-relaxed">{rec.problem}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#246BFD]/5 border border-[#246BFD]/20 rounded-2xl p-4">
            <div className="text-xs font-semibold text-[#246BFD] mb-1">예상 효과</div>
            <div className="text-sm font-bold text-foreground">{rec.expectedImpact}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{rec.predictionRange}</div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-1">측정 기간</div>
            <div className="text-sm font-bold text-foreground">{rec.measurementDays}일</div>
            <div className="text-xs text-muted-foreground mt-0.5">실행 전후 효과 검증</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-bold mb-3">전제 조건</h3>
          <ul className="space-y-2">
            {rec.assumptions.map((assumption, index) => (
              <li key={assumption} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0 mt-0.5">{index + 1}</span>{assumption}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <button onClick={() => setShowEvidence(!showEvidence)} className="w-full flex items-center justify-between text-sm font-bold">
            <span>분석 근거 보기 ({rec.evidence.length}개 데이터 소스)</span>
            {showEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showEvidence && <ul className="mt-3 space-y-2">{rec.evidence.map((item) => <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-[#5B6CFF] flex-shrink-0" />{item}</li>)}</ul>}
          <p className="text-[11px] text-muted-foreground/60 mt-3">※ AI 분석은 참고용이며 인과관계를 보장하지 않습니다.</p>
        </div>

        {result && <VerificationResultCard result={result} />}

        {execution && !result && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" /><span className="text-sm font-bold text-indigo-800">{canComplete ? "측정 완료 · 분석 대기" : "효과 측정 진행 중"}</span></div>
              <span className="text-xs font-bold text-indigo-700">{progress}%</span>
            </div>
            <div className="text-xs text-indigo-600 mt-1">{formatDate(execution.executed_at)} 실행 · {formatDate(execution.verification_due_at)} 측정 완료 예정</div>
            <div className="mt-3 h-2 bg-indigo-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
            {execution.failure_reason && <p className="text-xs text-red-600 mt-2">실패 사유: {execution.failure_reason}</p>}
          </div>
        )}

        {recommendationId && !loading && !execution && !result && (
          <div className="flex gap-3">
            <button onClick={() => setShowConfirm(true)} className="flex-1 h-11 bg-[#246BFD] text-white text-sm font-bold rounded-2xl hover:bg-[#1D4ED8] transition-colors">실행 시작</button>
            <button className="px-4 h-11 bg-card border border-border text-sm font-semibold rounded-2xl hover:bg-muted transition-colors text-muted-foreground">나중에</button>
          </div>
        )}

        {import.meta.env.DEV && canComplete && (
          <button disabled={submitting} onClick={handleComplete} className="w-full h-11 bg-[#0E9F6E] disabled:opacity-60 text-white text-sm font-bold rounded-2xl hover:bg-[#0B855C] transition-colors flex items-center justify-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />} 효과 분석 실행
          </button>
        )}

        {!recommendationId && <div className="bg-muted border border-border rounded-2xl p-4 text-sm text-muted-foreground">이 추천 유형은 효과 검증 API 연결 대상이 확정되면 연동됩니다.</div>}

        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl" role="dialog" aria-modal="true" aria-labelledby="execution-confirm-title">
              <div className="flex items-center gap-2 mb-3"><Calendar className="w-5 h-5 text-[#246BFD]" /><h3 id="execution-confirm-title" className="font-bold">추천 실행 확인</h3></div>
              <p className="text-sm text-muted-foreground mb-2"><strong>“{rec.title}”</strong>을 실행 처리하고 효과 측정을 시작합니다.</p>
              <p className="text-xs text-muted-foreground mb-5">현재 시연 환경에서는 준비된 Mock 추천의 실행일과 전후 2주 데이터를 사용합니다.</p>
              <div className="flex gap-2">
                <button disabled={submitting} onClick={handleExecute} className="flex-1 h-10 bg-[#246BFD] disabled:opacity-60 text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-2">{submitting && <Loader2 className="w-4 h-4 animate-spin" />}실행 시작</button>
                <button disabled={submitting} onClick={() => setShowConfirm(false)} className="flex-1 h-10 bg-muted text-sm font-semibold rounded-xl hover:bg-muted-foreground/10 transition-colors">취소</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
