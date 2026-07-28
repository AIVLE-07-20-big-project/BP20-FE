import { useState } from "react";
import type { UserStatus } from "../../../entities/user/user.types";
import { PasswordField } from "../../auth/components/PasswordField";

interface AccountStatusDialogProps {
  accountName: string;
  nextStatus: UserStatus;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (currentPassword: string) => Promise<void>;
}

export function AccountStatusDialog({
  accountName,
  nextStatus,
  loading,
  error,
  onClose,
  onConfirm,
}: AccountStatusDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const activating = nextStatus === "ACTIVE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm(currentPassword);
        }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <h2 className="font-bold">계정 {activating ? "활성화" : "비활성화"}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">{accountName}</strong> 계정을{" "}
          {activating ? "다시 활성화합니다." : "비활성화하면 다음 인증 요청부터 접근할 수 없습니다."}
        </p>
        <div className="mt-4">
          <PasswordField
            label="현재 관리자 비밀번호"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={!currentPassword || loading}
            className={`h-10 flex-1 rounded-xl text-sm font-bold text-white disabled:opacity-50 ${
              activating
                ? "bg-[#0E9F6E] hover:bg-[#087F65]"
                : "bg-[#D92D20] hover:bg-[#B42318]"
            }`}
          >
            {loading ? "처리 중..." : activating ? "활성화" : "비활성화"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 flex-1 rounded-xl bg-muted text-sm font-semibold disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
