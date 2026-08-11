import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Zap, BookOpen, Package,
  Star, Users, ShoppingBag,
  User, Search, ChevronLeft, ChevronRight,
  Store, Menu, LogOut, ClipboardCheck
} from "lucide-react";
import { clsx } from "clsx";
import { commerceApi } from "../../features/commerce/api/commerceApi";
import { StoreNoticePopover } from "../../features/notices/ui/StoreNoticePopover";
import { ApiError } from "../../shared/api/apiClient";
import { LiveDateTime } from "../../shared/components/LiveDateTime";
import { PolicyFooter } from "../../shared/components/PolicyFooter";
import { useAuth } from "../providers/useAuth";

const DASHBOARD_NAV = [
  { to: "/store", icon: LayoutDashboard, label: "점주 대시보드" },
];

const STORE_NAV = [
  { to: "/store/commerce", icon: ShoppingBag, label: "매장·커머스" },
  { to: "/store/inventory", icon: Package, label: "재고·발주" },
  { to: "/store/customers", icon: Users, label: "고객·쿠폰" },
];

const AI_NAV = [
  { to: "/store/actions", icon: Zap, label: "매출 기반 전략 추천" },
  { to: "/store/strategy-verifications", icon: ClipboardCheck, label: "전략 검증" },
  { to: "/store/ledger", icon: BookOpen, label: "AI 가계부" },
];

const ANALYTICS_NAV = [
  { to: "/store/sales", icon: TrendingUp, label: "매출 분석" },
  { to: "/store/reviews", icon: Star, label: "리뷰 분석" },
];

const NAV_GROUPS = [
  { label: "Store", items: STORE_NAV },
  { label: "AI", items: AI_NAV },
  { label: "Analytics", items: ANALYTICS_NAV },
];

type StoreIdentity = {
  name: string;
  category: string;
};

export type StoreOwnerLayoutContext = {
  updateStoreIdentity: (store: StoreIdentity | null) => void;
  currentStoreId: number | null;
};

export function StoreOwnerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storeIdentity, setStoreIdentity] = useState<StoreIdentity | null>(null);
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const { user, isDemo, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isDemo) {
      setStoreIdentity(null);
      setCurrentStoreId(1);
      return;
    }

    commerceApi.getStore()
      .then(({ name, category, id }) => {
        setStoreIdentity({ name, category });
        
        if (id) {
          setCurrentStoreId(id);
        }
      }
    )
      .catch((error: unknown) => {
        if (!(error instanceof ApiError && error.status === 404)) {
          console.error("매장 정보를 불러오지 못했습니다.", error);
        }
        setStoreIdentity(null);
      });
  }, [isDemo, user?.id]);

  const handleLogout = async () => {
    await logout();
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
              <div className="text-sm font-bold text-white truncate">
                {storeIdentity?.name || user?.storeName || (isDemo ? "성수 브루랩" : "매장 미등록")}
              </div>
              <div className="text-[11px] text-white/50">
                {storeIdentity?.category || user?.storeCategory || (isDemo ? "카페·베이커리" : "매장·커머스에서 매장을 등록해 주세요")}
              </div>
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
        {DASHBOARD_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/store"}
            onClick={() => setMobileOpen(false)}
            aria-label={label}
            title={collapsed && !mobile ? label : undefined}
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

        {NAV_GROUPS.map(({ label: groupLabel, items }) => (
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
            {items.map(({ to, icon: Icon, label }) => {
              if (to === "/store/strategy-verifications") {
                return (
                  <div key={to} className="group relative">
                    <NavLink
                      to="/store/strategy-verifications/sales"
                      onClick={() => setMobileOpen(false)}
                      aria-label={label}
                      title={collapsed && !mobile ? label : undefined}
                      className={() => clsx(
                        "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        location.pathname.startsWith("/store/strategy-verifications")
                          ? "bg-[#246BFD]/20 text-[#93BBFD]"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {(!collapsed || mobile) && <span className="truncate">{label}</span>}
                      {(!collapsed || mobile) && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
                    </NavLink>

                    {(!collapsed || mobile) && (
                      <div className="max-h-0 overflow-hidden pl-7 opacity-0 transition-all duration-200 group-hover:max-h-24 group-hover:opacity-100 group-focus-within:max-h-24 group-focus-within:opacity-100">
                        <div className="border-l border-white/10 py-1 pl-2">
                          <NavLink
                            to="/store/strategy-verifications/sales"
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => clsx(
                              "block rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                              isActive ? "bg-[#246BFD]/20 text-[#93BBFD]" : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            매출형 전략 검증
                          </NavLink>
                          <NavLink
                            to="/store/strategy-verifications/review"
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => clsx(
                              "block rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                              isActive ? "bg-[#246BFD]/20 text-[#93BBFD]" : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            리뷰형 전략 검증
                          </NavLink>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
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
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {(!collapsed || mobile) && <span className="truncate">{label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/8 p-2">
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
          type="button"
          aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
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
          <button
            type="button"
            aria-label="메뉴 열기"
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            onClick={() => setMobileOpen(true)}
          >
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
            <LiveDateTime className="hidden sm:flex" />
            <StoreNoticePopover isDemo={isDemo} />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#246BFD] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold">
              {(user?.name || "김")[0]}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-h-0 flex-1 overflow-y-auto print:overflow-visible print:h-auto">
          <div className="min-h-full">
            <Outlet context={{ updateStoreIdentity: setStoreIdentity, currentStoreId } satisfies StoreOwnerLayoutContext} />
          </div>
          <div className="border-t border-border bg-card/90 px-4 py-3 print:hidden">
            <PolicyFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
