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
  PlayCircle,
  RefreshCw,
  Store,
  Trash2,
  XCircle,
} from "lucide-react";
import type {
  VerificationCandidateRecommendation,
  VerificationExecution,
  VerificationStatus,
} from "../../entities/effect-verification/effect-verification.types";
import {
  EffectVerificationApiError,
  getVerificationCandidates,
  getVerificationHistory,
  registerMockThreadExecution,
  resetMockVerificationData,
  startRecommendationExecution,
} from "../../features/effect-verification/api/effectVerificationApi";
import { PageShell } from "../../shared/components/PageShell";

const STORE_OPTIONS = [
  { id: 1, label: "매장 1" },
  { id: 2, label: "매장 2" },
  { id: 3, label: "매장 3" },
];

const STATUS_OPTIONS: Array<{ value: VerificationStatus | ""; label: string }> = [
  { value: "", label: "전체 상태" },
  { value: "COLLECTING", label: "측정 중" },
  { value: "READY", label: "분석 대기" },
  { value: "VERIFIED", label: "검증 완료" },
  { value: "FAILED", label: "검증 실패" },
];

const STATUS_VIEW: Record<
  VerificationStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  COLLECTING: { label: "측정 중", className: "border-violet-200 bg-violet-50 text-violet-700", icon: Clock3 },
  READY: { label: "분석 대기", className: "border-amber-200 bg-amber-50 text-amber-700", icon: CalendarClock },
  VERIFIED: { label: "검증 완료", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  FAILED: { label: "검증 실패", className: "border-red-200 bg-red-50 text-red-700", icon: XCircle },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getRemainingDays(dueAt: string) {
  const difference = new Date(dueAt).getTime() - Date.now();
  return difference <= 0 ? 0 : Math.ceil(difference / 86_400_000);
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
      aria-label={`추천 ID ${execution.recommendation_id} 효과 검증 상세보기`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>추천 ID {execution.recommendation_id}</span>
            <span aria-hidden="true">·</span>
            <span>{execution.recommendation_type === "SALES" ? "매출형" : "리뷰형"}</span>
          </div>
          <h3 className="font-bold">매장 {execution.store_id} 효과 검증</h3>
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

export function EffectVerificationHistoryPage() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState(1);
  const [status, setStatus] = useState<VerificationStatus | "">("");
  const [history, setHistory] = useState<VerificationExecution[]>([]);
  const [candidates, setCandidates] = useState<VerificationCandidateRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidateLoading, setCandidateLoading] = useState(true);
  const [startingThreadId, setStartingThreadId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateError, setCandidateError] = useState<string | null>(null);
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

  useEffect(() => {
    let active = true;
    setCandidateLoading(true);
    setCandidateError(null);

    getVerificationCandidates()
      .then((items) => {
        if (active) setCandidates(items);
      })
      .catch((nextError: unknown) => {
        if (!active) return;
        setCandidates([]);
        setCandidateError(
          nextError instanceof EffectVerificationApiError
            ? nextError.message
            : "실행 가능한 추천을 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (active) setCandidateLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const selectedStore = useMemo(
    () => STORE_OPTIONS.find((store) => store.id === storeId)?.label ?? `매장 ${storeId}`,
    [storeId],
  );

  const displayedHistory = useMemo(
    () => status ? history.filter((execution) => execution.status === status) : history,
    [history, status],
  );

  const availableCandidates = useMemo(() => {
    const startedThreadIds = new Set(
      history
        .map((execution) => execution.thread_id)
        .filter((threadId): threadId is string => Boolean(threadId)),
    );

    return candidates.filter((candidate) => (
      Boolean(candidate.final_report)
      && candidate.approval_status !== "rejected"
      && Boolean(candidate.selected_action?.action)
      && Number(candidate.store_id) === storeId
      && !startedThreadIds.has(candidate.thread_id)
    ));
  }, [candidates, history, storeId]);

  const startExecution = async (candidate: VerificationCandidateRecommendation) => {
    setStartingThreadId(candidate.thread_id);
    setCandidateError(null);
    try {
      const recommendationType = candidate.recommendation_type ?? "SALES";
      const targetAspect = candidate.target_aspect ?? null;
      if (candidate.mock) {
        await registerMockThreadExecution(candidate.thread_id, {
          store_id: Number(candidate.store_id),
          recommendation_type: recommendationType,
          condition: {
            period_days: 14,
            start_hour: null,
            end_hour: null,
            compare_same_weekday: false,
            target_aspect: targetAspect,
          },
        });
      } else {
        await startRecommendationExecution({
          thread_id: candidate.thread_id,
          recommendation_type: recommendationType,
          target_aspect: targetAspect,
        });
      }
      setReloadKey((key) => key + 1);
    } catch (nextError) {
      setCandidateError(
        nextError instanceof EffectVerificationApiError
          ? nextError.message
          : "효과 검증을 시작하지 못했습니다.",
      );
    } finally {
      setStartingThreadId(null);
    }
  };

  const resetMockData = async () => {
    if (!window.confirm("효과 검증 실행·결과 데이터를 초기화할까요? Mock 원본 데이터는 유지됩니다.")) {
      return;
    }
    setResetting(true);
    setError(null);
    try {
      await resetMockVerificationData();
      setStatus("");
      setReloadKey((key) => key + 1);
    } catch (nextError) {
      setError(
        nextError instanceof EffectVerificationApiError
          ? nextError.message
          : "Mock 효과 검증 데이터를 초기화하지 못했습니다.",
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <PageShell
      title="효과 검증 이력"
      subtitle="매장별 추천 실행 상태와 검증 일정을 확인합니다."
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
          <label htmlFor="history-store" className="mb-1.5 flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            매장
          </label>
          <select
            id="history-store"
            value={storeId}
            onChange={(event) => setStoreId(Number(event.target.value))}
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
          >
            {STORE_OPTIONS.map((store) => (
              <option key={store.id} value={store.id}>{store.label}</option>
            ))}
          </select>
        </div>

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
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={resetMockData}
            disabled={loading || resetting}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {resetting ? "초기화 중" : "Mock 초기화"}
          </button>
        )}
      </section>

      {import.meta.env.DEV && (
        <section className="mb-5 rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-bold">검증 시작 가능한 추천</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              승인과 리포트 생성이 끝난 추천 중 실제로 실행할 항목을 선택합니다.
            </p>
          </div>
          {!candidateLoading && !candidateError && (
            <span className="text-xs font-bold">{availableCandidates.length}건</span>
          )}
        </div>

        {candidateLoading ? (
          <div className="rounded-xl bg-muted/40 p-5 text-center text-xs text-muted-foreground">
            승인된 추천을 불러오는 중입니다.
          </div>
        ) : candidateError ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="text-xs font-semibold text-red-700">{candidateError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="shrink-0 text-xs font-bold text-red-700 underline"
            >
              다시 시도
            </button>
          </div>
        ) : availableCandidates.length === 0 ? (
          <div className="rounded-xl bg-muted/40 p-5 text-center">
            <p className="text-sm font-semibold">현재 실행 가능한 추천이 없습니다.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              매출 기반 전략 추천에서 추천 승인과 리포트 생성을 먼저 완료해 주세요.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableCandidates.map((candidate) => (
              <article
                key={candidate.thread_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="font-bold">{candidate.selected_action?.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    매장 {candidate.store_id} · {candidate.recommendation_type === "REVIEW" ? "리뷰형" : "매출형"}
                    {candidate.target_aspect ? ` · 대상 ${candidate.target_aspect}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={startingThreadId !== null}
                  onClick={() => startExecution(candidate)}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-[#246BFD] px-4 text-xs font-bold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {startingThreadId === candidate.thread_id ? "시작 중" : "실행 시작"}
                </button>
              </article>
            ))}
          </div>
        )}
        </section>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selectedStore} · {STATUS_OPTIONS.find((option) => option.value === status)?.label}
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
          <p className="mt-1 text-xs text-muted-foreground">다른 매장이나 상태를 선택해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {displayedHistory.map((execution) => (
            <HistoryCard
              key={execution.recommendation_id}
              execution={execution}
              onOpen={() => navigate(`/store/actions/verifications/${execution.recommendation_id}`)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
