import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../app/providers/useAuth";
import { PageShell } from "../../shared/components/PageShell";
import { InvitationListSection } from "./components/InvitationListSection";

export function InvitationsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <PageShell
      title="초대 관리"
      subtitle={
        isSuperAdmin
          ? "관리자와 점주 초대를 통합 조회하고 대기 중인 초대를 취소합니다."
          : "점주 초대를 조회하고 대기 중인 초대를 취소합니다."
      }
    >
      <div className="rounded-2xl border border-[#BFD4FF] bg-[#EAF2FF] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#246BFD]">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">역할 기반 초대 관리 범위</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#1D4ED8]">
              {isSuperAdmin
                ? "최고 관리자는 관리자 초대와 점주 초대를 모두 확인하고 취소할 수 있습니다."
                : "일반 관리자는 점주 초대만 확인하고 취소할 수 있으며 관리자 초대 정보에는 접근할 수 없습니다."}
            </p>
          </div>
        </div>
      </div>

      <InvitationListSection title={isSuperAdmin ? "전체 초대 현황" : "점주 초대 현황"} />
    </PageShell>
  );
}
