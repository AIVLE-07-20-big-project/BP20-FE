import { PageShell } from "../../shared/components/PageShell";
import { EffectVerificationPerformanceSection } from "./components/EffectVerificationPerformanceSection";

export function ROIPage() {
  return (
    <PageShell
      title="효과 검증 현황"
      subtitle="매장에 제공된 AI 추천의 실행 결과와 실제 효과를 한눈에 확인합니다."
    >
      <EffectVerificationPerformanceSection />
    </PageShell>
  );
}
