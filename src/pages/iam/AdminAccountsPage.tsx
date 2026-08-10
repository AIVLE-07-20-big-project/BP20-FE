import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Eye, EyeOff, Shield, ShieldCheck, UserPlus, UserX, X } from "lucide-react";
import type { UserStatus } from "../../entities/user/user.types";
import {
  changeAdminStatus,
  getAdminAccounts,
  revealAdminPersonalData,
  type AdminAccount,
  type AdminPersonalData,
} from "../../features/iam/api/accountApi";
import { useTemporaryPersonalData } from "../../features/iam/model/useTemporaryPersonalData";
import {
  inviteAdmin,
  type InvitationResponse,
} from "../../features/iam/api/invitationApi";
import { ApiError } from "../../shared/api/apiClient";
import { Badge } from "../../shared/components/Badge";
import { PageShell } from "../../shared/components/PageShell";
import { formatPhoneNumber } from "../../shared/lib/phoneNumber";
import { PasswordField } from "../auth/components/PasswordField";
import { AccountStatusDialog } from "./components/AccountStatusDialog";
import { InvitationListSection } from "./components/InvitationListSection";
import { PersonalDataRevealDialog } from "./components/PersonalDataRevealDialog";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [invitation, setInvitation] = useState<InvitationResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [invitationVersion, setInvitationVersion] = useState(0);
  const [statusTarget, setStatusTarget] = useState<{
    account: AdminAccount;
    nextStatus: UserStatus;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [revealTarget, setRevealTarget] = useState<AdminAccount | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState("");
  const personalData = useTemporaryPersonalData<AdminPersonalData>();

  const loadAccounts = async () => {
    setLoading(true);
    setLoadError("");
    try {
      setAccounts(await getAdminAccounts());
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : "관리자 계정 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const closeInvite = () => {
    setShowInvite(false);
    setInvitation(null);
    setCopied(false);
    setInviteEmail("");
    setCurrentPassword("");
    setInviteError("");
  };

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    try {
      const created = await inviteAdmin({
        email: inviteEmail.trim(),
        currentPassword,
      });
      setInvitation(created);
      setInvitationVersion((version) => version + 1);
    } catch (error) {
      setInviteError(
        error instanceof ApiError
          ? error.message
          : "관리자 초대를 생성하지 못했습니다.",
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const handleStatusChange = async (password: string) => {
    if (!statusTarget) return;
    setStatusLoading(true);
    setStatusError("");
    try {
      const updated = await changeAdminStatus(
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
          : "관리자 계정 상태를 변경하지 못했습니다.",
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
      personalData.reveal(await revealAdminPersonalData(revealTarget.id, password));
      setRevealTarget(null);
    } catch (error) {
      setRevealError(
        error instanceof ApiError
          ? error.message
          : "관리자 개인정보 원문을 조회하지 못했습니다.",
      );
    } finally {
      setRevealLoading(false);
    }
  };

  return (
    <PageShell
      title="관리자 계정"
      subtitle="최고 관리자가 일반 관리자 계정과 관리자 초대를 관리합니다."
      actions={(
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#246BFD] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
        >
          <UserPlus className="h-3.5 w-3.5" />
          관리자 초대
        </button>
      )}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loadError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button onClick={() => void loadAccounts()} className="mt-3 text-xs font-semibold text-[#246BFD]">
              다시 시도
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">관리자 계정을 불러오는 중입니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["관리자", "연락처", "권한", "상태", "가입일", "최근 변경일", "작업"].map((header) => (
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
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5B6CFF]/10 text-xs font-bold text-[#5B6CFF]">
                          {(personalData.getFor(account.id)?.name ?? account.name)[0]}
                        </div>
                        <div>
                          <div className="font-semibold">{personalData.getFor(account.id)?.name ?? account.name}</div>
                          <div className="text-xs text-muted-foreground">{personalData.getFor(account.id)?.email ?? account.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {personalData.getFor(account.id)?.phoneNumber
                        ? formatPhoneNumber(personalData.getFor(account.id)?.phoneNumber)
                        : account.phoneNumber ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={account.role === "SUPER_ADMIN" ? "indigo" : "muted"}>
                        {account.role === "SUPER_ADMIN" ? "최고 관리자" : "관리자"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={account.status === "ACTIVE" ? "positive" : "muted"}>
                        {account.status === "ACTIVE" ? "활성" : "비활성"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(account.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(account.updatedAt)}</td>
                    <td className="px-4 py-3">
                      {account.role === "ADMIN" && (
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
                      )}
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

      <InvitationListSection
        title="관리자 초대 현황"
        targetRole="ADMIN"
        refreshKey={invitationVersion}
      />

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            {invitation ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-[#0E9F6E]" />
                <h2 className="font-bold">관리자 초대가 생성되었습니다.</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {invitation.email} 사용자에게 임시 비밀번호를 안전하게 전달해 주세요.
                </p>
                <div className="mt-4 rounded-xl border border-border bg-muted p-3 text-left">
                  <div className="mb-1 text-[11px] font-semibold text-muted-foreground">일회용 임시 비밀번호</div>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all text-sm font-bold">
                      {invitation.temporaryPassword}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(invitation.temporaryPassword);
                        setCopied(true);
                      }}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-card px-2 text-xs font-semibold"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "복사됨" : "복사"}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-left text-[11px] text-amber-700">
                  임시 비밀번호는 지금 한 번만 표시되며 초대 만료 전까지 한 번만 사용할 수 있습니다.
                </p>
                <button onClick={closeInvite} className="mt-5 h-10 w-full rounded-xl bg-[#246BFD] text-sm font-bold text-white">
                  확인
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#5B6CFF]" />
                    <div>
                      <h2 className="font-bold">관리자 초대</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">일반 관리자 계정을 초대합니다.</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeInvite} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="admin-invite-email" className="mb-1.5 block text-xs font-semibold">이메일 주소</label>
                    <input
                      id="admin-invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      required
                      disabled={inviteLoading}
                      placeholder="admin@example.com"
                      className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40"
                    />
                  </div>
                  <PasswordField
                    label="현재 최고 관리자 비밀번호"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    autoComplete="current-password"
                    disabled={inviteLoading}
                  />
                  {inviteError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{inviteError}</div>
                  )}
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="submit"
                    disabled={!inviteEmail.trim() || !currentPassword || inviteLoading}
                    className="h-10 flex-1 rounded-xl bg-[#246BFD] text-sm font-bold text-white disabled:opacity-50"
                  >
                    {inviteLoading ? "생성 중..." : "초대 생성"}
                  </button>
                  <button type="button" onClick={closeInvite} disabled={inviteLoading} className="h-10 flex-1 rounded-xl bg-muted text-sm font-semibold">
                    취소
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
