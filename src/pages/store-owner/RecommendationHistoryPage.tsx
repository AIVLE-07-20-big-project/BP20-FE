import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../shared/components/PageShell";
import { getRecommendations, resumeRecommendation } from "../../features/ai-analysis/api/aiAnalysisApi";
import type { AiRecommendationRun } from "../../entities/ai-analysis/ai-analysis.types";

function periodLabel(run: AiRecommendationRun) {
  const start = run.execution_started_at?.slice(0, 10);
  const end = run.execution_ended_at?.slice(0, 10);
  return start && end ? `${start} ~ ${end}` : "승인 시점부터 30일 예정";
}

function isRejected(run: AiRecommendationRun) {
  return run.상태.includes("반려") || run.상태.includes("종료");
}

function isCompleted(run: AiRecommendationRun) {
  return Boolean(run.final_report);
}

function isExecutionRunning(run: AiRecommendationRun) {
  if (!run.execution_started_at || !run.execution_ended_at) return false;
  return Date.now() < new Date(run.execution_ended_at).getTime();
}

function isRunning(run: AiRecommendationRun) {
  return Boolean(!run.대기중_승인 && !isCompleted(run) && !isRejected(run) && !run.상태.includes("효과"));
}

function statusLabel(run: AiRecommendationRun) {
  if (isRejected(run)) return "반려됨";
  if (run.대기중_승인) return "승인 대기 중";
  if (isExecutionRunning(run)) return "실행 중";
  return isCompleted(run) ? "실행 완료" : "실행 중";
}

export function RecommendationHistoryPage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<AiRecommendationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingThreadId, setApprovingThreadId] = useState<string | null>(null);
  const [confirmRun, setConfirmRun] = useState<AiRecommendationRun | null>(null);
  const [category, setCategory] = useState("전체");

  useEffect(() => {
    getRecommendations()
      .then((nextRuns) => setRuns(nextRuns))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "추천 이력을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const approveAgain = async (threadId: string) => {
    setApprovingThreadId(threadId);
    setError("");
    try {
      const updated = await resumeRecommendation(threadId, "approve");
      setRuns((current) => current.map((run) => run.thread_id === threadId ? updated : run));
      setConfirmRun(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "추천 재승인에 실패했습니다.");
    } finally {
      setApprovingThreadId(null);
    }
  };

  const categories = ["전체", "승인 대기 중", "반려됨", "실행 중", "실행 완료"];
  const filteredRuns = category === "전체" ? runs : runs.filter((run) => statusLabel(run) === category);

  return (
    <PageShell
      title="추천 이력"
      subtitle="승인·반려·실행 완료를 포함한 매출 기반 전략 추천 내역입니다."
      actions={(
        <button
          type="button"
          onClick={() => navigate("/store")}
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 대시보드
        </button>
      )}
    >
      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">추천 이력을 불러오는 중입니다.</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{error}</div>
      ) : runs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">저장된 추천 이력이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  category === item ? "bg-[#246BFD] text-white" : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {filteredRuns.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">해당 카테고리의 추천 이력이 없습니다.</div>
          ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filteredRuns.map((run) => (
            <article
              key={run.thread_id}
              onClick={() => (isRejected(run) || run.대기중_승인) && setConfirmRun(run)}
              className={`rounded-2xl border border-border bg-card p-4 ${
                isRejected(run) || run.대기중_승인 ? "cursor-pointer transition-shadow hover:shadow-md" : ""
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#246BFD]/10 px-2 py-0.5 text-[10px] font-bold text-[#246BFD]">매출 기반 추천</span>
                </div>
                <span className={`text-[10px] font-semibold ${
                  isRejected(run) ? "text-red-600" : statusLabel(run) === "실행 완료" ? "text-[#0E9F6E]" : "text-[#246BFD]"
                }`}>{statusLabel(run)}</span>
              </div>
              <h3 className="mb-1 text-sm font-bold">{run.selected_action?.방안 ?? "추천 가능한 전략 없음"}</h3>
              <p className="text-xs text-muted-foreground">진단 유형: {run.문제유형 ?? "확인 불가"}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> 적용 기간: {periodLabel(run)}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">{run.created_at ?? run.thread_id}</div>
            </article>
          ))}
          </div>
          )}
        </>
      )}
      {confirmRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmRun(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-base font-bold">이 방안을 선택하시겠습니까?</h3>
            <p className="mt-2 text-sm text-muted-foreground">{confirmRun.selected_action?.방안 ?? "선택된 대응방안"}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmRun(null)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold">취소</button>
              <button
                type="button"
                disabled={approvingThreadId !== null}
                onClick={() => approveAgain(confirmRun.thread_id)}
                className="rounded-xl bg-[#246BFD] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {approvingThreadId ? "승인 처리 중..." : "선택 및 승인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
