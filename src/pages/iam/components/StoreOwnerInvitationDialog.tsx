import { useState } from "react";
import { CheckCircle2, Copy, Store, X } from "lucide-react";
import {
  inviteStoreOwner,
  type InvitationResponse,
} from "../../../features/iam/api/invitationApi";
import { ApiError } from "../../../shared/api/apiClient";
import { PasswordField } from "../../auth/components/PasswordField";

interface StoreOwnerInvitationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (invitation: InvitationResponse) => void;
}

export function StoreOwnerInvitationDialog({
  open,
  onClose,
  onCreated,
}: StoreOwnerInvitationDialogProps) {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [invitation, setInvitation] = useState<InvitationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const closeDialog = () => {
    setEmail("");
    setCurrentPassword("");
    setInvitation(null);
    setLoading(false);
    setCopied(false);
    setError("");
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const createdInvitation = await inviteStoreOwner({
        email: email.trim(),
        currentPassword,
      });
      setInvitation(createdInvitation);
      onCreated?.(createdInvitation);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "점주 초대를 생성하지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!invitation) return;

    try {
      await navigator.clipboard.writeText(invitation.temporaryPassword);
      setCopied(true);
    } catch {
      setError("임시 비밀번호를 복사하지 못했습니다. 직접 선택해 복사해 주세요.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-owner-invitation-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        {invitation ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-[#0E9F6E]" />
            <h2 id="store-owner-invitation-title" className="font-bold">
              점주 초대가 생성되었습니다.
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {invitation.email} 사용자에게 아래 임시 비밀번호를 안전하게 전달해 주세요.
            </p>

            <div className="mt-4 rounded-xl border border-border bg-muted p-3 text-left">
              <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
                일회용 임시 비밀번호
              </div>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all text-sm font-bold">
                  {invitation.temporaryPassword}
                </code>
                <button
                  type="button"
                  onClick={copyTemporaryPassword}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-card px-2 text-xs font-semibold hover:bg-background"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "복사됨" : "복사"}
                </button>
              </div>
            </div>

            <p className="mt-2 text-left text-[11px] leading-relaxed text-amber-700">
              이 비밀번호는 지금 한 번만 표시됩니다. 점주는 회원가입 화면에서 초대 이메일과 함께 입력해야 합니다.
            </p>
            {error && (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-xs text-red-700"
              >
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={closeDialog}
              className="mt-5 h-10 w-full rounded-xl bg-[#246BFD] text-sm font-bold text-white hover:bg-[#1D4ED8]"
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[#246BFD]" />
                <div>
                  <h2 id="store-owner-invitation-title" className="font-bold">
                    점주 초대
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    회원가입용 일회성 임시 비밀번호를 발급합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                aria-label="점주 초대 창 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <label
                  htmlFor="store-owner-invite-email"
                  className="mb-1.5 block text-xs font-semibold"
                >
                  이메일 주소
                </label>
                <input
                  id="store-owner-invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="store-owner@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40 disabled:opacity-60"
                />
              </div>
              <PasswordField
                label="현재 비밀번호"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="초대를 승인하려면 비밀번호를 입력하세요"
                autoComplete="current-password"
                disabled={loading}
              />
              <div className="rounded-xl border border-[#BFD4FF] bg-[#EAF2FF] p-3 text-xs leading-relaxed text-[#1D4ED8]">
                계정 보안을 위해 현재 관리자 비밀번호를 다시 확인합니다. 생성된 임시 비밀번호는 점주에게 별도로 전달해 주세요.
              </div>
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!email.trim() || !currentPassword || loading}
                className="h-10 flex-1 rounded-xl bg-[#246BFD] text-sm font-bold text-white hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                {loading ? "생성 중..." : "초대 생성"}
              </button>
              <button
                type="button"
                onClick={closeDialog}
                disabled={loading}
                className="h-10 flex-1 rounded-xl bg-muted text-sm font-semibold hover:bg-muted-foreground/10 disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
