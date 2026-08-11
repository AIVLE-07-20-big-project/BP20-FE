import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/useAuth";
import { AuthLayout } from "./components/AuthLayout";
import { PasswordField } from "./components/PasswordField";
import { evaluatePassword } from "../../features/auth/model/passwordPolicy";
import {
  activateRecaptchaBadge,
  executeRecaptcha,
  initializeRecaptcha,
} from "../../features/auth/lib/recaptchaV3";
import { RecaptchaNotice } from "../../shared/components/RecaptchaNotice";
import { RECAPTCHA_SITE_KEY } from "../../shared/config/runtimeEnv";

const PRIVACY_POLICY_VERSION = "2026-08-03";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const passwordPolicy = evaluatePassword(password);
  const passwordMatches = password.length > 0 && password === passwordConfirmation;

  useEffect(() => {
    const deactivateBadge = activateRecaptchaBadge();
    void initializeRecaptcha().catch(() => {
      // 회원가입 요청 시 사용자에게 초기화 오류를 안내한다.
    });
    return deactivateBadge;
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !temporaryPassword || !name.trim() || !password) {
      setError("필수 항목을 모두 입력해 주세요.");
      return;
    }
    if (!passwordPolicy.valid) {
      setError("새 비밀번호가 보안 규칙을 충족하지 않습니다.");
      return;
    }
    if (!passwordMatches) {
      setError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (!privacyConsent) {
      setError("필수 개인정보 수집 및 이용에 동의해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    let captchaToken: string | null;
    try {
      captchaToken = await executeRecaptcha("signup");
    } catch {
      setLoading(false);
      setError("자동입력 방지 확인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const result = await signup({
      email: email.trim(),
      temporaryPassword,
      password,
      name: name.trim(),
      phoneNumber: phoneNumber.trim() || null,
      privacyConsent,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      captchaToken,
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
          <span className={passwordPolicy.length ? "text-[#0E9F6E]" : "text-muted-foreground"}>
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
            12~72자
          </span>
          <span className={passwordPolicy.characterGroups ? "text-[#0E9F6E]" : "text-muted-foreground"}>
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
            영문 대·소문자, 숫자, 특수문자 중 3종 이상
          </span>
          <span className={passwordPolicy.noWhitespace && passwordPolicy.noTripleRepeat ? "text-[#0E9F6E]" : "text-muted-foreground"}>
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
            공백 및 동일 문자 3회 연속 사용 금지
          </span>
          <span className={passwordMatches ? "text-[#0E9F6E]" : "text-muted-foreground"}>
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
            비밀번호 일치
          </span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          초대가 만료되었거나 이메일 또는 임시 비밀번호를 전달받지 못했다면 관리자에게 문의해 주세요.
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(event) => setPrivacyConsent(event.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 rounded accent-[#246BFD]"
            />
            <span className="text-xs font-semibold leading-relaxed">
              <span className="text-[#246BFD]">[필수]</span> 개인정보 수집 및 이용에 동의합니다.
            </span>
          </label>
          <details className="mt-3 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">
            <summary className="cursor-pointer font-semibold text-foreground">수집·이용 내용 보기</summary>
            <dl className="mt-2 grid grid-cols-[84px_1fr] gap-x-3 gap-y-1">
              <dt>필수 항목</dt><dd>이메일, 이름, 새 비밀번호, 동의 버전·일시, 접속 IP</dd>
              <dt>선택 항목</dt><dd>연락처</dd>
              <dt>이용 목적</dt><dd>초대 확인, 계정 생성, 본인 인증, 권한·보안 관리</dd>
              <dt>보유 기간</dt><dd>계정 이용 종료 시까지. 동의 기록은 종료 후 3년</dd>
              <dt>동의 거부</dt><dd>동의를 거부할 수 있으나 계정 생성과 서비스 이용이 제한됩니다.</dd>
            </dl>
            <Link to="/privacy-policy" target="_blank" className="mt-2 inline-block font-semibold text-[#246BFD] hover:underline">
              개인정보 처리방침 전문 보기
            </Link>
          </details>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        {RECAPTCHA_SITE_KEY && (
          <RecaptchaNotice />
        )}

        <button
          type="submit"
          disabled={loading || !passwordPolicy.valid || !passwordMatches || !privacyConsent}
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
