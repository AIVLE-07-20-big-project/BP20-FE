import {
  CheckCircle2,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/useAuth";
import { StoreProfileSection } from "../../features/commerce/ui/StoreProfileSection";
import { Badge } from "../../shared/components/Badge";
import { PageShell } from "../../shared/components/PageShell";

const ROLE_LABEL = {
  SUPER_ADMIN: "최고 관리자",
  ADMIN: "관리자",
  STORE_OWNER: "점주",
} as const;

export function AccountPage() {
  const { user, isDemo, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <PageShell
      title="내 정보"
      subtitle={user.role === "STORE_OWNER"
        ? "계정과 연결된 매장 정보를 확인하고 관리합니다."
        : "로그인한 계정의 기본 정보를 확인합니다."}
    >
      <div className={`mx-auto ${user.role === "STORE_OWNER" ? "max-w-5xl" : "max-w-3xl"}`}>
        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="relative bg-gradient-to-r from-[#F2F7FF] via-white to-[#F5F1FF] px-6 py-7">
            <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-[#246BFD]/7" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#246BFD] to-[#8B5CF6] text-xl font-black text-white shadow-lg shadow-blue-200/60">
                  {user.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">{user.name}</h2>
                    <Badge variant={user.status === "INACTIVE" ? "negative" : "positive"}>
                      {user.status === "INACTIVE" ? "비활성" : "활성"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{ROLE_LABEL[user.role]}</p>
                </div>
              </div>
              {isDemo && <Badge variant="warning">프로토타입 계정</Badge>}
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <ProfileField icon={Mail} label="이메일" value={user.email} />
            <ProfileField icon={Phone} label="연락처" value={user.phoneNumber || "등록되지 않음"} />
          </div>
        </section>

        {user.role === "STORE_OWNER" && <StoreProfileSection isDemo={isDemo} />}

        <section className="mt-5 rounded-3xl border border-border bg-card p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold">계정 상태</h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {isDemo ? "화면 확인용 프로토타입 세션입니다." : "정상적으로 로그인되어 있습니다."}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </section>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          이름이나 연락처 변경이 필요한 경우 계정 관리자에게 문의해 주세요.
        </p>
      </div>
    </PageShell>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-[#246BFD] shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-sm font-bold">{value}</div>
      </div>
    </div>
  );
}
