import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Search,
  Shield,
  Target,
  TrendingUp,
  UserRound,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { clsx } from "clsx";
import { LiveDateTime } from "../../shared/components/LiveDateTime";
import { PolicyFooter } from "../../shared/components/PolicyFooter";
import { useAuth } from "../providers/useAuth";
import { LEGAL_CONFIG } from "../../pages/legal/legalConfig";

const DASHBOARD_NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "통합 대시보드" },
];

const STORE_NAV = [
  { to: "/admin/notices", icon: Megaphone, label: "가맹점 공지" },
];

const BUSINESS_NAV = [
  { to: "/admin/sales-targets", icon: Target, label: "영업 타겟" },
  { to: "/admin/roi", icon: TrendingUp, label: "효과 검증 현황" },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const accountNav = [
    ...(isSuperAdmin
      ? [{ to: "/admin/accounts/admins", icon: Users, label: "관리자 계정" }]
      : []),
    { to: "/admin/accounts/store-owners", icon: UserRoundCheck, label: "점주 계정" },
    { to: "/admin/accounts/invitations", icon: Mail, label: "초대 관리" },
    ...(isSuperAdmin
      ? [{ to: "/admin/accounts/iam-logs", icon: ClipboardList, label: "IAM 로그" }]
      : []),
  ];

  const navGroups = [
    { label: "Account", items: accountNav },
    { label: "Store", items: STORE_NAV },
    { label: "Business", items: BUSINESS_NAV },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className="relative flex h-full flex-col border-r border-white/5 bg-[#0B1220] transition-all duration-200"
      style={{ width: mobile ? 288 : collapsed ? 64 : 260 }}
    >
      <div className={clsx("border-b border-white/8 px-4 py-4", collapsed && !mobile && "px-3")}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#246BFD] to-[#8B5CF6]">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <div className="text-xs font-black tracking-wider text-white">{LEGAL_CONFIG.serviceName}</div>
              <div className="text-[10px] text-white/40">파트너 콘솔</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {DASHBOARD_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => setMobileOpen(false)}
            aria-label={label}
            title={collapsed && !mobile ? label : undefined}
            className={({ isActive }) => clsx(
              "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#246BFD]/20 text-[#93BBFD]"
                : "text-white/50 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {(!collapsed || mobile) && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {navGroups.map(({ label: groupLabel, items }) => (
          <div
            key={groupLabel}
            className={clsx(collapsed && !mobile && "mt-2")}
          >
            {(!collapsed || mobile) && (
              <div className="px-3 pb-1 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  {groupLabel}
                </span>
              </div>
            )}
            {items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                aria-label={label}
                title={collapsed && !mobile ? label : undefined}
                className={({ isActive }) => clsx(
                  "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#246BFD]/20 text-[#93BBFD]"
                    : "text-white/50 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {(!collapsed || mobile) && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/8 p-2">
        {(!collapsed || mobile) && (
          <div className="mb-1 px-3 py-2">
            <div className="text-xs font-semibold text-white/70">{user?.name || "박준혁"}</div>
            <div className="text-[11px] text-white/30">
              {isSuperAdmin ? "최고 관리자" : "관리자"}
            </div>
          </div>
        )}
        <NavLink
          to="/admin/profile"
          onClick={() => setMobileOpen(false)}
          aria-label="내 정보"
          title={collapsed && !mobile ? "내 정보" : undefined}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
        >
          <UserRound className="h-4 w-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>내 정보</span>}
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="로그아웃"
          title={collapsed && !mobile ? "로그아웃" : undefined}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="fixed inset-0 cursor-default bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div
        className="relative hidden flex-shrink-0 lg:flex"
        style={{ width: collapsed ? 64 : 260 }}
      >
        <Sidebar />
        <button
          type="button"
          aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <button
            type="button"
            aria-label="메뉴 열기"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="max-w-sm flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="가맹점, 리포트, 기능 검색"
                className="h-8 w-full rounded-lg border-0 bg-muted pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LiveDateTime className="hidden md:flex" />
            <button
              type="button"
              aria-label="알림"
              className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#D92D20]" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#5B6CFF]/30 bg-[#5B6CFF]/20 text-xs font-bold text-[#5B6CFF]">
              {(user?.name || "박")[0]}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="min-h-full">
            <Outlet />
          </div>
          <div className="border-t border-border bg-card/90 px-4 py-3">
            <PolicyFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
