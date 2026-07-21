import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Store, Shield, Zap, TrendingUp, Users } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import type { UserRole } from "../../entities/user/user.types";
import { DEMO_USERS } from "../../mocks";

export function LoginPage() {
  const [role, setRole] = useState<UserRole>("STORE_OWNER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, switchDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("이메일과 비밀번호를 입력해 주세요."); return; }
    setLoading(true);
    setError("");
    const result = await login(email, password, role);
    setLoading(false);
    if (result.ok) {
      navigate(role === "STORE_OWNER" ? "/store" : "/admin");
    } else {
      setError(result.error || "로그인에 실패했습니다.");
    }
  };

  const demoLogin = (userId: string) => {
    switchDemo(userId);
    const u = DEMO_USERS.find(u => u.id === userId)!;
    navigate(u.role === "STORE_OWNER" ? "/store" : "/admin");
  };

  return (
    <div className="min-h-screen flex bg-[#F4F7FB]">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#0B1220] relative overflow-hidden flex-col justify-between p-12">
        {/* Background pulse decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#246BFD]/8" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-[#246BFD]/12" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-[#246BFD]/20" />
          <div className="absolute top-1/4 right-1/4 w-48 h-px bg-gradient-to-r from-transparent via-[#246BFD]/30 to-transparent" />
          <div className="absolute bottom-1/3 left-1/4 w-32 h-px bg-gradient-to-r from-transparent via-[#5B6CFF]/30 to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#246BFD] to-[#5B6CFF] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-wide">BP20</span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            매장의 신호를 읽고,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#246BFD] to-[#5B6CFF]">다음 행동을 제안합니다.</span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm mb-10">
            POS·결제 데이터를 기반으로 운영 문제를 발견하고, 실행 가능한 조치를 제안하며, 그 효과까지 검증하는 AI 운영 플랫폼.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, label: "매출 분석", sub: "시간·요일·날씨 보정" },
              { icon: Zap, label: "AI 전략 추천", sub: "근거와 예상 효과 제공" },
              { icon: Users, label: "고객 관리", sub: "세그먼트 기반 전략" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-white/5 border border-white/8 rounded-2xl p-4">
                <Icon className="w-5 h-5 text-[#8B5CF6] mb-2" />
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs text-white/40 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs">© 2026 BP20. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#246BFD] to-[#5B6CFF] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-wide">BP20</span>
          </div>

          <h3 className="text-2xl font-bold mb-1">로그인</h3>
          <p className="text-sm text-muted-foreground mb-6">초대받은 계정만 가입할 수 있습니다.</p>

          {/* Role tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-muted rounded-2xl">
            {([
              { value: "STORE_OWNER" as UserRole, label: "점주", icon: Store },
              { value: "ADMIN" as UserRole, label: "관리자", icon: Shield },
            ]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setRole(value)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  role === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === "STORE_OWNER" ? "store@example.com" : "admin@company.com"}
                className="w-full h-10 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40 focus:border-[#246BFD]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full h-10 px-3 pr-10 text-sm bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40 focus:border-[#246BFD]"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-[#246BFD]" />
                <span className="text-xs text-muted-foreground">로그인 상태 유지</span>
              </label>
              <button type="button" className="text-xs text-[#246BFD] hover:underline font-semibold">비밀번호를 잊으셨나요?</button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#246BFD] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />로그인 중...</>
              ) : "로그인"}
            </button>
          </form>

          {/* Demo selector */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">프로토타입 계정 전환</span>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">데모 전용</span>
            </div>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => demoLogin(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted hover:bg-muted-foreground/10 rounded-xl transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#246BFD]/30 to-[#5B6CFF]/30 flex items-center justify-center text-xs font-bold text-foreground">
                    {u.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground">{u.role === "STORE_OWNER" ? "점주" : u.role === "SUPER_ADMIN" ? "최고 관리자" : "관리자"}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
