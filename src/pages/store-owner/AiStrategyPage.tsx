import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown, Archive, ChevronRight, Sparkles, CheckCircle2,
  Play, Eye, Pause, Search, Filter, X, AlertCircle, Clock,
  TrendingUp, Package, Star, Users, DollarSign, BarChart3,
  Calendar, Info
} from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { AI_RECOMMENDATIONS } from "../../mocks";
import type { AIRecommendation } from "../../entities/recommendation/recommendation.types";

const CATEGORIES = ["전체", "매출", "재고", "리뷰", "고객", "원가"];
const SORT_OPTIONS = ["우선순위순", "예상 효과순", "마감 임박순", "최신순"];

type ExecStatus = "실행 완료" | "실행 중" | "효과 확인" | "보류";

const EXEC_SUMMARY: { key: ExecStatus; label: string; count: number; change: string; icon: typeof CheckCircle2; bg: string; iconColor: string; textColor: string; desc: string }[] = [
  { key: "실행 완료", label: "실행 완료", count: 12, change: "+3 (30일)", icon: CheckCircle2, bg: "bg-[#0E9F6E]/8 border-[#0E9F6E]/20", iconColor: "text-[#0E9F6E]", textColor: "text-[#0E9F6E]", desc: "결과 확정됨" },
  { key: "실행 중", label: "실행 중", count: 3, change: "진행 중", icon: Play, bg: "bg-[#246BFD]/8 border-[#246BFD]/20", iconColor: "text-[#246BFD]", textColor: "text-[#246BFD]", desc: "현재 진행" },
  { key: "효과 확인", label: "효과 확인", count: 2, change: "데이터 수집 중", icon: Eye, bg: "bg-[#8B5CF6]/8 border-[#8B5CF6]/20", iconColor: "text-[#8B5CF6]", textColor: "text-[#8B5CF6]", desc: "성과 측정 중" },
  { key: "보류", label: "보류", count: 4, change: "대기 중", icon: Pause, bg: "bg-muted border-border", iconColor: "text-muted-foreground", textColor: "text-muted-foreground", desc: "점주 보류" },
];

const NEW_RECS = [
  {
    id: "new1",
    title: "오후 2~5시 재방문 쿠폰 발송",
    category: "매출",
    priority: "P1",
    problem: "평일 해당 시간대 방문 건수가 4주간 23% 감소했습니다.",
    evidenceCount: 4,
    evidencePeriod: "최근 4주",
    expectedValue: "해당 시간대 매출 12~16% 개선 예상",
    confidence: 87,
    effort: "낮음",
    deadline: "07.25",
    action: "전략 검토",
  },
  {
    id: "new2",
    title: "아이스 아메리카노 원두 2박스 발주",
    category: "재고",
    priority: "P1",
    problem: "현재 판매 속도 기준 내일 16:00 품절이 예상됩니다.",
    evidenceCount: 2,
    evidencePeriod: "최근 7일",
    expectedValue: "품절 위험 감소 · 예상 손실 420,000원 방어",
    confidence: 94,
    effort: "낮음",
    deadline: "오늘",
    action: "발주 검토",
  },
  {
    id: "new3",
    title: "대기시간 개선을 위한 밑작업 조정",
    category: "리뷰",
    priority: "P2",
    problem: "대기시간 관련 부정 리뷰가 최근 2주 동안 3배 증가했습니다.",
    evidenceCount: 5,
    evidencePeriod: "최근 2주",
    expectedValue: "피크 시간 평균 대기시간 3~5분 단축 예상",
    confidence: 81,
    effort: "보통",
    deadline: "07.28",
    action: "계획 확인",
  },
];

const CATEGORY_ICON: Record<string, typeof TrendingUp> = {
  매출: TrendingUp,
  재고: Package,
  리뷰: Star,
  고객: Users,
  원가: DollarSign,
};

const PRIORITY_STYLE: Record<string, string> = {
  P1: "bg-red-50 text-red-600 border border-red-200",
  P2: "bg-amber-50 text-amber-600 border border-amber-200",
  P3: "bg-muted text-muted-foreground border border-border",
};

const EFFORT_COLOR: Record<string, string> = { 낮음: "text-[#0E9F6E]", 보통: "text-amber-500", 높음: "text-red-500" };

interface NewRecCardProps {
  rec: typeof NEW_RECS[0];
  onOpen: () => void;
}

