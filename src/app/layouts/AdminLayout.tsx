import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, AlertTriangle, BarChart3, TrendingUp,
  Target, CreditCard, Megaphone, Activity,
  Users, UserRoundCheck, Mail, ClipboardList, Bell, Search, ChevronLeft, ChevronRight,
  LogOut, Shield
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../providers/AuthProvider";

const DASHBOARD_NAV = [
  { to: "/admin", icon: LayoutDashboard, label: "통합 대시보드" },
];

const OPERATIONS_NAV = [
  { to: "/admin/merchants", icon: Building2, label: "가맹점 관리" },
  { to: "/admin/risks", icon: AlertTriangle, label: "위험 가맹점" },
  { to: "/admin/market-intelligence", icon: BarChart3, label: "소비·상권 분석" },
  { to: "/admin/roi", icon: TrendingUp, label: "AI 성과·ROI" },
  { to: "/admin/sales-targets", icon: Target, label: "영업 타겟" },
  { to: "/admin/subscriptions", icon: CreditCard, label: "구독·계약" },
  { to: "/admin/notices", icon: Megaphone, label: "공지 관리" },
  { to: "/admin/service-status", icon: Activity, label: "서비스 상태" },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col h-full bg-[#0B1220] border-r border-white/5 flex-shrink-0 relative transition-all duration-200"
        style={{ width: collapsed ? 64 : 260 }}
      >
        {/* Logo */}
        <div className={clsx("px-4 py-4 border-b border-white/8", collapsed && "px-3")}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#246BFD] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div>
                <div className="text-xs font-black text-white tracking-wider">BP20</div>
                <div className="text-[10px] text-white/40">파트너 콘솔</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {DASHBOARD_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#246BFD]/20 text-[#93BBFD]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          {!collapsed && (
            <div className="px-3 pb-1 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Account
              </span>
            </div>
          )}
          {accountNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#246BFD]/20 text-[#93BBFD]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          {!collapsed && (
            <div className="px-3 pb-1 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Store
              </span>
            </div>
          )}
          {OPERATIONS_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#246BFD]/20 text-[#93BBFD]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/8 p-2">
          {!collapsed && (
            <div className="px-3 py-2 mb-1">
              <div className="text-xs font-semibold text-white/70">{user?.name || "박준혁"}</div>
              <div className="text-[11px] text-white/30">{user?.role === "SUPER_ADMIN" ? "최고 관리자" : "관리자"}</div>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>로그아웃</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground z-10 shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-3 px-6 border-b border-border bg-card flex-shrink-0">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="search"
                placeholder="가맹점, 리포트, 기능 검색"
                className="w-full h-8 pl-8 pr-3 text-xs bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E9F6E]" />
              오늘 09:42 기준
            </span>
            <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D92D20]" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#5B6CFF]/20 border border-[#5B6CFF]/30 flex items-center justify-center text-[#5B6CFF] text-xs font-bold">
              {(user?.name || "박")[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
