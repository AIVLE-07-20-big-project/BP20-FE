import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import aiProductImageBanner from "../../../shared/assets/images/image02.png";
import { PolicyFooter } from "../../../shared/components/PolicyFooter";
import { LEGAL_CONFIG } from "../../legal/legalConfig";

interface AuthLayoutProps {
  children: ReactNode;
  contentWidth?: "sm" | "md";
  scrollExperience?: boolean;
}

const FEATURES = [
  { icon: TrendingUp, label: "매출 분석", description: "시간·요일·날씨 보정" },
  { icon: Zap, label: "AI 전략 추천", description: "근거와 예상 효과 제공" },
  { icon: Users, label: "고객 관리", description: "세그먼트 기반 전략" },
];

export function AuthLayout({
  children,
  contentWidth = "sm",
  scrollExperience = false,
}: AuthLayoutProps) {
  const layoutRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!scrollExperience) return;

    let animationFrame = 0;
    let wheelLocked = false;
    let wheelUnlockTimer = 0;

    const updateScrollAppearance = () => {
      if (window.innerWidth < 1024) return;

      const stage = Math.max(0, window.scrollY / window.innerHeight);
      const panels = layoutRef.current?.querySelectorAll<HTMLElement>("[data-horizontal-panel]");

      panels?.forEach((panel) => {
        const panelIndex = Number(panel.dataset.horizontalPanel ?? 0);
        const offset = Math.min(100, Math.max(-100, (panelIndex - stage) * 100));
        panel.style.transform = `translate3d(${offset}%, 0, 0)`;
      });
    };

    const handleScroll = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateScrollAppearance);
    };

    const handleWheel = (event: WheelEvent) => {
      if (window.innerWidth < 1024) return;

      event.preventDefault();
      if (event.clientX > window.innerWidth * 0.52) return;
      if (wheelLocked || Math.abs(event.deltaY) < 8) return;

      const currentStage = Math.round(window.scrollY / window.innerHeight);
      const direction = event.deltaY > 0 ? 1 : -1;
      const nextStage = Math.min(3, Math.max(0, currentStage + direction));

      if (nextStage === currentStage) return;

      wheelLocked = true;
      window.scrollTo({
        top: nextStage * window.innerHeight,
        behavior: "smooth",
      });
      wheelUnlockTimer = window.setTimeout(() => {
        wheelLocked = false;
      }, 750);
    };

    updateScrollAppearance();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(wheelUnlockTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [scrollExperience]);

  const authContent = (
    <div className={contentWidth === "md" ? "w-full max-w-lg" : "w-full max-w-sm"}>
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#246BFD] to-[#5B6CFF]">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-black tracking-wide">{LEGAL_CONFIG.serviceName}</span>
      </div>
      {children}
    </div>
  );

  const firstIntroduction = (
    <section className="flex min-h-screen items-center bg-white px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto grid w-full max-w-3xl items-center gap-8">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#246BFD]/10 px-4 py-2 text-sm font-bold text-[#246BFD]">
            <BarChart3 className="h-4 w-4" />
            AI와 함께 더 효율적인 매장 운영
          </div>
          <h2 className="text-3xl font-black leading-tight text-[#0B1220] sm:text-4xl">
            AI가 분석한 데이터로,
            <br />
            매장을 효율적으로 운영하세요.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
            매출 흐름과 고객 반응을 한눈에 확인하고,
            <br />
            AI가 발견한 빈틈의 실을 노려보아요.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#246BFD]/15 to-[#8B5CF6]/15 blur-2xl" />
          <img
            src={aiProductImageBanner}
            alt="데이터 기반으로 운영되는 카페 매장"
            className="relative mx-auto aspect-[16/8] w-full max-w-[1800px] rounded-[1rem] object-contain shadow-2xl shadow-slate-900/15"
          />
        </div>
      </div>
    </section>
  );

  return (
    <div ref={layoutRef} className={scrollExperience ? "min-h-screen bg-white" : "min-h-screen bg-[#F4F7FB] lg:flex"}>
      <div className={scrollExperience ? "relative bg-[#F4F7FB] lg:h-[400vh]" : "contents"}>
      {scrollExperience && (
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-10 lg:block lg:w-[52%] lg:overflow-hidden">
          <div data-horizontal-panel="1" className="absolute inset-0 will-change-transform">
            {firstIntroduction}
          </div>
        </div>
      )}
      <aside
        ref={asideRef}
        data-horizontal-panel={scrollExperience ? "0" : undefined}
        className={`relative hidden min-h-screen w-[52%] overflow-hidden bg-[#0B1220] p-12 lg:flex lg:flex-col ${
          scrollExperience ? "lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:h-screen lg:will-change-transform" : ""
        }`}
      >
        <div className="flex h-full flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#246BFD]/8" />
          <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#246BFD]/12" />
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#246BFD]/20" />
          <div className="absolute right-1/4 top-1/4 h-px w-48 bg-gradient-to-r from-transparent via-[#246BFD]/30 to-transparent" />
          <div className="absolute bottom-1/3 left-1/4 h-px w-32 bg-gradient-to-r from-transparent via-[#5B6CFF]/30 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#246BFD] to-[#5B6CFF]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-wide text-white">{LEGAL_CONFIG.serviceName}</span>
        </div>

        <div className="relative z-10 my-auto">
          <h1 className="mb-6 text-4xl font-black leading-tight text-white">
            매장의 신호를 읽고,
            <br />
            <span className="bg-gradient-to-r from-[#246BFD] to-[#5B6CFF] bg-clip-text text-transparent">
              다음 행동을 제안합니다.
            </span>
          </h1>
          <p className="mb-10 max-w-md text-base leading-relaxed text-white/50">
            POS·결제 데이터를 기반으로 운영 문제를 발견하고, 실행 가능한 조치를 제안하며,
            그 효과까지 검증하는 AI 운영 플랫폼.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, label, description }) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <Icon className="mb-2 h-5 w-5 text-[#8B5CF6]" />
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="mt-0.5 text-xs text-white/40">{description}</div>
              </div>
            ))}
          </div>
        </div>

        {!scrollExperience && <div className="relative z-10"><PolicyFooter dark /></div>}
        </div>
      </aside>

      <main
        className={`relative flex min-h-screen flex-1 flex-col px-6 sm:px-8 lg:px-12 ${scrollExperience ? "bg-white py-0 lg:fixed lg:inset-y-0 lg:right-0 lg:z-40 lg:w-[48%]" : "overflow-y-auto py-8"}`}
      >
        <div className="flex min-h-screen items-center justify-center py-10">
          {authContent}
        </div>
        {!scrollExperience && (
          <div className="mx-auto mt-6 w-full max-w-lg lg:hidden"><PolicyFooter /></div>
        )}
        {scrollExperience && (
          <div className="absolute inset-x-8 bottom-6 hidden lg:block">
            <PolicyFooter />
          </div>
        )}
      </main>
      </div>

      {scrollExperience && (
        <>
          <div className="lg:hidden">{firstIntroduction}</div>

          <section data-horizontal-panel="2" className="flex min-h-screen items-center bg-[#F5F7FF] px-6 py-20 sm:px-10 lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-[52%] lg:px-12 lg:py-10 lg:will-change-transform">
            <div className="mx-auto grid w-full max-w-3xl items-center gap-8">
              <div className="relative order-2 lg:order-1">
                <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#8B5CF6]/20 to-[#246BFD]/10 blur-2xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-400">이번 주 AI 추천</p>
                      <h3 className="mt-1 text-2xl font-black text-[#0B1220]">매출 기회 3건 발견</h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B5CF6]/10">
                      <Sparkles className="h-6 w-6 text-[#8B5CF6]" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      ["점심 시간 세트 메뉴 구성", "예상 매출 +12%", "높은 효과"],
                      ["재방문 고객 맞춤 쿠폰", "재방문율 +8%", "추천"],
                      ["저녁 시간 재고 최적화", "폐기 비용 -15%", "비용 절감"],
                    ].map(([title, effect, badge], index) => (
                      <div key={title} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#246BFD] text-sm font-black text-white">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900">{title}</div>
                          <div className="mt-1 text-sm font-semibold text-[#246BFD]">{effect}</div>
                        </div>
                        <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 sm:block">{badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#8B5CF6]/10 px-4 py-2 text-sm font-bold text-[#7C3AED]">
                  <Sparkles className="h-4 w-4" />
                  놓치기 쉬운 기회까지 발견
                </div>
                <h2 className="text-3xl font-black leading-tight text-[#0B1220] sm:text-4xl">
                  분석에서 끝나지 않는,
                  <br />
                  실행 가능한 AI 전략.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  매장 데이터를 바탕으로 지금 필요한 행동의 우선순위와 기대 효과를 함께 제안합니다.
                </p>
              </div>
            </div>
          </section>

          <section data-horizontal-panel="3" className="flex min-h-screen items-center bg-[#0B1220] px-6 py-20 text-white sm:px-10 lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-[52%] lg:px-12 lg:py-10 lg:will-change-transform">
            <div className="mx-auto grid w-full max-w-3xl items-center gap-8">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-[#8EAFFF]">
                  <Target className="h-4 w-4" />
                  실행 이후의 변화까지 확인
                </div>
                <h2 className="text-3xl font-black leading-tight sm:text-4xl">
                  전략의 효과를 검증하고,
                  <br />
                  더 나은 선택을 이어가세요.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
                  실행 전후의 핵심 지표를 비교해 어떤 전략이 실제 성과로 이어졌는지 명확하게 확인합니다.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-[#246BFD]/20 blur-3xl" />
                <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-7">
                    <div>
                      <p className="text-sm font-semibold text-white/40">AI 전략 성과 리포트</p>
                      <h3 className="mt-2 text-2xl font-black">점심 세트 메뉴 프로모션</h3>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" /> 검증 완료
                    </span>
                  </div>
                  <div className="mt-7 grid gap-4 sm:grid-cols-3">
                    {[
                      ["매출 증가", "+14.2%"],
                      ["객단가 상승", "+8.7%"],
                      ["목표 달성률", "118%"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-white/[0.07] p-5">
                        <div className="text-sm font-semibold text-white/45">{label}</div>
                        <div className="mt-3 text-3xl font-black text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#246BFD]/20 to-[#8B5CF6]/20 p-5">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-[#8EAFFF]" />
                      <p className="font-semibold text-white/80">예상 효과보다 높은 성과를 기록했습니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-white px-6 py-8 sm:px-8 lg:hidden lg:px-12">
            <PolicyFooter />
          </div>
        </>
      )}
    </div>
  );
}
