import { useEffect, useState } from "react";
import { Target, Info } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { ApiError } from "../../shared/api/apiClient";
import { fetchSalesTargets, updateSalesTargetPipelineStatus } from "../../features/sales-target/api/salesTargetApi";
import type { PipelineStatus, SalesTargetBusiness } from "../../entities/sales-target/sales-target.types";

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSalesTargets()
      .then((data) => {
        if (cancelled) return;
        setTargets(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "영업 타겟을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-5 text-xs text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      ) : targets.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          아직 추천된 영업 타겟이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            {targets.map((t) => {
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
                    <div className="text-muted-foreground">반경 500m 내 동업종 2개, BP20 가맹점 없음</div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/60">※ 점수는 AI 보조 자료이며 전환을 보장하지 않습니다.</p>
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
