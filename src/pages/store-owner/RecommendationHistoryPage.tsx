import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../shared/components/PageShell";
import { getRecommendations } from "../../features/ai-analysis/api/aiAnalysisApi";
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

function isRunning(run: AiRecommendationRun) {
  return Boolean(!run.대기중_승인 && !isCompleted(run) && !isRejected(run) && !run.상태.includes("효과"));
}

function statusLabel(run: AiRecommendationRun) {
  return isCompleted(run) ? "실행 완료" : "실행 중";
}

export function RecommendationHistoryPage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<AiRecommendationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getRecommendations()
      .then((nextRuns) => setRuns(nextRuns.filter((run) => isCompleted(run) || isRunning(run))))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "추천 이력을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell
      title="추천 이력"
      subtitle="실행 완료 또는 현재 실행 중인 매출 기반 전략 추천 내역입니다."
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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {runs.map((run) => (
            <article key={run.thread_id} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#246BFD]/10 px-2 py-0.5 text-[10px] font-bold text-[#246BFD]">매출 기반 추천</span>
                  {run.store_id && <span className="text-[10px] text-muted-foreground">매장 {run.store_id}</span>}
                </div>
                <span className={`text-[10px] font-semibold ${isCompleted(run) ? "text-[#0E9F6E]" : "text-[#246BFD]"}`}>{statusLabel(run)}</span>
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
    </PageShell>
  );
}
