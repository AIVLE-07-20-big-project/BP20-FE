import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Filter,
  ChevronRight,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type {
  RecommendationType,
  VerificationExecution,
  VerificationStatus,
} from "../../entities/effect-verification/effect-verification.types";
import {
  EffectVerificationApiError,
  getVerificationHistory,
} from "../../features/effect-verification/api/effectVerificationApi";
import { PageShell } from "../../shared/components/PageShell";

const STATUS_OPTIONS: Array<{ value: VerificationStatus | ""; label: string }> = [
  { value: "", label: "전체 상태" },
  { value: "COLLECTING", label: "실행 중" },
  { value: "READY", label: "실행 대기 중" },
  { value: "VERIFIED", label: "실행 완료" },
  { value: "FAILED", label: "실행 실패" },
];

const STATUS_VIEW: Record<
  VerificationStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  COLLECTING: { label: "실행 중", className: "border-violet-200 bg-violet-50 text-violet-700", icon: Clock3 },
  READY: { label: "실행 대기 중", className: "border-amber-200 bg-amber-50 text-amber-700", icon: CalendarClock },
  VERIFIED: { label: "실행 완료", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  FAILED: { label: "실행 실패", className: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRemainingDays(dueAt: string) {
  const difference = new Date(dueAt).getTime() - Date.now();
  return difference <= 0 ? 0 : Math.ceil(difference / 86_400_000);
}

function actionNameOf(execution: VerificationExecution) {
  return execution.selected_action?.방안 ?? execution.selected_action?.action ?? null;
}

function HistoryCard({
  execution,
  onOpen,
}: {
  execution: VerificationExecution;
  onOpen: () => void;
}) {
  const status = STATUS_VIEW[execution.status];
  const StatusIcon = status.icon;
  const remainingDays = getRemainingDays(execution.verification_due_at);

  return (
    <article
      tabIndex={0}
      role="link"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group cursor-pointer rounded-2xl border border-border bg-card p-4 transition-all hover:border-[#246BFD]/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
      aria-label={`${actionNameOf(execution) ?? "추천 방안"} 효과 검증 상세보기`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{execution.recommendation_type === "SALES" ? "매출형" : "리뷰형"}</span>
          </div>
          <h3 className="font-bold">{actionNameOf(execution) ?? "추천 방안 확인 불가"}</h3>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}>
          <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">실행일</dt>
          <dd className="mt-1 font-semibold">{formatDate(execution.executed_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">측정 완료 예정일</dt>
          <dd className="mt-1 font-semibold">{formatDate(execution.verification_due_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">검증 완료일</dt>
          <dd className="mt-1 font-semibold">{formatDate(execution.verified_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">진행 상태</dt>
          <dd className="mt-1 font-semibold">
            {execution.status === "COLLECTING"
              ? remainingDays > 0 ? `D-${remainingDays}` : "분석 가능"
              : status.label}
          </dd>
        </div>
      </dl>

      {execution.status === "FAILED" && execution.failure_reason && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/70 p-3 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{execution.failure_reason}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-1 text-xs font-bold text-[#246BFD]">
        효과 상세보기
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </article>
  );
}

export function EffectVerificationHistoryPage({
  recommendationType,
}: {
  recommendationType: RecommendationType;
}) {
  const navigate = useNavigate();
  const storeId = 1;
  const [status, setStatus] = useState<VerificationStatus | "">("");
  const [history, setHistory] = useState<VerificationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getVerificationHistory(storeId)
      .then((items) => {
        if (active) setHistory(items);
      })
      .catch((nextError: unknown) => {
        if (!active) return;
        setHistory([]);
        setError(
          nextError instanceof EffectVerificationApiError
            ? nextError.message
            : "효과 검증 이력을 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeId, reloadKey]);

  const displayedHistory = useMemo(
    () => history
      .filter((execution) => (
        execution.recommendation_type === recommendationType
        && (!status || execution.status === status)
      ))
      .sort((left, right) => (
        new Date(right.executed_at).getTime() - new Date(left.executed_at).getTime()
      )),
    [history, recommendationType, status],
  );

  return (
    <PageShell
      title={recommendationType === "SALES" ? "매출형 전략 검증" : "리뷰형 전략 검증"}
      subtitle="실행한 AI 전략의 측정 진행 상태와 효과 검증 결과를 확인합니다."
      actions={(
        <button
          type="button"
          onClick={() => navigate("/store/actions")}
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          매출 기반 전략 추천
        </button>
      )}
    >
      <section className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="min-w-40 flex-1">
          <label htmlFor="history-status" className="mb-1.5 flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            상태
          </label>
          <select
            id="history-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as VerificationStatus | "")}
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "ALL"} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          새로고침
        </button>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          실행일 최신순 · {STATUS_OPTIONS.find((option) => option.value === status)?.label}
        </p>
        {!loading && !error && <span className="text-xs font-bold">{displayedHistory.length}건</span>}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          효과 검증 이력을 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto mb-2 h-7 w-7 text-red-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-3 text-xs font-bold text-red-700 underline"
          >
            다시 시도
          </button>
        </div>
      ) : displayedHistory.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <CalendarClock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm font-semibold">조건에 맞는 효과 검증 이력이 없습니다.</p>
          <p className="mt-1 text-xs text-muted-foreground">다른 상태를 선택해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {displayedHistory.map((execution) => (
            <HistoryCard
              key={execution.recommendation_id}
              execution={execution}
              onOpen={() => navigate(`/store/strategy-verifications/${execution.recommendation_id}`)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
