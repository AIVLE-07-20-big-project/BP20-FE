import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Store } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import type { UserRole } from "../../entities/user/user.types";
import {
  activateRecaptchaBadge,
  executeRecaptcha,
  initializeRecaptcha,
} from "../../features/auth/lib/recaptchaV3";
import { DEMO_USERS } from "../../mocks";
import { RECAPTCHA_SITE_KEY } from "../../shared/config/runtimeEnv";
import { AuthLayout } from "./components/AuthLayout";
import { PasswordField } from "./components/PasswordField";

export function LoginPage() {
  const [role, setRole] = useState<UserRole>("STORE_OWNER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, switchDemo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const deactivateBadge = activateRecaptchaBadge();
    void initializeRecaptcha().catch(() => {
      // 로그인 요청 시 사용자에게 초기화 오류를 안내한다.
    });
    return deactivateBadge;
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    let captchaToken: string | null;
    try {
      captchaToken = await executeRecaptcha("login");
    } catch {
      setLoading(false);
      setError("자동입력 방지 확인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const result = await login(email, password, role, remember, captchaToken);
    setLoading(false);

    if (result.ok) {
      navigate(role === "STORE_OWNER" ? "/store" : "/admin", { replace: true });
      return;
    }
    setError(result.error ?? "로그인에 실패했습니다.");
  };

  const demoLogin = (userId: string) => {
    switchDemo(userId);
    const demoUser = DEMO_USERS.find((user) => user.id === userId);
    if (demoUser) {
      navigate(demoUser.role === "STORE_OWNER" ? "/store" : "/admin");
    }
  };

  return (
    <AuthLayout>
      <h1 className="mb-1 text-2xl font-bold">로그인</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        초대받아 가입을 완료한 관리자와 점주만 로그인할 수 있습니다.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        {([
          { value: "STORE_OWNER" as UserRole, label: "점주", icon: Store },
          { value: "ADMIN" as UserRole, label: "관리자", icon: Shield },
        ]).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              role === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-foreground">
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={role === "STORE_OWNER" ? "store@example.com" : "admin@company.com"}
            autoComplete="email"
            disabled={loading}
            className="h-10 w-full rounded-xl border border-border bg-muted px-3 text-sm focus:border-[#246BFD] focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40 disabled:opacity-60"
          />
        </div>

        <PasswordField
          label="비밀번호"
          value={password}
          onChange={setPassword}
          disabled={loading}
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded accent-[#246BFD]"
            />
            <span className="text-xs text-muted-foreground">로그인 상태 유지</span>
          </label>
          <span className="text-xs text-muted-foreground">
            비밀번호 분실 시 관리자에게 문의해 주세요.
          </span>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#246BFD] text-sm font-bold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
        >
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        관리자에게 임시 비밀번호를 받으셨나요?{" "}
        <Link to="/signup" className="font-semibold text-[#246BFD] hover:underline">
          회원가입
        </Link>
      </p>

      {RECAPTCHA_SITE_KEY && (
        <p className="mt-3 text-center text-[10px] leading-4 text-muted-foreground">
          이 사이트는 reCAPTCHA로 보호되며 Google의{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="font-semibold hover:underline"
          >
            개인정보처리방침
          </a>
          과{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
            className="font-semibold hover:underline"
          >
            서비스 약관
          </a>
          이 적용됩니다.
        </p>
      )}

      <div className="mt-8 border-t border-border pt-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
            프로토타입 계정 전환
          </span>
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            데모 전용
          </span>
        </div>
        <div className="space-y-2">
          {DEMO_USERS.map((demoUser) => (
            <button
              key={demoUser.id}
              type="button"
              onClick={() => demoLogin(demoUser.id)}
              className="flex w-full items-center gap-3 rounded-xl bg-muted px-3 py-2.5 text-left transition-colors hover:bg-muted-foreground/10"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#246BFD]/30 to-[#5B6CFF]/30 text-xs font-bold text-foreground">
                {demoUser.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground">{demoUser.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {demoUser.role === "STORE_OWNER"
                    ? "점주"
                    : demoUser.role === "SUPER_ADMIN"
                      ? "최고 관리자"
                      : "관리자"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
