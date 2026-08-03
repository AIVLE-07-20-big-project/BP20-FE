import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import type { EffectVerificationRoiSummary } from "../../../entities/effect-verification/effect-verification-roi.types";
import { getEffectVerificationRoiSummary } from "../../../features/effect-verification/api/effectVerificationRoiApi";

const VERDICT_LABELS: Record<string, string> = {
  EFFECTIVE: "효과 있음",
  INCONCLUSIVE: "판단 보류",
  PARTIALLY_EFFECTIVE: "부분 효과",
  INEFFECTIVE: "효과 미흡",
  NOT_EFFECTIVE: "효과 미흡",
};

function formatScore(value: number) {
  return `${value.toFixed(1)}점`;
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
      setError(
        requestError instanceof Error
          ? requestError.message
          : "효과 검증 통계를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (isLoading) {
    return (
      <section className="bg-card border border-border rounded-2xl p-5 mt-4">
        <h3 className="font-bold">추천 효과 검증 현황</h3>
        <p className="text-sm text-muted-foreground mt-3">검증 통계를 불러오는 중입니다.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-card border border-border rounded-2xl p-5 mt-4">
        <h3 className="font-bold">추천 효과 검증 현황</h3>
        <div className="flex items-center justify-between gap-3 mt-3">
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
          <button
            type="button"
            onClick={() => void loadSummary()}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  if (!summary || summary.total_verified === 0) {
    return (
      <section className="bg-card border border-border rounded-2xl p-5 mt-4">
        <h3 className="font-bold">추천 효과 검증 현황</h3>
        <p className="text-sm text-muted-foreground mt-3">
          아직 완료된 효과 검증 결과가 없습니다.
        </p>
      </section>
    );
  }

  const cards = [
    { label: "검증 완료", value: `${summary.total_verified}건`, icon: CheckCircle2, color: "text-[#2563EB]" },
    { label: "평균 효과 점수", value: formatScore(summary.average_effect_score), icon: CheckCircle2, color: "text-[#5B6CFF]" },
    { label: "효과 있음", value: `${summary.effective_count}건`, icon: CheckCircle2, color: "text-[#0E9F6E]" },
    { label: "판단 보류", value: `${summary.inconclusive_count}건`, icon: Clock3, color: "text-amber-600" },
    { label: "효과 미흡", value: `${summary.ineffective_count}건`, icon: XCircle, color: "text-red-600" },
  ];

  return (
    <section className="bg-card border border-border rounded-2xl p-5 mt-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold">추천 효과 검증 현황</h3>
          <p className="text-xs text-muted-foreground mt-1">
            추천 실행 전후 지표를 비교한 효과 점수 통계이며, 금액 기준 ROI와는 별도입니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSummary()}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          새로고침
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-muted p-4">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
            <div className="text-xl font-black mt-2 tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="rounded-2xl border border-border p-4">
          <h4 className="text-sm font-bold mb-3">추천 유형별 성과</h4>
          <div className="space-y-2">
            {summary.type_summaries.map((item) => (
              <div key={item.recommendation_type} className="flex items-center justify-between text-sm">
                <span>{item.recommendation_type === "SALES" ? "매출형" : "리뷰형"}</span>
                <span className="text-muted-foreground">
                  {item.verified_count}건 · <strong className="text-foreground">{formatScore(item.average_effect_score)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4">
          <h4 className="text-sm font-bold mb-3">매장별 성과</h4>
          <div className="space-y-2">
            {summary.store_summaries.slice(0, 5).map((item) => (
              <div key={item.store_id} className="flex items-center justify-between text-sm">
                <span>매장 {item.store_id}</span>
                <span className="text-muted-foreground">
                  {item.verified_count}건 · <strong className="text-foreground">{formatScore(item.average_effect_score)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <h4 className="text-sm font-bold mb-3">최근 검증 결과</h4>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3">추천 ID</th>
              <th className="py-2 pr-3">매장</th>
              <th className="py-2 pr-3">유형</th>
              <th className="py-2 pr-3">효과 점수</th>
              <th className="py-2 pr-3">판정</th>
              <th className="py-2">검증 완료일</th>
            </tr>
          </thead>
          <tbody>
            {summary.recent_results.map((result) => (
              <tr key={`${result.recommendation_id}-${result.verified_date}`} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-3 font-medium">{result.recommendation_id}</td>
                <td className="py-2.5 pr-3">매장 {result.store_id}</td>
                <td className="py-2.5 pr-3">{result.recommendation_type === "SALES" ? "매출형" : "리뷰형"}</td>
                <td className="py-2.5 pr-3 font-bold">{formatScore(result.effect_score)}</td>
                <td className="py-2.5 pr-3">{VERDICT_LABELS[result.verdict] ?? result.verdict}</td>
                <td className="py-2.5">{new Date(result.verified_date).toLocaleDateString("ko-KR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
