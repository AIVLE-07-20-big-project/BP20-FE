import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Zap, BookOpen, Package,
  Star, Users, FileText, ShoppingBag,
  HelpCircle, User, Bell, Megaphone, Search, ChevronLeft, ChevronRight,
  Store, Menu, LogOut, DollarSign
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../providers/AuthProvider";

const NAV_ITEMS = [
  { to: "/store", icon: LayoutDashboard, label: "점주 대시보드" },
  { to: "/store/sales", icon: TrendingUp, label: "매출 분석" },
  { to: "/store/actions", icon: Zap, label: "AI 전략 추천" },
  { to: "/store/ledger", icon: BookOpen, label: "AI 가계부" },
  { to: "/store/cost", icon: DollarSign, label: "지출·원가" },
  { to: "/store/inventory", icon: Package, label: "재고·발주" },
  { to: "/store/reviews", icon: Star, label: "리뷰 분석" },
  { to: "/store/customers", icon: Users, label: "고객·쿠폰" },
  { to: "/store/reports", icon: FileText, label: "경영 리포트" },
  { to: "/store/commerce", icon: ShoppingBag, label: "온라인 커머스" },
  { to: "/store/notices", icon: Megaphone, label: "공지사항" },
];

export function StoreOwnerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={clsx(
      "h-full bg-[#111A2E] flex flex-col",
      mobile ? "w-72" : collapsed ? "w-16" : "w-62"
    )} style={{ width: mobile ? undefined : collapsed ? 64 : 248 }}>
      {/* Store identity */}
      <div className={clsx("px-4 py-4 border-b border-white/8", collapsed && !mobile && "px-3")}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#246BFD] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{user?.storeName || "성수 브루랩"}</div>
              <div className="text-[11px] text-white/50">{user?.storeCategory || "카페·베이커리"}</div>
            </div>
          )}
        </div>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E9F6E]" />
            <span className="text-[11px] text-[#0E9F6E] font-semibold">POS 연동 정상</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/store"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#246BFD]/20 text-[#93BBFD]"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || mobile) && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/8 p-2">
        <NavLink to="/store/help" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>도움말</span>}
        </NavLink>
        <NavLink to="/store/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
          <User className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>내 정보</span>}
        </NavLink>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || mobile) && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background print:block print:h-auto print:overflow-visible">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0 relative print:!hidden" style={{ width: collapsed ? 64 : 248 }}>
        <Sidebar />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10 shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 print:block print:w-full">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-border bg-card flex-shrink-0 print:hidden">
          <button className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="search"
                placeholder="기능 검색"
                className="w-full h-8 pl-8 pr-3 text-xs bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#246BFD]/40"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E9F6E]" />
              오늘 09:42 기준
            </span>
            <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D92D20]" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#246BFD] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold">
              {(user?.name || "김")[0]}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden print:overflow-visible print:h-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
