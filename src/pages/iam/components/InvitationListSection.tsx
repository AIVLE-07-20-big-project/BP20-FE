import { useEffect, useMemo, useState } from "react";
import { Ban, RefreshCw } from "lucide-react";
import type { UserRole } from "../../../entities/user/user.types";
import {
  getInvitations,
  revokeInvitation,
  type InvitationStatus,
  type InvitationSummary,
} from "../../../features/iam/api/invitationApi";
import { ApiError } from "../../../shared/api/apiClient";
import { Badge } from "../../../shared/components/Badge";
import { PasswordField } from "../../auth/components/PasswordField";

const STATUS_LABEL: Record<InvitationStatus, string> = {
  PENDING: "대기",
  ACCEPTED: "수락",
  EXPIRED: "만료",
  REVOKED: "취소",
};

const STATUS_VARIANT: Record<InvitationStatus, "warning" | "positive" | "muted" | "negative"> = {
  PENDING: "warning",
  ACCEPTED: "positive",
  EXPIRED: "muted",
  REVOKED: "negative",
};

interface InvitationListSectionProps {
  title: string;
  targetRole?: Extract<UserRole, "ADMIN" | "STORE_OWNER">;
  refreshKey?: number;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function InvitationListSection({
  title,
  targetRole,
  refreshKey = 0,
}: InvitationListSectionProps) {
  const [invitations, setInvitations] = useState<InvitationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<InvitationSummary | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState("");

  const loadInvitations = async () => {
    setLoading(true);
    setError("");
    try {
      setInvitations(await getInvitations());
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "초대 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvitations();
  }, [refreshKey]);

  const visibleInvitations = useMemo(
    () => targetRole
      ? invitations.filter((invitation) => invitation.targetRole === targetRole)
      : invitations,
    [invitations, targetRole],
  );

  const handleRevoke = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!revokeTarget) return;

    setRevokeLoading(true);
    setRevokeError("");
    try {
      const updated = await revokeInvitation(revokeTarget.id, currentPassword);
      setInvitations((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )));
      setRevokeTarget(null);
      setCurrentPassword("");
    } catch (requestError) {
      setRevokeError(
        requestError instanceof ApiError
          ? requestError.message
          : "초대를 취소하지 못했습니다.",
      );
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            최근 초대 100건을 기준으로 표시합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadInvitations()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {error ? (
          <div className="p-6 text-center text-sm text-red-600">{error}</div>
        ) : loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">초대 목록을 불러오는 중입니다.</div>
        ) : visibleInvitations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">표시할 초대가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["이메일", "역할", "초대자", "상태", "생성일", "만료일", "작업"].map((header) => (
                    <th key={header} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleInvitations.map((invitation) => (
                  <tr key={invitation.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{invitation.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={invitation.targetRole === "ADMIN" ? "indigo" : "mint"}>
                        {invitation.targetRole === "ADMIN" ? "관리자" : "점주"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{invitation.invitedByName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[invitation.status]}>
                        {STATUS_LABEL[invitation.status]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(invitation.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(invitation.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      {invitation.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => {
                            setRevokeTarget(invitation);
                            setRevokeError("");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-red-600"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          취소
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleRevoke}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="font-bold">초대 취소</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {revokeTarget.email} 초대를 취소합니다. 취소한 임시 비밀번호는 다시 사용할 수 없습니다.
            </p>
            <div className="mt-4">
              <PasswordField
                label="현재 관리자 비밀번호"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                disabled={revokeLoading}
              />
            </div>
            {revokeError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {revokeError}
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={!currentPassword || revokeLoading}
                className="h-10 flex-1 rounded-xl bg-[#D92D20] text-sm font-bold text-white hover:bg-[#B42318] disabled:opacity-50"
              >
                {revokeLoading ? "취소 중..." : "초대 취소"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRevokeTarget(null);
                  setCurrentPassword("");
                }}
                disabled={revokeLoading}
                className="h-10 flex-1 rounded-xl bg-muted text-sm font-semibold disabled:opacity-50"
              >
                닫기
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
