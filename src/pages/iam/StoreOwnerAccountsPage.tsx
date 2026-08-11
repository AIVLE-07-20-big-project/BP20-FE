import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck, Store, UserPlus, UserRoundCheck, UserX } from "lucide-react";
import type { UserStatus } from "../../entities/user/user.types";
import {
  changeStoreOwnerStatus,
  getStoreOwnerAccounts,
  revealStoreOwnerPersonalData,
  type StoreOwnerAccount,
  type StoreOwnerPersonalData,
} from "../../features/iam/api/accountApi";
import { useTemporaryPersonalData } from "../../features/iam/model/useTemporaryPersonalData";
import { ApiError } from "../../shared/api/apiClient";
import { Badge } from "../../shared/components/Badge";
import { PageShell } from "../../shared/components/PageShell";
import { formatPhoneNumber } from "../../shared/lib/phoneNumber";
import { AccountStatusDialog } from "./components/AccountStatusDialog";
import { InvitationListSection } from "./components/InvitationListSection";
import { PersonalDataRevealDialog } from "./components/PersonalDataRevealDialog";
import { StoreOwnerInvitationDialog } from "./components/StoreOwnerInvitationDialog";

const INVITATION_STEPS = [
  {
    icon: UserPlus,
    title: "초대 정보 입력",
    description: "점주 이메일과 현재 관리자 비밀번호를 입력합니다.",
  },
  {
    icon: KeyRound,
    title: "임시 비밀번호 전달",
    description: "한 번만 표시되는 임시 비밀번호를 점주에게 안전하게 전달합니다.",
  },
  {
    icon: UserRoundCheck,
    title: "점주 회원가입",
    description: "점주가 초대 이메일과 임시 비밀번호로 가입을 완료합니다.",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  return digits.length === 10
    ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
    : value;
}

export function StoreOwnerAccountsPage() {
  const [accounts, setAccounts] = useState<StoreOwnerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [invitationVersion, setInvitationVersion] = useState(0);
  const [statusTarget, setStatusTarget] = useState<{
    account: StoreOwnerAccount;
    nextStatus: UserStatus;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [revealTarget, setRevealTarget] = useState<StoreOwnerAccount | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState("");
  const personalData = useTemporaryPersonalData<StoreOwnerPersonalData>();

  const loadAccounts = async () => {
    setLoading(true);
    setLoadError("");
    try {
      setAccounts(await getStoreOwnerAccounts());
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "점주 계정 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const handleStatusChange = async (password: string) => {
    if (!statusTarget) return;

    setStatusLoading(true);
    setStatusError("");
    try {
      const updated = await changeStoreOwnerStatus(
        statusTarget.account.id,
        statusTarget.nextStatus,
        password,
      );
      setAccounts((current) => current.map((account) => (
        account.id === updated.id ? updated : account
      )));
      setStatusTarget(null);
    } catch (error) {
      setStatusError(
        error instanceof ApiError
          ? error.message
          : "점주 계정 상태를 변경하지 못했습니다.",
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePersonalDataReveal = async (password: string) => {
    if (!revealTarget) return;
    setRevealLoading(true);
    setRevealError("");
    try {
      personalData.reveal(await revealStoreOwnerPersonalData(revealTarget.id, password));
      setRevealTarget(null);
    } catch (error) {
      setRevealError(
        error instanceof ApiError
          ? error.message
          : "점주 개인정보 원문을 조회하지 못했습니다.",
      );
    } finally {
      setRevealLoading(false);
    }
  };

  return (
    <PageShell
      title="점주 계정"
      subtitle="점주 계정과 초대 기반 회원가입 현황을 관리합니다."
      actions={(
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#246BFD] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
        >
          <UserPlus className="h-3.5 w-3.5" />
          점주 초대
        </button>
      )}
    >
      <section className="mb-5 rounded-2xl border border-[#BFD4FF] bg-gradient-to-r from-[#EAF2FF] to-card p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              관리자 공통 기능
            </div>
            <h2 className="text-lg font-bold">새 매장의 점주 계정을 초대하세요.</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              최고 관리자와 일반 관리자 모두 점주를 초대할 수 있습니다. 초대받은 점주는 공개 가입이 아니라 발급된 임시 비밀번호로 계정을 생성합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="h-10 shrink-0 rounded-xl bg-[#246BFD] px-4 text-sm font-bold text-white hover:bg-[#1D4ED8]"
          >
            점주 초대
          </button>
        </div>
        <div className="mt-5 grid gap-3 border-t border-[#BFD4FF] pt-4 md:grid-cols-3">
          {INVITATION_STEPS.map(({ icon: Icon, title, description }, index) => (
            <div key={title} className="rounded-xl bg-white/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <Icon className="h-4 w-4 text-[#246BFD]" />
                <span className="text-[10px] font-bold text-muted-foreground">STEP {index + 1}</span>
              </div>
              <h3 className="text-xs font-bold">{title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-bold">점주 계정 목록</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">가입을 완료한 점주와 연결된 매장을 확인합니다.</p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">총 {accounts.length}명</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {loadError ? (
            <div className="p-8 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
              <button onClick={() => void loadAccounts()} className="mt-3 text-xs font-semibold text-[#246BFD]">
                다시 시도
              </button>
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">점주 계정을 불러오는 중입니다.</div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">가입을 완료한 점주 계정이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["점주", "연락처", "연결 매장", "사업자등록번호", "상태", "가입일", "작업"].map((header) => (
                      <th key={header} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{personalData.getFor(account.id)?.name ?? account.name}</div>
                        <div className="text-xs text-muted-foreground">{personalData.getFor(account.id)?.email ?? account.email}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {personalData.getFor(account.id)?.phoneNumber
                          ? formatPhoneNumber(personalData.getFor(account.id)?.phoneNumber)
                          : account.phoneNumber ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{account.storeName ?? "미등록"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {personalData.getFor(account.id)?.businessNumber
                          ? formatBusinessNumber(personalData.getFor(account.id)!.businessNumber!)
                          : account.businessNumber ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={account.status === "ACTIVE" ? "positive" : "muted"}>
                          {account.status === "ACTIVE" ? "활성" : "비활성"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(account.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (personalData.getFor(account.id)) {
                                personalData.hide();
                                return;
                              }
                              setRevealTarget(account);
                              setRevealError("");
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#246BFD] hover:text-[#1D4ED8]"
                          >
                            {personalData.getFor(account.id)
                              ? <EyeOff className="h-3.5 w-3.5" />
                              : <Eye className="h-3.5 w-3.5" />}
                            {personalData.getFor(account.id) ? "즉시 숨기기" : "원문 확인"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusTarget({
                                account,
                                nextStatus: account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              });
                              setStatusError("");
                            }}
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              account.status === "ACTIVE"
                                ? "text-muted-foreground hover:text-red-600"
                                : "text-[#0E9F6E] hover:text-[#087F65]"
                            }`}
                          >
                            {account.status === "ACTIVE"
                              ? <UserX className="h-3.5 w-3.5" />
                              : <CheckCircle2 className="h-3.5 w-3.5" />}
                            {account.status === "ACTIVE" ? "비활성화" : "활성화"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#BFD4FF] bg-[#F3F7FF] px-3 py-2.5 text-xs text-[#315A9D]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>개인정보는 기본 마스킹되며, 원문 확인 시 비밀번호 재인증과 IAM 조회 기록이 필요합니다. 원문은 60초 후 자동으로 숨겨집니다.</span>
        </div>
      </section>

      <InvitationListSection
        title="점주 초대 현황"
        targetRole="STORE_OWNER"
        refreshKey={invitationVersion}
      />

      <StoreOwnerInvitationDialog
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onCreated={() => setInvitationVersion((version) => version + 1)}
      />

      {statusTarget && (
        <AccountStatusDialog
          accountName={statusTarget.account.name}
          nextStatus={statusTarget.nextStatus}
          loading={statusLoading}
          error={statusError}
          onClose={() => setStatusTarget(null)}
          onConfirm={handleStatusChange}
        />
      )}

      {revealTarget && (
        <PersonalDataRevealDialog
          accountName={revealTarget.name}
          loading={revealLoading}
          error={revealError}
          onClose={() => {
            setRevealTarget(null);
            setRevealError("");
          }}
          onConfirm={handlePersonalDataReveal}
        />
      )}
    </PageShell>
  );
}
