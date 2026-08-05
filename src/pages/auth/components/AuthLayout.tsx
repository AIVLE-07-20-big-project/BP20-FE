import type { ReactNode } from "react";
import { TrendingUp, Users, Zap } from "lucide-react";
import { PolicyFooter } from "../../../shared/components/PolicyFooter";

interface AuthLayoutProps {
  children: ReactNode;
  contentWidth?: "sm" | "md";
}

const FEATURES = [
  { icon: TrendingUp, label: "매출 분석", description: "시간·요일·날씨 보정" },
  { icon: Zap, label: "AI 전략 추천", description: "근거와 예상 효과 제공" },
  { icon: Users, label: "고객 관리", description: "세그먼트 기반 전략" },
];

export function AuthLayout({ children, contentWidth = "sm" }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F7FB] lg:flex">
      <aside className="relative hidden min-h-screen w-[52%] overflow-hidden bg-[#0B1220] p-12 lg:flex lg:flex-col lg:justify-between">
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
          <span className="text-xl font-black tracking-wide text-white">BP20</span>
        </div>

        <div className="relative z-10">
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

        <div className="relative z-10"><PolicyFooter dark /></div>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-8 lg:px-12">
        <div className="flex flex-1 items-center justify-center py-2">
        <div className={contentWidth === "md" ? "w-full max-w-lg" : "w-full max-w-sm"}>
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#246BFD] to-[#5B6CFF]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-wide">BP20</span>
          </div>
          {children}
        </div>
        </div>
        <div className="mx-auto mt-6 w-full max-w-lg lg:hidden"><PolicyFooter /></div>
      </main>
    </div>
  );
}
