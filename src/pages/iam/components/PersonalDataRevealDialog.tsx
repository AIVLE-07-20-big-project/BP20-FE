import { Eye, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { PasswordField } from "../../auth/components/PasswordField";

interface PersonalDataRevealDialogProps {
  accountName: string;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void> | void;
}

export function PersonalDataRevealDialog({
  accountName,
  loading,
  error,
  onClose,
  onConfirm,
}: PersonalDataRevealDialogProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!password || loading) return;
    void onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#246BFD]/10 text-[#246BFD]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">개인정보 원문 확인</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {accountName} 계정의 원문을 확인하려면 현재 비밀번호로 재인증해 주세요.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          조회 성공 시 원문은 60초 후 자동으로 다시 마스킹되며 조회 기록이 IAM 로그에 남습니다.
        </div>

        <PasswordField
          label="현재 비밀번호"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={loading}
        />

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            disabled={!password || loading}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#246BFD] text-sm font-bold text-white disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            {loading ? "재인증 중..." : "60초간 원문 확인"}
          </button>
          <button type="button" onClick={onClose} disabled={loading} className="h-10 flex-1 rounded-xl bg-muted text-sm font-semibold">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