function NewRecCard({ rec, onOpen }: NewRecCardProps) {
  const CatIcon = CATEGORY_ICON[rec.category] || BarChart3;
  return (
    <div
      onClick={onOpen}
      className="bg-card border border-border rounded-2xl p-4 hover:border-[#246BFD]/40 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#246BFD]/10 text-[#246BFD] border border-[#246BFD]/20">새 추천</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_STYLE[rec.priority]}`}>{rec.priority}</span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <CatIcon className="w-3 h-3" /> {rec.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-[#246BFD] flex-shrink-0">
          <Sparkles className="w-3 h-3" />
          {rec.confidence}%
        </div>
      </div>

      <h4 className="font-bold text-sm mb-1">{rec.title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rec.problem}</p>

      <div className="flex items-center gap-3 text-xs mb-3">
        <span className="text-[#0E9F6E] font-semibold">{rec.expectedValue}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>근거 {rec.evidenceCount}개 ({rec.evidencePeriod})</span>
          <span>노력: <span className={EFFORT_COLOR[rec.effort]}>{rec.effort}</span></span>
          <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {rec.deadline}</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          className="text-xs font-semibold text-white bg-[#246BFD] hover:bg-[#1D4ED8] px-3 py-1 rounded-lg transition-colors"
        >
          {rec.action}
        </button>
      </div>
    </div>
  );
}

interface ExistingRecCardProps {
  rec: AIRecommendation;
  onClick: () => void;
}

function ExistingRecCard({ rec, onClick }: ExistingRecCardProps) {
  const CatIcon = CATEGORY_ICON[rec.category] || BarChart3;
  const statusStyle: Record<string, string> = {
    "추천됨": "bg-amber-50 text-amber-700 border-amber-200",
    "실행 예정": "bg-[#246BFD]/10 text-[#246BFD] border-[#246BFD]/20",
    "측정 중": "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20",
    "효과 확인": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "보류": "bg-muted text-muted-foreground border-border",
  };
  const s = statusStyle[rec.status] || "bg-muted text-muted-foreground border-border";

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-2xl p-4 hover:border-[#246BFD]/40 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s}`}>{rec.status}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_STYLE[rec.priority]}`}>{rec.priority}</span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <CatIcon className="w-3 h-3" /> {rec.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-[#246BFD] flex-shrink-0">
          <Sparkles className="w-3 h-3" />
          {rec.confidence}%
        </div>
      </div>

      <h4 className="font-bold text-sm mb-1">{rec.title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{rec.problem}</p>

      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="text-[#0E9F6E] font-semibold">{rec.expectedValue}</span>
          <span>노력: {rec.effort}</span>
          <span>근거 {rec.evidenceCount}개</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {rec.status === "효과 확인" && rec.verifiedResult && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-700">
          ✓ {rec.verifiedResult.slice(0, 80)}...
        </div>
      )}
    </div>
  );
}

interface DetailDrawerProps {
  rec: typeof NEW_RECS[0] | null;
  onClose: () => void;
  onExecute: () => void;
}

function DetailDrawer({ rec, onClose, onExecute }: DetailDrawerProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [execDate, setExecDate] = useState("2025-07-25");
  const [param, setParam] = useState("10");
  if (!rec) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto z-10 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-[#246BFD] bg-[#246BFD]/10 px-1.5 py-0.5 rounded">새 추천</span>
              <span className="text-[10px] text-muted-foreground">{rec.category}</span>
            </div>
            <h3 className="font-bold text-sm">{rec.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          <div className="space-y-3">
            <Section title="감지된 내용" icon={AlertCircle}>
              <p className="text-sm text-foreground">{rec.problem}</p>
              <div className="text-xs text-muted-foreground mt-1">데이터 기간: {rec.evidencePeriod} · 근거 {rec.evidenceCount}개</div>
            </Section>

            <Section title="왜 중요한가" icon={Info}>
              <p className="text-xs text-muted-foreground">이 지표가 지속되면 월간 매출 목표 달성에 영향을 미칠 수 있습니다. 지금 조치하면 손실을 최소화할 수 있습니다.</p>
            </Section>

            <Section title="예상 효과" icon={TrendingUp}>
              <div className="bg-[#0E9F6E]/8 border border-[#0E9F6E]/20 rounded-xl p-3">
                <div className="text-sm font-semibold text-[#0E9F6E]">{rec.expectedValue}</div>
                <div className="text-xs text-muted-foreground mt-1">신뢰도 {rec.confidence}% · AI 예측이며 실제와 다를 수 있습니다.</div>
              </div>
            </Section>

            <Section title="실행 정보" icon={Clock}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-muted-foreground mb-0.5">예상 노력</div>
                  <div className={`font-bold ${EFFORT_COLOR[rec.effort]}`}>{rec.effort}</div>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-muted-foreground mb-0.5">권장 마감</div>
                  <div className="font-bold">{rec.deadline}</div>
                </div>
              </div>
            </Section>

            <Section title="실행 체크리스트" icon={CheckCircle2}>
              <ul className="space-y-1.5">
                {["담당 직원에게 사전 안내", "쿠폰 발송 시스템 확인", "캠페인 내용 최종 검토", "실행 일정 확정"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-2">
          {!showConfirm ? (
            <>
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full h-10 bg-[#246BFD] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors"
              >
                실행 계획 만들기
              </button>
              <div className="flex gap-2">
                <button className="flex-1 h-9 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">보류</button>
                <button className="flex-1 h-9 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">추천 제외</button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#246BFD]/5 border border-[#246BFD]/20 rounded-xl p-3">
                <div className="text-xs font-bold mb-2">실행 계획 설정</div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">실행 날짜</label>
                    <input type="date" value={execDate} onChange={e => setExecDate(e.target.value)} className="w-full h-8 px-3 text-xs bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">쿠폰 할인율 (%)</label>
                    <input type="number" value={param} onChange={e => setParam(e.target.value)} className="w-full h-8 px-3 text-xs bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => { onExecute(); setShowConfirm(false); onClose(); }}
                className="w-full h-10 bg-[#246BFD] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors"
              >
                실행 확정
              </button>
              <button onClick={() => setShowConfirm(false)} className="w-full h-9 text-xs text-muted-foreground hover:text-foreground">취소</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof AlertCircle; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function AiStrategyPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<ExecStatus | null>(null);
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("우선순위순");
  const [search, setSearch] = useState("");
  const [drawerRec, setDrawerRec] = useState<typeof NEW_RECS[0] | null>(null);

  const filteredExisting = AI_RECOMMENDATIONS.filter(r => {
    if (category !== "전체" && r.category !== category) return false;
    if (search && !r.title.includes(search)) return false;
    return true;
  });

  const filteredNew = filterStatus
    ? []
    : NEW_RECS.filter(r => {
        if (category !== "전체" && r.category !== category) return false;
        if (search && !r.title.includes(search)) return false;
        return true;
      });

  const resultCount = filteredNew.length + filteredExisting.length;

  return (
    <PageShell
      title="AI 전략 추천"
      subtitle="매출, 재고, 원가, 리뷰 데이터를 분석한 전략을 검토하고 실행 효과를 관리합니다."
      freshness="오늘 09:42 기준"
      actions={
        <button className="text-xs text-muted-foreground font-semibold flex items-center gap-1 hover:text-foreground transition-colors">
          <Archive className="w-3.5 h-3.5" /> 추천 이력
        </button>
      }
    >
      {/* AI 추천 현황 summary */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          <h3 className="font-bold">AI 추천 현황</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {EXEC_SUMMARY.map(s => {
            const Icon = s.icon;
            const isActive = filterStatus === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setFilterStatus(isActive ? null : s.key)}
                className={`border rounded-2xl p-4 text-left transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30 ${s.bg} ${isActive ? "ring-2 ring-[#246BFD]/40 shadow-sm" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                  {isActive && <span className="text-[10px] font-bold text-[#246BFD] bg-[#246BFD]/10 px-1.5 py-0.5 rounded">필터 중</span>}
                </div>
                <div className={`text-2xl font-black tabular-nums ${s.textColor}`}>{s.count}</div>
                <div className="text-xs font-bold mt-0.5">{s.label}</div>
                <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{s.change}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 오늘 우선 검토할 전략 */}
      {!filterStatus && filteredNew.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold">오늘 우선 검토할 전략</h3>
            <span className="text-xs font-bold text-[#246BFD] bg-[#246BFD]/10 border border-[#246BFD]/20 px-2 py-0.5 rounded-full">
              새 추천 {filteredNew.length}건
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredNew.map(rec => (
              <NewRecCard key={rec.id} rec={rec} onOpen={() => setDrawerRec(rec)} />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="추천 제목 검색"
            className="w-full h-8 pl-8 pr-3 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                category === c
                  ? "bg-[#246BFD]/10 text-[#246BFD] border border-[#246BFD]/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-xs bg-transparent text-muted-foreground focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {filterStatus && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">필터:</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-[#246BFD] bg-[#246BFD]/10 border border-[#246BFD]/20 px-2 py-0.5 rounded-full">
            {filterStatus}
            <button onClick={() => setFilterStatus(null)}><X className="w-3 h-3" /></button>
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-xs text-muted-foreground">결과</span>
        <span className="text-xs font-bold text-foreground">{resultCount}건</span>
        {search && <span className="text-xs text-muted-foreground">· "{search}" 검색 중</span>}
      </div>

      {/* Existing recs */}
      {filteredExisting.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">해당 조건의 추천이 없습니다.</p>
          {(filterStatus || category !== "전체" || search) && (
            <button onClick={() => { setFilterStatus(null); setCategory("전체"); setSearch(""); }} className="mt-2 text-xs text-[#246BFD] font-semibold hover:underline">
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredExisting.map(rec => (
            <ExistingRecCard
              key={rec.id}
              rec={rec}
              onClick={() => navigate(`/store/actions/${rec.id}`)}
            />
          ))}
        </div>
      )}

      {drawerRec && (
        <DetailDrawer
          rec={drawerRec}
          onClose={() => setDrawerRec(null)}
          onExecute={() => setDrawerRec(null)}
        />
      )}
    </PageShell>
  );
}
