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
  getVerificationExecution,
  getVerificationResult,
} from "../../features/effect-verification/api/effectVerificationApi";
import { PageShell } from "../../shared/components/PageShell";

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

function ResultSection({ result }: { result: EffectVerificationResult }) {
  const metrics = result.metric_results ?? [];
  const verdict = {
    EFFECTIVE: { label: "효과 있음", style: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    PARTIALLY_EFFECTIVE: { label: "일부 효과", style: "border-amber-200 bg-amber-50 text-amber-700" },
    INCONCLUSIVE: { label: "판단 보류", style: "border-amber-200 bg-amber-50 text-amber-700" },
    INEFFECTIVE: { label: "효과 미확인", style: "border-red-200 bg-red-50 text-red-700" },
    NOT_EFFECTIVE: { label: "효과 미확인", style: "border-red-200 bg-red-50 text-red-700" },
  }[result.verdict];

  return (
    <section className={`rounded-2xl border p-5 ${verdict.style}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold">효과 검증 결과</p>
          <p className="mt-1 text-xs opacity-75">{formatDate(result.verified_date)} 기준 · {verdict.label}</p>
        </div>
        <p className="text-3xl font-black tabular-nums">
          {result.effect_score == null ? "—" : result.effect_score}
          {result.effect_score != null && <span className="ml-0.5 text-sm">점</span>}
        </p>
      </div>

      <p className="mt-4 rounded-xl bg-white/60 p-3 text-sm leading-relaxed text-foreground">
        {result.summary || "아직 제공된 분석 설명이 없습니다."}
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-black/5 bg-white/70">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-2 px-3 py-2 text-[11px] font-bold text-muted-foreground">
          <span>평가 지표</span>
          <span className="text-right">실행 전</span>
          <span className="text-right">실행 후</span>
          <span className="text-right">변화</span>
        </div>
        {metrics.length === 0 ? (
          <p className="border-t border-black/5 px-3 py-8 text-center text-xs text-muted-foreground">
            표시할 세부 지표가 없습니다.
          </p>
        ) : metrics.map((metric, index) => (
          <div
            key={`${metric.metric_name}-${index}`}
            className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] items-center gap-2 border-t border-black/5 px-3 py-2.5 text-xs text-foreground"
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
  const recommendationId = Number(recommendationIdParam);
  const [execution, setExecution] = useState<VerificationExecution | null>(null);
  const [result, setResult] = useState<EffectVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!Number.isSafeInteger(recommendationId) || recommendationId <= 0) {
      setError("올바르지 않은 추천 ID입니다.");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError(null);
    Promise.all([
      getVerificationExecution(recommendationId),
      getVerificationResult(recommendationId),
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

  return (
    <PageShell
      title="효과 검증 상세"
      subtitle={`추천 ID ${recommendationIdParam ?? "—"}의 실행 이후 변화를 확인합니다.`}
      actions={(
        <button
          type="button"
          onClick={() => navigate("/store/actions/history")}
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          검증 이력
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
                    매장 {execution.store_id} · {execution.recommendation_type === "SALES" ? "매출형" : "리뷰형"}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">추천 ID {execution.recommendation_id}</h2>
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

              <dl className="mt-5 grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                <div><dt className="text-muted-foreground">실행일</dt><dd className="mt-1 font-semibold">{formatDate(execution.executed_at)}</dd></div>
                <div><dt className="text-muted-foreground">측정 완료 예정일</dt><dd className="mt-1 font-semibold">{formatDate(execution.verification_due_at)}</dd></div>
                <div><dt className="text-muted-foreground">검증 완료일</dt><dd className="mt-1 font-semibold">{formatDate(execution.verified_at)}</dd></div>
                <div><dt className="text-muted-foreground">분석 시도</dt><dd className="mt-1 font-semibold">{execution.attempt_count}회</dd></div>
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

              {execution.failure_reason && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>실패 원인: {execution.failure_reason}</span>
                </div>
              )}
            </section>
          )}

          {result ? (
            <ResultSection result={result} />
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
