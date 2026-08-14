import { useEffect, useRef, useState } from "react";
import { Target, Info, Loader2, AlertTriangle, PlayCircle, History, Sparkles, Bot, Flag, X, Trash2 } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { ApiError } from "../../shared/api/apiClient";
import {
  approveSalesTargetBatch,
  cleanupStaleSalesTargetBatches,
  deleteAllSalesTargets,
  deleteSalesTargetBatch,
  fetchSalesTargets,
  getSalesTargetBatch,
  listSalesTargetBatches,
  rejectSalesTargetBatch,
  startSalesTargetBatch,
  updateSalesTargetPipelineStatus,
} from "../../features/sales-target/api/salesTargetApi";
import type { PipelineStatus, SalesTargetBatchRun, SalesTargetBusiness } from "../../entities/sales-target/sales-target.types";
import { LEGAL_CONFIG } from "../legal/legalConfig";

const PIPELINE_STATUS_STYLE: Record<PipelineStatus, { bg: string; text: string }> = {
  "후보": { bg: "bg-gray-100", text: "text-gray-500" },
  "연락 예정": { bg: "bg-blue-50", text: "text-blue-600" },
  "접촉": { bg: "bg-sky-50", text: "text-sky-600" },
  "미팅": { bg: "bg-indigo-50", text: "text-indigo-600" },
  "전환": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "보류": { bg: "bg-amber-50", text: "text-amber-600" },
  "제외": { bg: "bg-red-50", text: "text-red-500" },
};

const PIPELINE_STAGES: PipelineStatus[] = ["후보", "연락 예정", "접촉", "미팅", "전환", "보류", "제외"];

// 테스트 데이터를 한 번에 정리한 뒤 요청으로 비활성화했다. 다시 켜려면 이 값만 true로 바꾸면 된다.
const DELETE_ALL_ENABLED = false;

// 4단계(운영 정리 정책) — 배치 이력 한 줄의 상태를 "대기/완료/반려/자동 반려" 배지로 요약한다.
function batchHistoryBadge(run: SalesTargetBatchRun): { label: string; bg: string; text: string } {
  if (run.pendingApproval) return { label: "승인 대기", bg: "bg-amber-50", text: "text-amber-600" };
  if (run.autoRejected) return { label: "자동 반려", bg: "bg-red-50", text: "text-red-500" };
  if (run.status.includes("반려")) return { label: "반려", bg: "bg-gray-100", text: "text-gray-500" };
  if (run.status.includes("완료")) return { label: "완료", bg: "bg-emerald-50", text: "text-emerald-700" };
  return { label: run.status || "알 수 없음", bg: "bg-muted", text: "text-muted-foreground" };
}

function formatBatchDate(iso: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums w-7 text-right">{Math.round(value)}</span>
    </div>
  );
}

