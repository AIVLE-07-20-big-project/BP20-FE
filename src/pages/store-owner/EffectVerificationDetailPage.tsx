import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type {
  EffectVerificationResult,
  VerificationExecution,
  VerificationMetricResult,
  VerificationStatus,
} from "../../entities/effect-verification/effect-verification.types";
import {
  EffectVerificationApiError,
  completeVerificationFromAnalysis,
  getVerificationExecution,
  getVerificationResult,
  retryEffectVerification,
} from "../../features/effect-verification/api/effectVerificationApi";
import { PageShell } from "../../shared/components/PageShell";

const AI_ANALYSIS_OPTIONS_KEY = "bp20:ai-analysis-options";

function readCachedAnalysisOptions(): { id: string; label: string }[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(AI_ANALYSIS_OPTIONS_KEY) ?? "[]");
    if (Array.isArray(saved)) return saved;
  } catch {
    // 캐시가 없거나 손상된 경우 빈 목록으로 처리한다.
  }
  return [];
}

const STATUS_VIEW: Record<VerificationStatus, {
  label: string;
  className: string;
  icon: typeof Clock3;
}> = {
  COLLECTING: { label: "측정 중", className: "border-violet-200 bg-violet-50 text-violet-700", icon: Clock3 },
  READY: { label: "분석 대기", className: "border-amber-200 bg-amber-50 text-amber-700", icon: CalendarClock },
  VERIFIED: { label: "검증 완료", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  FAILED: { label: "검증 실패", className: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
};

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

// AI 서비스 action_rules.ACTION_TO_AXIS와 동일한 매핑 — 방안 성격에 안 맞는 지표(예: SNS
// 캠페인인데 쿠폰 사용률)를 걸러내는 표시 전용 용도라 여기서만 복제해 둔다.
const ACTION_AXIS: Record<string, string> = {
  "즉시할인": "discount_coupon",
  "쿠폰발행": "discount_coupon",
  "타임세일": "discount_coupon",
  "세트메뉴 도입": "set_bundle",
  "사이드메뉴 추가": "set_bundle",
  "배달채널 확대": "delivery",
  "매장 리뉴얼": "store_menu_location",
  "신메뉴 출시": "store_menu_location",
  "웰컴 프로모션": "customer_acquisition",
  "리뷰 관리 캠페인": "customer_acquisition",
  "브랜드 SNS 캠페인": "customer_acquisition",
  "지역 제휴 마케팅": "customer_acquisition",
};

const COMMON_SALES_METRICS = ["target_sales", "total_sales", "visit_count", "average_order_value", "revisit_rate"];
const AXIS_EXTRA_METRICS: Record<string, string[]> = {
  discount_coupon: ["coupon_usage_rate"],
  set_bundle: [],
  delivery: [],
  store_menu_location: [],
  customer_acquisition: ["new_customer_count", "dormant_customer_return_count"],
};

function actionNameOf(execution: VerificationExecution | null): string | null {
  return execution?.selected_action?.방안 ?? execution?.selected_action?.action ?? null;
}

const MONEY_METRICS = new Set(["target_sales", "total_sales", "average_order_value", "sales"]);
const RATE_METRICS = new Set([
  "revisit_rate",
  "coupon_usage_rate",
  "negative_review_rate",
  "target_aspect_negative_rate",
]);

function formatDate(value?: string | null) {
  if (!value) return "—";
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

function getErrorMessage(error: unknown) {
  if (error instanceof EffectVerificationApiError) return error.message;
  if (error instanceof TypeError) return "백엔드 서버에 연결할 수 없습니다. 8080 포트를 확인해 주세요.";
  return "효과 검증 상세 정보를 불러오지 못했습니다.";
}

function buildNarrative(actionName: string | null, metrics: VerificationMetricResult[]): string | null {
  const target = metrics.find((metric) => metric.metric_name === "target_sales");
  const total = metrics.find((metric) => metric.metric_name === "total_sales");
  if (!target && !total) return null;

  const sentences: string[] = [];
  const subject = actionName ? `"${actionName}" 실행 후` : "이 방안을 실행한 후";

  if (target?.change_rate != null) {
    sentences.push(`${subject} 추천 대상 시간대 매출이 ${formatMetricValue(target, target.before_value)}에서 ${formatMetricValue(target, target.after_value)}로 ${target.change_rate >= 0 ? "+" : ""}${target.change_rate}% ${target.change_rate >= 0 ? "상승" : "하락"}했습니다.`);
  }
  if (total?.change_rate != null) {
    sentences.push(`같은 기간 전체 매출은 ${total.change_rate >= 0 ? "+" : ""}${total.change_rate}% 변화했습니다.`);
  }
  if (target?.change_rate != null && total?.change_rate != null) {
    const adjusted = Math.round((target.change_rate - total.change_rate) * 100) / 100;
    sentences.push(`전체 매출 변화를 제외하면, 이 방안이 겨냥한 시간대만 놓고 봤을 때의 추가 개선 폭은 약 ${adjusted >= 0 ? "+" : ""}${adjusted}%p로 볼 수 있습니다.`);
  }
  return sentences.join(" ");
}

function ResultSection({ result, actionName }: { result: EffectVerificationResult; actionName: string | null }) {
  const allMetrics = result.metric_results ?? [];
  const relevantNames = result.recommendation_type === "SALES" && actionName && ACTION_AXIS[actionName]
    ? new Set([...COMMON_SALES_METRICS, ...(AXIS_EXTRA_METRICS[ACTION_AXIS[actionName]] ?? [])])
    : null;
  const metrics = relevantNames ? allMetrics.filter((metric) => relevantNames.has(metric.metric_name)) : allMetrics;
  const headline = metrics.find((metric) => metric.metric_name === "target_sales")
    ?? metrics.find((metric) => metric.metric_name === "total_sales")
    ?? metrics.find((metric) => metric.metric_name === "sales");
  const headlineUp = headline?.change_value != null && headline.change_value >= 0;
  const narrative = result.recommendation_type === "SALES" ? buildNarrative(actionName, metrics) : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold">매출 변화</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(result.verified_date)} 기준</p>
        </div>
        {headline && (
          <div className="text-right">
            <p className={`text-3xl font-black tabular-nums ${headlineUp ? "text-emerald-600" : "text-red-600"}`}>
              {headline.change_value != null
                ? `${headline.change_value >= 0 ? "+" : ""}${Math.round(headline.change_value).toLocaleString("ko-KR")}원`
                : "—"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatMetricValue(headline, headline.before_value)} → {formatMetricValue(headline, headline.after_value)}
              {headline.change_rate != null && ` (${headline.change_rate >= 0 ? "+" : ""}${headline.change_rate}%)`}
            </p>
          </div>
        )}
      </div>

      {narrative && (
        <p className="mt-4 rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-foreground">
          {narrative}
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/40">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-2 px-3 py-2 text-[11px] font-bold text-muted-foreground">
          <span>평가 지표</span>
          <span className="text-right">실행 전</span>
          <span className="text-right">실행 후</span>
          <span className="text-right">변화</span>
        </div>
        {metrics.length === 0 ? (
          <p className="border-t border-border px-3 py-8 text-center text-xs text-muted-foreground">
            표시할 세부 지표가 없습니다.
          </p>
        ) : metrics.map((metric, index) => (
          <div
            key={`${metric.metric_name}-${index}`}
            className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] items-center gap-2 border-t border-border px-3 py-2.5 text-xs text-foreground"
          >
            <span className="font-semibold">{METRIC_LABELS[metric.metric_name] ?? metric.metric_name}</span>
            <span className="text-right text-muted-foreground">{formatMetricValue(metric, metric.before_value)}</span>
            <span className="text-right font-semibold">{formatMetricValue(metric, metric.after_value)}</span>
            <span className={`flex items-center justify-end gap-0.5 font-bold ${
              metric.improved == null ? "text-muted-foreground" : metric.improved ? "text-emerald-600" : "text-red-600"
            }`}>
              {metric.improved == null
                ? null
                : metric.improved
                  ? <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
              {metric.change_rate == null ? "—" : `${metric.change_rate > 0 ? "+" : ""}${metric.change_rate}%`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EffectVerificationDetailPage() {
  const navigate = useNavigate();
  const { recommendationId: recommendationIdParam } = useParams();
  const recommendationId = recommendationIdParam?.trim() ?? "";
  const [execution, setExecution] = useState<VerificationExecution | null>(null);
  const [result, setResult] = useState<EffectVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [afterAnalysisId, setAfterAnalysisId] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const analysisOptions = useMemo(() => readCachedAnalysisOptions(), []);

  useEffect(() => {
    let active = true;
    if (!recommendationId) {
      setError("올바르지 않은 추천 ID입니다.");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError(null);
    const executionRequest = getVerificationExecution(recommendationId);
    Promise.all([
      executionRequest,
      executionRequest.then((nextExecution) =>
        nextExecution?.status === "VERIFIED"
          ? getVerificationResult(recommendationId)
          : null,
      ),
    ])
      .then(([nextExecution, nextResult]) => {
        if (!active) return;
        setExecution(nextExecution);
        setResult(nextResult);
        if (!nextExecution && !nextResult) setError("해당 효과 검증 기록을 찾을 수 없습니다.");
      })
      .catch((nextError: unknown) => {
        if (active) setError(getErrorMessage(nextError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [recommendationId, reloadKey]);

  const progress = useMemo(() => {
    if (!execution) return 0;
    const start = new Date(execution.executed_at).getTime();
    const due = new Date(execution.verification_due_at).getTime();
    if (due <= start) return 100;
    return Math.max(0, Math.min(100, Math.round(((Date.now() - start) / (due - start)) * 100)));
  }, [execution]);

  const remainingDays = execution
    ? Math.max(0, Math.ceil((new Date(execution.verification_due_at).getTime() - Date.now()) / 86_400_000))
    : 0;

  const completeFromAnalysis = async () => {
    if (!execution?.thread_id || !afterAnalysisId || completing) return;
    setCompleting(true);
    setCompleteError("");
    try {
      await completeVerificationFromAnalysis(execution.thread_id, afterAnalysisId);
      setReloadKey((key) => key + 1);
    } catch (nextError) {
      setCompleteError(getErrorMessage(nextError));
    } finally {
      setCompleting(false);
    }
  };

  const retryVerification = async () => {
    if (!recommendationId || retrying) return;
    setRetrying(true);
    setError(null);
    try {
      await retryEffectVerification(recommendationId);
      setReloadKey((key) => key + 1);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <PageShell
      title="전략 검증 상세"
      actions={(
        <button
          type="button"
          onClick={() => navigate(
            execution?.recommendation_type === "REVIEW"
              ? "/store/strategy-verifications/review"
              : "/store/strategy-verifications/sales"
          )}
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          전략 검증
        </button>
      )}
    >
      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          효과 검증 상세 정보를 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-2 h-7 w-7 text-red-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red-700 underline"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            다시 불러오기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {execution && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {execution.recommendation_type === "SALES" ? "매출형 전략 검증" : "리뷰형 전략 검증"}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    {actionNameOf(execution) ?? (execution.thread_id ? `분석 ${execution.thread_id}` : `추천 ${execution.recommendation_id}`)}
                  </h2>
                </div>
                {(() => {
                  const status = STATUS_VIEW[execution.status];
                  const StatusIcon = status.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}>
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {status.label}
                    </span>
                  );
                })()}
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-4 text-xs">
                <div><dt className="text-muted-foreground">실행일</dt><dd className="mt-1 font-semibold">{formatDate(execution.executed_at)}</dd></div>
                <div><dt className="text-muted-foreground">측정 완료 예정일</dt><dd className="mt-1 font-semibold">{formatDate(execution.verification_due_at)}</dd></div>
                <div><dt className="text-muted-foreground">검증 완료일</dt><dd className="mt-1 font-semibold">{formatDate(execution.verified_at)}</dd></div>
              </dl>

              {execution.status === "COLLECTING" && (
                <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-3">
                  <div className="flex justify-between text-xs font-bold text-violet-700">
                    <span>측정 진행률</span>
                    <span>{progress}% · {remainingDays > 0 ? `D-${remainingDays}` : "분석 가능"}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {execution.recommendation_type === "SALES"
                && execution.thread_id
                && execution.status !== "VERIFIED" && (
                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs font-bold text-emerald-800">실제 효과 확인 (매출 분석 기반)</p>
                  <p className="mt-1 text-[11px] text-emerald-700">
                    적용 후 매출 분석을 선택하면 측정 기간을 기다리지 않고 바로 8개 지표 전체를 실제값으로 확인합니다.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <select
                      value={afterAnalysisId}
                      onChange={(event) => setAfterAnalysisId(event.target.value)}
                      disabled={analysisOptions.length === 0 || completing}
                      className="h-9 flex-1 rounded-lg border border-border bg-card px-3 text-xs"
                    >
                      <option value="">적용 후 매출 분석 선택</option>
                      {analysisOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={completing || !afterAnalysisId}
                      onClick={completeFromAnalysis}
                      className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {completing ? "확인 중..." : "실제 효과 확인"}
                    </button>
                  </div>
                  {completeError && <p className="mt-2 text-xs text-red-600">{completeError}</p>}
                </div>
              )}

              {execution.failure_reason && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>실패 원인: {execution.failure_reason}</span>
                </div>
              )}
              {execution.status === "FAILED" && (
                <button
                  type="button"
                  disabled={retrying}
                  onClick={retryVerification}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
                  {retrying ? "재시도 중" : "효과 검증 재시도"}
                </button>
              )}
            </section>
          )}

          {result ? (
            <ResultSection result={result} actionName={actionNameOf(execution)} />
          ) : (
            <section className="rounded-2xl border border-border bg-card p-8 text-center">
              <Clock3 className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" aria-hidden="true" />
              <p className="text-sm font-semibold">아직 효과 검증 결과가 없습니다.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                측정 기간이 끝나고 분석이 완료되면 점수와 지표가 표시됩니다.
              </p>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}
