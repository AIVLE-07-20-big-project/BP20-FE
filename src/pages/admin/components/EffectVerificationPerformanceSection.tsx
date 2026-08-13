import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Sparkles,
  Store,
  XCircle,
} from "lucide-react";
import type { EffectVerificationRoiSummary } from "../../../entities/effect-verification/effect-verification-roi.types";
import { getEffectVerificationRoiSummary } from "../../../features/effect-verification/api/effectVerificationRoiApi";

const VERDICT_STYLES: Record<string, { label: string; className: string }> = {
  EFFECTIVE: { label: "효과 있음", className: "bg-emerald-50 text-emerald-700" },
  PARTIALLY_EFFECTIVE: { label: "부분 효과", className: "bg-blue-50 text-blue-700" },
  INCONCLUSIVE: { label: "판단 보류", className: "bg-amber-50 text-amber-700" },
  INEFFECTIVE: { label: "효과 미흡", className: "bg-red-50 text-red-700" },
  NOT_EFFECTIVE: { label: "효과 미흡", className: "bg-red-50 text-red-700" },
};

function formatScore(value: number) {
  return `${value.toFixed(1)}점`;
}

function recommendationTypeLabel(type: string) {
  return type === "SALES" ? "매출형" : "리뷰형";
}

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-56 items-center justify-center rounded-3xl border border-border bg-card p-8 shadow-sm">
      {children}
    </section>
  );
}

export function EffectVerificationPerformanceSection() {
  const [summary, setSummary] = useState<EffectVerificationRoiSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSummary(await getEffectVerificationRoiSummary());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "효과 검증 통계를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (isLoading) {
    return (
      <StateCard>
        <div className="text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#5B6CFF]" />
          <p className="mt-3 text-sm font-semibold">효과 검증 현황을 불러오는 중입니다.</p>
        </div>
      </StateCard>
    );
  }

  if (error) {
    return (
      <StateCard>
        <div className="text-center">
          <AlertCircle className="mx-auto h-7 w-7 text-red-500" />
          <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadSummary()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 다시 시도
          </button>
        </div>
      </StateCard>
    );
  }

  if (!summary || summary.total_verified === 0) {
    return (
      <StateCard>
        <div className="text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[#5B6CFF]" />
          <p className="mt-3 font-bold">아직 완료된 효과 검증이 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">매장에서 추천 전략을 실행하고 측정이 완료되면 결과가 표시됩니다.</p>
        </div>
      </StateCard>
    );
  }

  const cards = [
    { label: "검증 완료", value: `${summary.total_verified}건`, icon: CheckCircle2, tone: "bg-blue-50 text-blue-700" },
    { label: "평균 효과 점수", value: formatScore(summary.average_effect_score), icon: BarChart3, tone: "bg-violet-50 text-violet-700" },
    { label: "효과 있음", value: `${summary.effective_count}건`, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "판단 보류", value: `${summary.inconclusive_count}건`, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "효과 미흡", value: `${summary.ineffective_count}건`, icon: XCircle, tone: "bg-red-50 text-red-700" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">전체 검증 요약</h2>
          <p className="mt-1 text-xs text-muted-foreground">추천 실행 전후 지표를 비교한 효과 점수 기준입니다.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadSummary()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" /> 새로고침
        </button>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#5B6CFF]" />
            <h3 className="font-bold">추천 유형별 성과</h3>
          </div>
          <div className="mt-4 space-y-3">
            {summary.type_summaries.map((item) => (
              <div key={item.recommendation_type} className="flex items-center justify-between rounded-xl bg-muted/70 p-4">
                <div>
                  <p className="text-sm font-bold">{recommendationTypeLabel(item.recommendation_type)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">검증 완료 {item.verified_count}건</p>
                </div>
                <p className="text-lg font-black text-[#5B6CFF]">{formatScore(item.average_effect_score)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-[#5B6CFF]" />
            <h3 className="font-bold">매장별 검증 성과</h3>
          </div>
          <div className="mt-4 divide-y divide-border">
            {summary.store_summaries.slice(0, 5).map((item, index) => (
              <div key={item.store_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.store_name || `매장 ${item.store_id}`}</p>
                  <p className="text-xs text-muted-foreground">검증 완료 {item.verified_count}건</p>
                </div>
                <p className="font-bold tabular-nums">{formatScore(item.average_effect_score)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-bold">최근 검증 결과</h3>
          <p className="mt-1 text-xs text-muted-foreground">최근 완료된 추천 효과 검증 내역입니다.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">추천 전략</th>
                <th className="px-4 py-3 font-semibold">매장</th>
                <th className="px-4 py-3 font-semibold">유형</th>
                <th className="px-4 py-3 font-semibold">효과 점수</th>
                <th className="px-4 py-3 font-semibold">판정</th>
                <th className="px-5 py-3 text-right font-semibold">완료일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.recent_results.map((result) => {
                const verdict = VERDICT_STYLES[result.verdict] ?? { label: result.verdict, className: "bg-muted text-muted-foreground" };
                const actionName = result.action_name?.trim()
                  || (result.recommendation_type === "SALES" ? "매출 개선 전략" : "리뷰 개선 전략");
                return (
                  <tr key={`${result.recommendation_id}-${result.verified_date}`} className="transition-colors hover:bg-muted/30">
                    <td className="max-w-80 px-5 py-3.5">
                      <p className="truncate font-semibold" title={actionName}>{actionName}</p>
                    </td>
                    <td className="px-4 py-3.5">{result.store_name || `매장 ${result.store_id}`}</td>
                    <td className="px-4 py-3.5">{recommendationTypeLabel(result.recommendation_type)}</td>
                    <td className="px-4 py-3.5 font-bold tabular-nums">{formatScore(result.effect_score)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${verdict.className}`}>{verdict.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{new Date(result.verified_date).toLocaleDateString("ko-KR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