export function SalesTargetsPage() {
  const [targets, setTargets] = useState<SalesTargetBusiness[]>([]);
  const [selected, setSelected] = useState<SalesTargetBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [activeBatch, setActiveBatch] = useState<SalesTargetBatchRun | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // 4단계(운영 정리 정책) — 과거 배치 실행 이력. 승인 대기 중이 아닌 배치(완료/반려/자동 반려)도
  // 포함해서, 관리자가 "얼마나 방치되다 자동 반려됐는지" 등을 확인할 수 있게 한다.
  const [batchHistory, setBatchHistory] = useState<SalesTargetBatchRun[]>([]);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  // 배치 이력 한 줄 삭제(정리용) 상태. threadId 단위로 버튼별 로딩을 구분한다.
  const [deleteBatchBusyId, setDeleteBatchBusyId] = useState<string | null>(null);
  const [deleteBatchError, setDeleteBatchError] = useState<string | null>(null);

  // SQL 없이 테스트/디버깅 중 쌓인 후보를 관리자가 클릭 한 번으로 정리할 수 있게 하는 버튼용 상태.
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);
  const [deleteAllMessage, setDeleteAllMessage] = useState<string | null>(null);

  // 배치 이력 한 줄을 클릭했을 때 그 배치가 실제로 추천했던 업장/피칭 문구를 보여주는 상세 보기.
  // listSalesTargetBatches()가 이미 BE 캐시에 있던 finalCandidates를 같이 내려주지만, 클릭
  // 시점엔 항상 getSalesTargetBatch로 다시 불러와 AI 쪽 최신 상태로 갱신한다.
  const [viewingBatch, setViewingBatch] = useState<SalesTargetBatchRun | null>(null);
  const [viewingBusy, setViewingBusy] = useState(false);
  const [viewingError, setViewingError] = useState<string | null>(null);

  // 방금 승인한 배치. 아직 목록에서 아무 타겟도 선택 안 한 상태(selected === null)일 때
  // 우측 상세 패널의 빈 자리에 대신 보여준다 — 승인한 업장들이 실제로 반영됐는지 스크롤해서
  // 찾아다니지 않아도 바로 보이게 하기 위함.
  const [recentApproval, setRecentApproval] = useState<SalesTargetBatchRun | null>(null);

  // 이 목록(targets)은 애초에 승인된 배치가 finalize 단계에서 BE로 bulk upsert된 건만 들어온다
  // — "승인 대기 중"인 미승인 후보는 여기 섞일 일이 없다. "보류"/"제외"는 영업팀이 이미 손을
  // 뗀 상태라 지금 실제로 굴러가는 단계(후보~전환)에서 제외한다.
  const APPROVED_STAGES = PIPELINE_STAGES.slice(0, 5); // 후보, 연락 예정, 접촉, 미팅, 전환
  const approvedTargets = targets.filter((t) => APPROVED_STAGES.includes(t.pipelineStatus));

  // 단계 탭에서 하나를 고르면 그 단계만, 안 골랐으면("전체") 승인된 전체 단계를 보여준다.
  const [stageFilter, setStageFilter] = useState<PipelineStatus | null>(null);
  const visibleTargets = stageFilter ? targets.filter((t) => t.pipelineStatus === stageFilter) : approvedTargets;

  function handleStageFilterChange(stage: PipelineStatus | null) {
    setStageFilter(stage);
    setPage(0);
  }

  // 좌측 후보 목록이 너무 길어서(전체 배치 누적) 10개씩 잘라 보여준다.
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(visibleTargets.length / PAGE_SIZE));
  const pagedTargets = visibleTargets.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // 배치 이력 테이블만 새로고침한다(activeBatch 배너는 건드리지 않는다) — 승인/반려 직후처럼
  // 그 액션의 결과(run)를 이미 확실히 알고 있을 때 쓴다. 여기서 다시 "혹시 다른 배치가 아직
  // 승인 대기 중인지" 스캔해서 activeBatch를 덮어쓰면, 예를 들어 방금 반려했는데 예전에 방치된
  // 다른 배치가 튀어나와 배너가 계속 "승인 대기 중"으로 보이는 문제가 있었다.
  async function refreshHistoryListOnly() {
    try {
      const batches = await listSalesTargetBatches();
      setBatchHistory(batches);
    } catch {
      // 배치 이력 조회 실패는 후보 목록 화면 자체를 막을 정도는 아니라서 조용히 무시한다.
    }
  }

  // listSalesTargetBatches()가 내려주는 pendingApproval은 BE 자체 캐시(resultJson) 값이다.
  // 승인/반려 도중 finalize 단계 등에서 오류가 나면, AI 쪽 LangGraph는 이미 interrupt를 소비해
  // 더 이상 승인/반려가 안 되는(재시도해도 409) 상태로 넘어가버렸는데, BE 캐시는 실패 전 마지막
  // 상태(승인 대기 중)로 남아 새로고침을 해도 계속 "승인 대기 중"으로 보이는 문제가 있었다.
  // 그래서 목록에서 대기 중으로 보이는 배치를 "전부" getSalesTargetBatch(단건 조회)로 AI 쪽
  // 실제 최신 상태를 다시 확인한다 — 이 호출 자체가 BE 캐시도 함께 갱신해주므로, 이미 끝난
  // 배치였다면 여기서 바로잡힌다. 상단 배너(activeBatch)뿐 아니라 배치 이력 테이블 각 행의
  // 배지도 이 결과로 같이 갈아끼워야, 예를 들어 "11시에 실행한 배치"가 이력 목록에서 계속
  // "승인 대기"로 잘못 남아있는 문제까지 해결된다.
  async function resolvePendingBatches(
    batches: SalesTargetBatchRun[]
  ): Promise<{ batches: SalesTargetBatchRun[]; active: SalesTargetBatchRun | null }> {
    // isProcessing도 같이 재확인한다 — 새로고침 시점에 BE 캐시가 "아직 처리 중"이던 순간
    // 그대로 남아있을 수 있어서(그 사이 완료됐을 수도 있음), 실제 최신 상태를 다시 물어봐야 한다.
    const pending = batches.filter((b) => b.pendingApproval || b.isProcessing);
    if (pending.length === 0) {
      return { batches, active: batches[0] ?? null };
    }
    const resolved = await Promise.all(
      pending.map((b) => getSalesTargetBatch(b.threadId).catch(() => b))
    );
    const resolvedByThreadId = new Map(resolved.map((r) => [r.threadId, r]));
    const patched = batches.map((b) => resolvedByThreadId.get(b.threadId) ?? b);
    const stillPending = patched.find((b) => b.pendingApproval || b.isProcessing);
    return { batches: patched, active: stillPending ?? patched[0] ?? null };
  }

  // 활성 폴링 타이머(setInterval id)를 들고 있는다. 배치가 처리 중(isProcessing)인 동안
  // getSalesTargetBatch를 주기적으로 불러 완료 여부를 확인한다 — 배치 실행 자체가 몇 분씩
  // 걸릴 수 있어(공공데이터 수집 등), 시작 요청 하나로 끝까지 기다리면 CloudFront/ALB
  // 타임아웃에 걸려 FE에 "요청 처리 중 오류가 발생했습니다"가 먼저 뜨는 문제가 있었다.
  const pollIntervalRef = useRef<number | null>(null);

  function stopPolling() {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  function startPolling(threadId: string) {
    stopPolling();
    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const run = await getSalesTargetBatch(threadId);
        setActiveBatch(run);
        if (!run.isProcessing) {
          stopPolling();
          await refreshHistoryListOnly();
        }
      } catch {
        // 아주 짧은 순간(백그라운드 실행 시작 직후) 일시적으로 조회가 실패할 수 있어, 폴링
        // 자체를 바로 끊지는 않는다 — 다음 주기에 다시 시도한다.
      }
    }, 5000);
  }

  useEffect(() => stopPolling, []);

  // 배치 이력을 다시 불러오면서, 승인 대기 중인 배치가 있으면 activeBatch 배너에 다시 띄운다.
  // 페이지를 처음 열었을 때(또는 새 배치를 막 시작했을 때)처럼 "지금 뭐가 승인 대기 중인지
  // 모르는" 상황에서만 쓴다.
  async function refreshBatchHistory() {
    try {
      const batches = await listSalesTargetBatches();
      const { batches: patched, active } = await resolvePendingBatches(batches);
      setBatchHistory(patched);
      setActiveBatch(active);
      if (active?.isProcessing) {
        startPolling(active.threadId);
      } else {
        stopPolling();
      }
    } catch {
      // 배치 이력 조회 실패는 후보 목록 화면 자체를 막을 정도는 아니라서 조용히 무시한다.
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSalesTargets()
      .then((data) => {
        if (cancelled) return;
        setTargets(data);
        setPage(0);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "영업 타겟을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // 페이지를 새로고침해도 이전에 시작해 둔 배치가 아직 승인 대기 중이면 배너가 그대로
    // 다시 뜨도록, 배치 이력 전체를 가져와 확인한다.
    listSalesTargetBatches()
      .then(async (batches) => {
        if (cancelled) return;
        const { batches: patched, active } = await resolvePendingBatches(batches);
        if (cancelled) return;
        setBatchHistory(patched);
        setActiveBatch(active);
        if (active?.isProcessing) {
          startPolling(active.threadId);
        }
      })
      .catch(() => {
        // 배치 이력 조회 실패는 후보 목록 화면 자체를 막을 정도는 아니라서 조용히 무시한다.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleStartBatch() {
    if (batchBusy) return;
    setBatchBusy(true);
    setBatchError(null);
    try {
      const run = await startSalesTargetBatch();
      setActiveBatch(run);
      if (run.isProcessing) {
        // AI가 thread_id만 먼저 반환하고 실제 실행은 백그라운드로 넘긴 상태 — 배치 이력에는
        // 아직 반영할 게 없으니(진행 중이라 캐시할 결과가 없음) refreshBatchHistory 대신
        // 폴링만 시작한다. 완료되면 startPolling 안에서 refreshHistoryListOnly를 호출한다.
        startPolling(run.threadId);
      } else {
        await refreshBatchHistory();
      }
    } catch (err) {
      setBatchError(err instanceof ApiError ? err.message : "배치 실행을 시작하지 못했습니다.");
    } finally {
      setBatchBusy(false);
    }
  }

  async function handleApproveBatch() {
    if (!activeBatch || batchBusy) return;
    setBatchBusy(true);
    setBatchError(null);
    try {
      const run = await approveSalesTargetBatch(activeBatch.threadId);
      setActiveBatch(run);
      setRecentApproval(run);
      setSelected(null);
      await refreshHistoryListOnly();
      // 승인되면 finalize 노드가 BE에 즉시 bulk upsert하므로, 후보 목록을 다시 불러와 반영한다.
      const refreshed = await fetchSalesTargets();
      setTargets(refreshed);
      setPage(0);
    } catch (err) {
      await handleBatchActionError(err, "배치 승인");
    } finally {
      setBatchBusy(false);
    }
  }

  async function handleRejectBatch() {
    if (!activeBatch || batchBusy) return;
    setBatchBusy(true);
    setBatchError(null);
    try {
      const run = await rejectSalesTargetBatch(activeBatch.threadId);
      setActiveBatch(run);
      await refreshHistoryListOnly();
    } catch (err) {
      await handleBatchActionError(err, "배치 반려");
    } finally {
      setBatchBusy(false);
    }
  }

  // 승인/반려 버튼을 눌렀는데 이미 다른 곳에서(혹은 이전 세션에서) 처리가 끝난 배치라서
  // AI가 409(현재 승인 대기 상태가 아님)를 돌려줄 때가 있다 — 화면이 새로고침 없이는 이 사실을
  // 모르고 계속 "승인 대기 중" 배너를 띄워둔 채였다. 409면 에러로만 두지 않고 최신 상태를
  // 다시 불러와서 배너 자체를 바로잡는다.
  async function handleBatchActionError(err: unknown, actionLabel: string) {
    if (err instanceof ApiError && err.status === 409) {
      setBatchError("이미 처리된 배치였습니다 — 최신 상태로 새로고침했습니다.");
      await refreshBatchHistory();
      return;
    }
    setBatchError(err instanceof ApiError ? err.message : `${actionLabel}에 실패했습니다.`);
  }

  // 배치 이력 한 줄을 정리 목적으로 지운다. BE가 아직 승인 대기 중인 배치는 409로 막아주므로,
  // 그 경우엔 안내만 하고 refreshBatchHistory로 최신 상태(자가치유 포함)를 다시 보여준다.
  async function handleDeleteBatchRun(threadId: string) {
    if (deleteBatchBusyId) return;
    if (!window.confirm("이 배치 이력을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setDeleteBatchBusyId(threadId);
    setDeleteBatchError(null);
    try {
      await deleteSalesTargetBatch(threadId);
      if (viewingBatch?.threadId === threadId) setViewingBatch(null);
      await refreshBatchHistory();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDeleteBatchError("승인 대기 중인 배치는 삭제할 수 없습니다 — 먼저 승인하거나 반려해 주세요.");
        await refreshBatchHistory();
      } else {
        setDeleteBatchError(err instanceof ApiError ? err.message : "삭제에 실패했습니다.");
      }
    } finally {
      setDeleteBatchBusyId(null);
    }
  }

  async function handleCleanupStaleBatches() {
    if (cleanupBusy) return;
    setCleanupBusy(true);
    setCleanupMessage(null);
    try {
      const rejected = await cleanupStaleSalesTargetBatches();
      setCleanupMessage(
        rejected.length === 0 ? "방치된 배치가 없습니다." : `${rejected.length}건을 자동 반려했습니다.`
      );
      await refreshBatchHistory();
    } catch (err) {
      setCleanupMessage(err instanceof ApiError ? err.message : "정리 실행에 실패했습니다.");
    } finally {
      setCleanupBusy(false);
    }
  }

  // sales_target_candidates 테이블을 SQL 없이 전체 정리하고 싶을 때 쓴다. 되돌릴 수 없어서
  // 확인창을 한 번 거친다. 배치 이력은 건드리지 않으므로 여기서는 targets만 다시 불러온다.
  async function handleDeleteAllTargets() {
    if (!DELETE_ALL_ENABLED || deleteAllBusy) return;
    if (!window.confirm("영업 타겟 후보를 전부 삭제합니다. 되돌릴 수 없는데 진행할까요?")) return;
    setDeleteAllBusy(true);
    setDeleteAllMessage(null);
    try {
      const deletedCount = await deleteAllSalesTargets();
      setDeleteAllMessage(`${deletedCount}건을 삭제했습니다.`);
      const refreshed = await fetchSalesTargets();
      setTargets(refreshed);
      setPage(0);
      setSelected(null);
    } catch (err) {
      setDeleteAllMessage(err instanceof ApiError ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeleteAllBusy(false);
    }
  }

  async function handleViewBatch(threadId: string) {
    if (viewingBusy) return;
    setViewingBusy(true);
    setViewingError(null);
    try {
      const run = await getSalesTargetBatch(threadId);
      setViewingBatch(run);
    } catch (err) {
      setViewingError(err instanceof ApiError ? err.message : "배치 상세 조회에 실패했습니다.");
    } finally {
      setViewingBusy(false);
    }
  }

  async function handleStageChange(target: SalesTargetBusiness, stage: PipelineStatus) {
    if (target.pipelineStatus === stage || updatingId !== null) return;
    setUpdatingId(target.id);
    setError(null);
    try {
      const updated = await updateSalesTargetPipelineStatus(target.id, stage);
      setTargets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "상태 변경에 실패했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <PageShell title="영업 타겟" subtitle="AI가 추천한 신규 영업 대상 비가맹점입니다." freshness="오늘 09:42 기준">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-5 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">점수는 의사결정 보조 자료이며 전환을 보장하지 않습니다. 상권 성장률, 유동인구, 리뷰 활성도, 유사 가맹점 성과를 종합 반영했습니다.</p>
      </div>

      {/* 배치 실행 / 승인 대기 */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        {activeBatch?.isProcessing ? (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#246BFD] animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">배치 생성 중...</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                공공데이터 수집 및 스코어링에 몇 분 정도 걸릴 수 있습니다. 완료되면 자동으로 승인 대기 화면으로 바뀝니다.
              </p>
            </div>
          </div>
        ) : activeBatch?.pendingApproval ? (
          <div>
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">
                  관리자 승인 대기 중 · 후보 {activeBatch.pendingApproval.candidateCount}건
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{activeBatch.status}</p>
              </div>
            </div>

            {activeBatch.pendingApproval.warnings.length > 0 && (
              <ul className="mb-3 space-y-1">
                {activeBatch.pendingApproval.warnings.map((w) => (
                  <li key={w} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                    {w}
                  </li>
                ))}
              </ul>
            )}

            {/* 구현 4 — critic_agent가 사람이 보기 전에 먼저 훑어본 요약 */}
            {activeBatch.pendingApproval.agentSummary && (
              <div className="mb-3 flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
                <Bot className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-sky-700 mb-0.5">AI 배치 검수 요약</p>
                  <p className="text-xs text-sky-800">{activeBatch.pendingApproval.agentSummary}</p>
                </div>
              </div>
            )}

            {activeBatch.pendingApproval.flaggedCandidates.length > 0 && (
              <ul className="mb-3 space-y-1">
                {activeBatch.pendingApproval.flaggedCandidates.map((f, i) => (
                  <li
                    key={`${f.businessName}-${i}`}
                    className="flex items-start gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1"
                  >
                    <Flag className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span><span className="font-bold">{f.businessName}</span> — {f.reason}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="max-h-56 overflow-y-auto border border-border rounded-xl mb-3">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left font-semibold px-3 py-2">상호</th>
                    <th className="text-left font-semibold px-3 py-2">업종</th>
                    <th className="text-left font-semibold px-3 py-2">주소</th>
                    <th className="text-right font-semibold px-3 py-2">종합 점수</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBatch.pendingApproval.candidates.map((c, i) => {
                    const flagged = activeBatch.pendingApproval!.flaggedCandidates.some(
                      (f) => f.businessName === c.businessName,
                    );
                    return (
                      <tr key={`${c.businessName}-${i}`} className={`border-t border-border ${flagged ? "bg-orange-50/60" : ""}`}>
                        <td className="px-3 py-1.5 font-medium">
                          {c.businessName}
                          {flagged && <Flag className="w-3 h-3 text-orange-500 inline-block ml-1" />}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{c.industry ?? "-"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{c.region}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-bold text-[#087F65]">
                          {c.totalScore == null ? "-" : Math.round(c.totalScore)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {batchError && <p className="text-xs text-red-600 mb-2">{batchError}</p>}

            <div className="flex gap-2">
              <button
                disabled={batchBusy}
                onClick={handleApproveBatch}
                className="flex-1 h-9 bg-[#087F65] disabled:opacity-60 text-white text-xs font-bold rounded-xl hover:bg-[#066B54] transition-colors flex items-center justify-center gap-1.5"
              >
                {batchBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} 승인하고 반영
              </button>
              <button
                disabled={batchBusy}
                onClick={handleRejectBatch}
                className="flex-1 h-9 bg-muted disabled:opacity-60 text-xs font-semibold rounded-xl hover:bg-muted-foreground/10 transition-colors"
              >
                반려
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-bold">신규 영업 타겟 배치 실행</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeBatch ? activeBatch.status : "AI가 공공데이터 대비 미가입 업장을 다시 스코어링합니다."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {batchError && <span className="text-xs text-red-600">{batchError}</span>}
              <button
                disabled={batchBusy}
                onClick={handleStartBatch}
                className="h-9 px-4 bg-[#246BFD] disabled:opacity-60 text-white text-xs font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5"
              >
                {batchBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                배치 실행
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 배치 이력 (4단계: 운영 정리 정책) */}
      {batchHistory.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-bold text-muted-foreground">배치 이력</p>
            </div>
            <div className="flex items-center gap-2">
              {viewingError && <span className="text-[11px] text-red-600">{viewingError}</span>}
              {deleteBatchError && <span className="text-[11px] text-red-600">{deleteBatchError}</span>}
              {cleanupMessage && <span className="text-[11px] text-muted-foreground">{cleanupMessage}</span>}
              <button
                disabled={cleanupBusy}
                onClick={handleCleanupStaleBatches}
                className="h-7 px-2.5 bg-muted disabled:opacity-60 text-[11px] font-semibold rounded-lg hover:bg-muted-foreground/10 transition-colors flex items-center gap-1"
              >
                {cleanupBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                방치된 배치 지금 정리
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto border border-border rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">시작 시각</th>
                  <th className="text-left font-semibold px-3 py-2">상태</th>
                  <th className="text-left font-semibold px-3 py-2">thread_id</th>
                  <th className="text-right font-semibold px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {batchHistory.map((run) => {
                  const badge = batchHistoryBadge(run);
                  return (
                    <tr
                      key={run.threadId}
                      onClick={() => handleViewBatch(run.threadId)}
                      className="border-t border-border cursor-pointer hover:bg-muted/60 transition-colors"
                    >
                      <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">{formatBatchDate(run.createdAt)}</td>
                      <td className="px-3 py-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>{badge.label}</span>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground/70 font-mono text-[10px]">{run.threadId}</td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          disabled={deleteBatchBusyId === run.threadId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBatchRun(run.threadId);
                          }}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 disabled:opacity-50 transition-colors"
                          title="배치 이력 삭제"
                        >
                          {deleteBatchBusyId === run.threadId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            "자동 반려"는 관리자가 일정 기간(기본 3일) 승인/반려하지 않고 방치해 시스템이 대신 반려한 배치입니다. 행을 클릭하면 그 배치가 추천한 업장과 피칭 문구를 볼 수 있습니다.
          </p>
        </div>
      )}

      {/* 배치 이력 상세 — 그 배치가 추천한 업장 목록과(승인된 경우) 피칭 문구를 보여준다 */}
      {viewingBatch && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingBatch(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-5 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-bold">배치 상세 · {formatBatchDate(viewingBatch.createdAt)}</p>
                <p className="text-[10px] text-muted-foreground/70 font-mono">{viewingBatch.threadId}</p>
                <p className="text-xs text-muted-foreground mt-1">{viewingBatch.status}</p>
              </div>
              <button
                onClick={() => setViewingBatch(null)}
                className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {viewingBatch.pendingApproval?.agentSummary && (
              <div className="mb-3 flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
                <Bot className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-sky-700 mb-0.5">AI 배치 검수 요약</p>
                  <p className="text-xs text-sky-800">{viewingBatch.pendingApproval.agentSummary}</p>
                </div>
              </div>
            )}

            {(() => {
              const list = viewingBatch.finalCandidates ?? viewingBatch.pendingApproval?.candidates ?? [];
              if (list.length === 0) {
                return <p className="text-xs text-muted-foreground">표시할 후보 정보가 없습니다.</p>;
              }
              return (
                <ul className="space-y-2">
                  {list.map((c, i) => (
                    <li key={`${c.businessName}-${i}`} className="border border-border rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold">{c.businessName}</span>
                        <span className="text-xs font-bold text-[#087F65] tabular-nums">
                          {c.totalScore == null ? "-" : Math.round(c.totalScore)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1">{c.industry ?? "-"} · {c.region}</p>
                      <p className="text-xs text-muted-foreground italic">
                        "{c.proposition ?? "추천 사유가 아직 생성되지 않았습니다."}"
                      </p>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-5 text-xs text-red-600">
          {error}
        </div>
      )}

      {!loading && targets.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleStageFilterChange(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                stageFilter === null ? "bg-[#087F65] text-white" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
              }`}
            >
              전체 {approvedTargets.length}
            </button>
            {APPROVED_STAGES.map((stage) => {
              const count = targets.filter((t) => t.pipelineStatus === stage).length;
              return (
                <button
                  key={stage}
                  onClick={() => handleStageFilterChange(stage)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                    stageFilter === stage ? "bg-[#087F65] text-white" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                  }`}
                >
                  {stage} {count}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {deleteAllMessage && <span className="text-[11px] text-muted-foreground">{deleteAllMessage}</span>}
            <button
              disabled={!DELETE_ALL_ENABLED || deleteAllBusy}
              onClick={handleDeleteAllTargets}
              title={DELETE_ALL_ENABLED ? undefined : "비활성화됨"}
              className="h-7 px-2.5 bg-muted disabled:opacity-40 text-[11px] font-semibold text-muted-foreground rounded-lg hover:bg-muted-foreground/10 transition-colors flex items-center gap-1"
            >
              {deleteAllBusy && <Loader2 className="w-3 h-3 animate-spin" />}
              테스트 데이터 전체 삭제 (비활성화됨)
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      ) : visibleTargets.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          {targets.length === 0
            ? "아직 추천된 영업 타겟이 없습니다."
            : stageFilter
            ? `"${stageFilter}" 단계인 영업 타겟이 없습니다.`
            : "현재 진행 중인 영업 타겟이 없습니다. (보류·제외 상태만 있음)"}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            {pagedTargets.map((t) => {
              const style = PIPELINE_STATUS_STYLE[t.pipelineStatus];
              return (
                <div
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`bg-card border rounded-2xl p-4 cursor-pointer transition-colors ${
                    selected?.id === t.id ? "border-[#087F65]/50 bg-[#087F65]/3" : "border-border hover:border-muted-foreground/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-sm">{t.name}</h4>
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>{t.pipelineStatus}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{t.industry} · {t.region}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-black text-[#087F65] tabular-nums">{Math.round(t.score)}</div>
                      <div className="text-[11px] text-muted-foreground">종합 점수</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: "성장률", value: t.growthScore, color: "bg-[#18C79A]" },
                      { label: "유동인구", value: t.trafficScore, color: "bg-[#5B6CFF]" },
                      { label: "리뷰", value: t.reviewScore, color: "bg-[#38BDF8]" },
                      { label: "유사도", value: t.similarityScore, color: "bg-[#0E9F6E]" },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="text-[10px] text-muted-foreground mb-0.5">{s.label}</div>
                        <ScoreBar value={s.value} color={s.color} />
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground italic">"{t.proposition}"</p>

                  <div className="flex gap-1 mt-3">
                    {PIPELINE_STAGES.slice(0, 5).map((stage) => (
                      <button
                        key={stage}
                        disabled={updatingId === t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStageChange(t, stage);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors disabled:opacity-50 ${
                          t.pipelineStatus === stage
                            ? "bg-[#087F65] text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {visibleTargets.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="h-8 px-3 bg-muted disabled:opacity-40 text-xs font-semibold rounded-lg hover:bg-muted-foreground/10 transition-colors"
                >
                  이전
                </button>
                <span className="text-xs text-muted-foreground">
                  {page + 1} / {totalPages} 페이지 · 전체 {visibleTargets.length}건
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="h-8 px-3 bg-muted disabled:opacity-40 text-xs font-semibold rounded-lg hover:bg-muted-foreground/10 transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </div>

          {/* Detail */}
          <div>
            {selected ? (
              <div className="bg-card border border-border rounded-2xl p-5 sticky top-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#087F65]/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-[#087F65]" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selected.name}</div>
                    <div className="text-xs text-muted-foreground">{selected.industry} · {selected.region}</div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">추천 영업 포인트</div>
                    <p className="text-sm text-foreground">{selected.proposition}</p>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">점수 분석</div>
                    {[
                      { label: "상권 성장률 (30%)", value: selected.growthScore, color: "bg-[#18C79A]" },
                      { label: "유동인구 (25%)", value: selected.trafficScore, color: "bg-[#5B6CFF]" },
                      { label: "리뷰 활성도 (20%)", value: selected.reviewScore, color: "bg-[#38BDF8]" },
                      { label: "유사 가맹점 유사도 (25%)", value: selected.similarityScore, color: "bg-[#0E9F6E]" },
                    ].map((s) => (
                      <div key={s.label} className="mb-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                          <span>{s.label}</span>
                          <span className="font-bold">{Math.round(s.value)}</span>
                        </div>
                        <ScoreBar value={s.value} color={s.color} />
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted rounded-xl p-3 text-xs">
                    <div className="font-semibold mb-1">인근 경쟁 현황</div>
                    <div className="text-muted-foreground">
                      반경 500m 내 동업종 2개, {LEGAL_CONFIG.serviceName} 가맹점 없음
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/60">※ 점수는 AI 보조 자료이며 전환을 보장하지 않습니다.</p>
              </div>
            ) : recentApproval?.finalCandidates && recentApproval.finalCandidates.length > 0 ? (
              <div className="bg-card border border-border rounded-2xl p-4 sticky top-0">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-xs font-bold text-muted-foreground">
                    방금 승인된 영업 타겟 {recentApproval.finalCandidates.length}건
                  </p>
                  <button
                    onClick={() => setRecentApproval(null)}
                    className="w-6 h-6 rounded-lg hover:bg-muted flex items-center justify-center flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <ul className="space-y-2 max-h-[65vh] overflow-y-auto">
                  {recentApproval.finalCandidates.map((c, i) => (
                    <li key={`${c.businessName}-${i}`} className="border border-border rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold">{c.businessName}</span>
                        <span className="text-xs font-bold text-[#087F65] tabular-nums">
                          {c.totalScore == null ? "-" : Math.round(c.totalScore)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1">{c.industry ?? "-"} · {c.region}</p>
                      <p className="text-xs text-muted-foreground italic">
                        "{c.proposition ?? "추천 사유가 아직 생성되지 않았습니다."}"
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Target className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">목록에서 타겟을 선택하면 상세 정보를 확인할 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
