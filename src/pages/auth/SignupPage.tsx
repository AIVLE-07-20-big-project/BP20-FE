import { useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { AuthLayout } from "./components/AuthLayout";
import { PasswordField } from "./components/PasswordField";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const passwordLengthValid = password.length >= 12 && password.length <= 72;
  const passwordMatches = password.length > 0 && password === passwordConfirmation;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !temporaryPassword || !name.trim() || !password) {
      setError("필수 항목을 모두 입력해 주세요.");
      return;
    }
    if (!passwordLengthValid) {
      setError("새 비밀번호는 12자 이상 72자 이하로 입력해 주세요.");
      return;
    }
    if (!passwordMatches) {
      setError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await signup({
      email: email.trim(),
      temporaryPassword,
      password,
      name: name.trim(),
      phoneNumber: phoneNumber.trim() || null,
    });
    setLoading(false);

    if (result.ok && result.user) {
      navigate(result.user.role === "STORE_OWNER" ? "/store" : "/admin", {
        replace: true,
      });
      return;
    }
    setError(result.error ?? "회원가입에 실패했습니다.");
  };

  return (
    <AuthLayout contentWidth="md">
      <Link
        to="/login"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        로그인으로 돌아가기
      </Link>

      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF2FF]">
        <KeyRound className="h-6 w-6 text-[#246BFD]" />
      </div>
      <h1 className="mb-1 text-2xl font-bold">초대 기반 회원가입</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        초대받은 이메일과 일회용 임시 비밀번호를 입력하고 새 비밀번호를 설정해 주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold">
              초대받은 이메일 <span className="text-red-500">*</span>
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="store-owner@bp20.com"
              autoComplete="email"
              disabled={loading}
              className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm focus:border-[#246BFD] focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="signup-name" className="mb-1.5 block text-xs font-semibold">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="홍길동"
              autoComplete="name"
              maxLength={50}
              disabled={loading}
              className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm focus:border-[#246BFD] focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40 disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-phone" className="mb-1.5 block text-xs font-semibold">
            연락처
          </label>
          <input
            id="signup-phone"
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="010-1234-5678"
            autoComplete="tel"
            maxLength={30}
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm focus:border-[#246BFD] focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40 disabled:opacity-60"
          />
        </div>

        <PasswordField
          label="일회용 임시 비밀번호 *"
          value={temporaryPassword}
          onChange={setTemporaryPassword}
          placeholder="관리자가 전달한 임시 비밀번호"
          autoComplete="one-time-code"
          disabled={loading}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            label="새 비밀번호 *"
            value={password}
            onChange={setPassword}
            placeholder="12~72자"
            autoComplete="new-password"
            disabled={loading}
          />
          <PasswordField
            label="새 비밀번호 확인 *"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
            disabled={loading}
          />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <span className={passwordLengthValid ? "text-[#0E9F6E]" : "text-muted-foreground"}>
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
            12~72자
          </span>
          <span className={passwordMatches ? "text-[#0E9F6E]" : "text-muted-foreground"}>
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
            비밀번호 일치
          </span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          초대가 만료되었거나 이메일 또는 임시 비밀번호를 전달받지 못했다면 관리자에게 문의해 주세요.
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#246BFD] text-sm font-bold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {loading ? "가입 처리 중..." : "회원가입 완료"}
        </button>
      </form>
    </AuthLayout>
  );
}
