import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricCard } from "../../shared/components/MetricCard";
import { getEffectVerificationRoiSummary } from "../../features/effect-verification/api/effectVerificationRoiApi";
import type { EffectVerificationRoiSummary } from "../../entities/effect-verification/effect-verification-roi.types";
import { getMerchantMonitoring, type MerchantMonitoringItem } from "../../features/admin/api/merchantMonitoringApi";

export function PortfolioDashboard() {
  const navigate = useNavigate();
  const [verification, setVerification] = useState<EffectVerificationRoiSummary | null>(null);
  const [merchants, setMerchants] = useState<MerchantMonitoringItem[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(true);

  useEffect(() => {
    getEffectVerificationRoiSummary()
      .then(setVerification)
      .catch(() => setVerification(null));
  }, []);

  useEffect(() => {
    getMerchantMonitoring()
      .then((response) => setMerchants(response.merchants))
      .catch(() => setMerchants([]))
      .finally(() => setMerchantsLoading(false));
  }, []);

  const inactiveStores = verification
    ? Math.max(verification.total_stores - verification.ai_active_stores, 0)
    : null;
  const effectiveRate = verification && verification.total_verified > 0
    ? (verification.effective_count / verification.total_verified) * 100
    : null;
  const recommendationData = verification?.type_summaries.map((item) => ({
    type: item.recommendation_type === "SALES" ? "매출" : "리뷰",
    count: item.verified_count,
  })) ?? [];
  const statusData = verification ? [
    { label: "AI 활성", count: verification.ai_active_stores, color: "#0E9F6E", bg: "bg-emerald-50", text: "text-emerald-700" },
    { label: "AI 미활성", count: inactiveStores ?? 0, color: "#98A2B3", bg: "bg-slate-50", text: "text-slate-700" },
    { label: "추천 실행", count: verification.executed_recommendations, color: "#5B6CFF", bg: "bg-indigo-50", text: "text-indigo-700" },
  ] : [];

  const kpis = verification ? [
    { label: "전체 가맹점", value: `${verification.total_stores.toLocaleString()}개` },
    { label: "AI 활성", value: `${verification.ai_active_stores.toLocaleString()}개` },
    { label: "AI 미활성", value: `${inactiveStores?.toLocaleString() ?? "-"}개` },
    { label: "추천 실행", value: `${verification.executed_recommendations.toLocaleString()}건` },
    { label: "추천 실행률", value: `${verification.execution_rate.toFixed(1)}%` },
    { label: "검증 완료 추천", value: `${verification.total_verified.toLocaleString()}건` },
    { label: "추천 효과율", value: effectiveRate == null ? "-" : `${effectiveRate.toFixed(1)}%` },
    { label: "평균 효과 점수", value: verification.total_verified ? verification.average_effect_score.toFixed(1) : "-" },
  ] : [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-8 max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">가맹점 운영 현황</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18C79A] animate-pulse" />
              <span className="text-xs text-muted-foreground">저장된 운영 데이터 기준</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
          {kpis.length ? kpis.map((kpi) => (
            <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} mini />
          )) : (
            <div className="col-span-full rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              운영 데이터를 불러오는 중입니다.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-4">AI 운영 현황</h3>
            <div className="space-y-3 mb-4">
              {statusData.map((status) => (
                <div key={status.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-semibold ${status.text}`}>{status.label}</span>
                    <span className="font-bold tabular-nums">{status.count.toLocaleString()}개</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${verification?.total_stores ? (status.count / verification.total_stores) * 100 : 0}%`,
                        background: status.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {statusData.map((status) => (
                <div key={status.label} className={`flex-1 ${status.bg} rounded-xl p-2.5 text-center`}>
                  <div className={`text-lg font-black ${status.text}`}>{status.count.toLocaleString()}</div>
                  <div className="text-[11px] text-muted-foreground">{status.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">추천 유형별 검증 현황</h3>
                <p className="text-xs text-muted-foreground">저장된 효과 검증 결과 기준</p>
              </div>
              <button onClick={() => navigate("/admin/verify")} className="text-xs text-[#087F65] font-semibold hover:underline flex items-center gap-0.5">
                자세히 보기 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {recommendationData.length ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recommendationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                    <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="검증 건수" fill="#5B6CFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">아직 유형별 검증 결과가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">최근 추천 효과 검증</h3>
              <p className="text-xs text-muted-foreground">실제 실행 후 저장된 검증 결과</p>
            </div>
            <button onClick={() => navigate("/admin/verify")} className="text-xs text-[#087F65] font-semibold hover:underline flex items-center gap-0.5">
              전체 보기 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {verification?.recent_results.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {verification.recent_results.slice(0, 3).map((result) => (
                <div key={`${result.recommendation_id}-${result.verified_date}`} className="rounded-xl bg-muted/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">매장 {result.store_id}</span>
                    <span className="text-[11px] text-muted-foreground">{result.verified_date}</span>
                  </div>
                  <div className="text-sm font-bold">{result.recommendation_type === "SALES" ? "매출 추천" : "리뷰 추천"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{result.verdict}</div>
                  <div className="mt-2 text-base font-black text-[#0E9F6E]">효과 점수 {result.effect_score.toFixed(1)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">아직 저장된 추천 효과 검증 결과가 없습니다.</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">전체 가맹점</h3>
              <p className="text-xs text-muted-foreground">MySQL에 저장된 가맹점과 AI 운영 현황</p>
            </div>
            <span className="text-xs text-muted-foreground">{merchants.length}개</span>
          </div>
          {merchantsLoading ? (
            <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">가맹점 데이터를 불러오는 중입니다.</p>
          ) : merchants.length === 0 ? (
            <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">저장된 가맹점이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="pb-3 pr-4">가맹점</th><th className="pb-3 pr-4">점주</th><th className="pb-3 pr-4">주소</th><th className="pb-3 pr-4">업종</th><th className="pb-3 pr-4 text-right">AI</th><th className="pb-3 pr-4 text-right">분석</th><th className="pb-3 pr-4 text-right">추천 실행률</th><th className="pb-3 text-right">검증</th></tr></thead>
                <tbody>{merchants.map((merchant) => <tr key={merchant.id} className="border-b border-border/60 last:border-0"><td className="py-3 pr-4 font-semibold">{merchant.name}</td><td className="py-3 pr-4">{merchant.owner}</td><td className="py-3 pr-4 text-muted-foreground">{merchant.address}</td><td className="py-3 pr-4">{merchant.category}</td><td className="py-3 pr-4 text-right">{merchant.aiActive ? "활성" : "비활성"}</td><td className="py-3 pr-4 text-right">{merchant.analysisCount}건</td><td className="py-3 pr-4 text-right">{merchant.executionRate.toFixed(1)}%</td><td className="py-3 text-right">{merchant.verifiedRecommendations == null ? "-" : `${merchant.verifiedRecommendations}건`}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
