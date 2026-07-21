import { useState } from "react";
import {
  Plus, Search, Pin, AlertTriangle, ChevronRight, X, Edit2,
  Copy, XCircle, Calendar, Eye, Users, Globe, Tag, Clock,
  FileText, CheckCircle2, Megaphone
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";

type NoticeStatus = "게시 중" | "게시 예정" | "임시 저장" | "종료됨";
type NoticeCategory = "서비스 안내" | "점검 안내" | "기능 업데이트" | "정책 변경" | "긴급 공지";
type AudienceType = "전체 가맹점" | "선택 가맹점" | "지역" | "업종";

interface Notice {
  id: string;
  pinned: boolean;
  urgent: boolean;
  status: NoticeStatus;
  category: NoticeCategory;
  title: string;
  audience: AudienceType;
  author: string;
  publishDate: string;
  viewCount: number;
  viewRate: number;
  updatedAt: string;
  body: string;
}

const NOTICES: Notice[] = [
  { id: "n1", pinned: true, urgent: false, status: "게시 중", category: "기능 업데이트", title: "AI 전략 추천 기능 업데이트 안내 (v2.4)", audience: "전체 가맹점", author: "박준혁", publishDate: "07.18", viewCount: 284, viewRate: 91, updatedAt: "07.18", body: "AI 전략 추천 기능이 업데이트되어 더욱 정확한 분석 결과를 제공합니다." },
  { id: "n2", pinned: false, urgent: true, status: "게시 중", category: "긴급 공지", title: "[긴급] POS 연동 오류 복구 완료 안내", audience: "전체 가맹점", author: "이서연", publishDate: "07.17", viewCount: 312, viewRate: 96, updatedAt: "07.17", body: "07.17 오전 발생한 POS 연동 오류가 복구되었습니다." },
  { id: "n3", pinned: false, urgent: false, status: "게시 예정", category: "점검 안내", title: "정기 시스템 점검 안내 (7월 22일 새벽 2~4시)", audience: "전체 가맹점", author: "박준혁", publishDate: "07.22", viewCount: 0, viewRate: 0, updatedAt: "07.16", body: "정기 점검이 7월 22일 새벽 2시부터 4시까지 진행될 예정입니다." },
  { id: "n4", pinned: false, urgent: false, status: "게시 중", category: "정책 변경", title: "서비스 이용약관 개정 안내 (2025년 8월 1일 적용)", audience: "전체 가맹점", author: "이서연", publishDate: "07.15", viewCount: 198, viewRate: 63, updatedAt: "07.15", body: "서비스 이용약관이 8월 1일부터 개정됩니다." },
  { id: "n5", pinned: false, urgent: false, status: "임시 저장", category: "서비스 안내", title: "[초안] 8월 성수기 대비 AI 추천 활용 가이드", audience: "전체 가맹점", author: "박준혁", publishDate: "—", viewCount: 0, viewRate: 0, updatedAt: "07.14", body: "초안 작성 중입니다." },
  { id: "n6", pinned: false, urgent: false, status: "종료됨", category: "서비스 안내", title: "6월 정기 점검 완료 안내", audience: "전체 가맹점", author: "이서연", publishDate: "06.28", viewCount: 301, viewRate: 88, updatedAt: "06.28", body: "6월 정기 점검이 완료되었습니다." },
];

const STATUS_STYLE: Record<NoticeStatus, string> = {
  "게시 중": "bg-[#0E9F6E]/10 text-[#0E9F6E]",
  "게시 예정": "bg-[#246BFD]/10 text-[#246BFD]",
  "임시 저장": "bg-muted text-muted-foreground",
  "종료됨": "bg-gray-100 text-gray-400",
};

const CATEGORY_COLORS: Record<NoticeCategory, string> = {
  "서비스 안내": "text-[#246BFD] bg-[#246BFD]/8",
  "점검 안내": "text-amber-600 bg-amber-50",
  "기능 업데이트": "text-[#8B5CF6] bg-[#8B5CF6]/8",
  "정책 변경": "text-gray-600 bg-gray-100",
  "긴급 공지": "text-red-600 bg-red-50",
};

const SUMMARY = [
  { label: "게시 중", count: NOTICES.filter(n => n.status === "게시 중").length, color: "text-[#0E9F6E]" },
  { label: "게시 예정", count: NOTICES.filter(n => n.status === "게시 예정").length, color: "text-[#246BFD]" },
  { label: "임시 저장", count: NOTICES.filter(n => n.status === "임시 저장").length, color: "text-muted-foreground" },
  { label: "종료됨", count: NOTICES.filter(n => n.status === "종료됨").length, color: "text-gray-400" },
];

type ComposeMode = "create" | "edit";

interface ComposePanelProps {
  initial?: Notice;
  mode: ComposeMode;
  onClose: () => void;
  isSuperAdmin: boolean;
}

function ComposePanel({ initial, mode, onClose, isSuperAdmin }: ComposePanelProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [category, setCategory] = useState<NoticeCategory>(initial?.category || "서비스 안내");
  const [body, setBody] = useState(initial?.body || "");
  const [audience, setAudience] = useState<AudienceType>(initial?.audience || "전체 가맹점");
  const [pinned, setPinned] = useState(initial?.pinned || false);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto z-10 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold">{mode === "create" ? "공지 작성" : "공지 수정"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold mb-1">제목</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="공지 제목을 입력하세요" className="w-full h-9 px-3 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">분류</label>
              <select value={category} onChange={e => setCategory(e.target.value as NoticeCategory)} className="w-full h-9 px-3 text-xs bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30">
                {(["서비스 안내", "점검 안내", "기능 업데이트", "정책 변경", "긴급 공지"] as NoticeCategory[]).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">대상</label>
              <select value={audience} onChange={e => setAudience(e.target.value as AudienceType)} className="w-full h-9 px-3 text-xs bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30">
                {(["전체 가맹점", "선택 가맹점", "지역", "업종"] as AudienceType[]).map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">본문</label>
            <div className="bg-muted rounded-xl p-1 mb-1 flex gap-1 text-xs text-muted-foreground">
              {["B", "I", "U", "링크", "목록"].map(f => (
                <button key={f} className="px-2 py-1 rounded hover:bg-card hover:text-foreground transition-colors font-semibold">{f}</button>
              ))}
            </div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              placeholder="공지 내용을 입력하세요..."
              className="w-full px-3 py-2 text-sm bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30 resize-none"
            />
          </div>

          <div className="space-y-2">
            {isSuperAdmin && (
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="w-4 h-4 rounded accent-[#246BFD]" />
                <Pin className="w-3.5 h-3.5 text-muted-foreground" />
                중요 공지로 고정 (최고 관리자 전용)
              </label>
            )}
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={schedulePublish} onChange={e => setSchedulePublish(e.target.checked)} className="w-4 h-4 rounded accent-[#246BFD]" />
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              게시 예약
            </label>
          </div>

          {schedulePublish && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">게시 시작</label>
                <input type="date" className="w-full h-8 px-3 text-xs bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">게시 종료</label>
                <input type="date" className="w-full h-8 px-3 text-xs bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1">알림 채널</label>
            <div className="flex gap-3">
              {["인앱 알림", "이메일", "SMS"].map(ch => (
                <label key={ch} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" defaultChecked={ch === "인앱 알림"} className="w-3.5 h-3.5 rounded accent-[#246BFD]" /> {ch}
                </label>
              ))}
            </div>
          </div>

          {saved && (
            <div className="flex items-center gap-2 text-xs text-[#0E9F6E] bg-[#0E9F6E]/8 border border-[#0E9F6E]/20 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> 임시 저장되었습니다.
            </div>
          )}
        </div>

        <div className="px-5 pb-5 border-t border-border pt-4 space-y-2">
          <button className="w-full h-10 bg-[#246BFD] text-white text-sm font-bold rounded-xl hover:bg-[#1D4ED8] transition-colors">
            {schedulePublish ? "게시 예약" : "지금 게시"}
          </button>
          <div className="flex gap-2">
            <button onClick={() => setSaved(true)} className="flex-1 h-9 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">임시 저장</button>
            <button onClick={onClose} className="flex-1 h-9 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">취소</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DetailDrawerProps {
  notice: Notice;
  onClose: () => void;
  onEdit: () => void;
  isSuperAdmin: boolean;
}

function DetailDrawer({ notice, onClose, onEdit, isSuperAdmin }: DetailDrawerProps) {
  const [confirmEnd, setConfirmEnd] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto z-10 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {notice.pinned && <Pin className="w-3.5 h-3.5 text-[#246BFD]" />}
            {notice.urgent && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
            <h3 className="font-bold text-sm truncate">{notice.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          <div className="flex flex-wrap gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[notice.status]}`}>{notice.status}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${CATEGORY_COLORS[notice.category]}`}>{notice.category}</span>
          </div>

          <div className="space-y-2 text-sm">
            {[
              { icon: Users, label: "대상", value: notice.audience },
              { icon: Tag, label: "작성자", value: notice.author },
              { icon: Calendar, label: "게시일", value: notice.publishDate },
              { icon: Clock, label: "최종 수정", value: notice.updatedAt },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <r.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground w-16">{r.label}</span>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </div>

          {notice.status === "게시 중" && (
            <div className="bg-[#246BFD]/5 border border-[#246BFD]/15 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold"><Eye className="w-3.5 h-3.5 text-[#246BFD]" />조회 통계</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-muted-foreground">조회 매장 수</div><div className="text-xl font-black">{notice.viewCount}</div></div>
                <div><div className="text-muted-foreground">확인률</div><div className="text-xl font-black">{notice.viewRate}%</div></div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div className="h-full bg-[#246BFD] rounded-full" style={{ width: `${notice.viewRate}%` }} />
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">본문</div>
            <div className="text-sm leading-relaxed bg-muted/50 rounded-2xl p-4">{notice.body}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">편집 이력</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>{notice.updatedAt} — {notice.author} 작성/수정</div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 border-t border-border pt-4 space-y-2">
          <div className="flex gap-2">
            <button onClick={onEdit} className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#246BFD]/10 text-[#246BFD] border border-[#246BFD]/20 rounded-xl hover:bg-[#246BFD]/20 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> 수정
            </button>
            <button className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">
              <Copy className="w-3.5 h-3.5" /> 복제
            </button>
          </div>
          {notice.status === "게시 중" && !confirmEnd && (
            <button onClick={() => setConfirmEnd(true)} className="w-full h-9 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
              <XCircle className="w-3.5 h-3.5" /> 게시 종료
            </button>
          )}
          {confirmEnd && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
              <p className="text-xs text-red-700 font-semibold">이 공지를 종료하시겠습니까? 이 작업은 즉시 적용됩니다.</p>
              <div className="flex gap-2">
                <button className="flex-1 h-8 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">종료 확인</button>
                <button onClick={() => setConfirmEnd(false)} className="flex-1 h-8 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">취소</button>
              </div>
            </div>
          )}
          {isSuperAdmin && (
            <button className="w-full h-9 text-xs font-semibold text-red-600 hover:underline">삭제</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NoticesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NoticeStatus | "전체">("전체");
  const [categoryFilter, setCategoryFilter] = useState<NoticeCategory | "전체">("전체");
  const [audienceFilter, setAudienceFilter] = useState<AudienceType | "전체">("전체");
  const [sort, setSort] = useState("최신 게시순");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [composeMode, setComposeMode] = useState<ComposeMode | null>(null);
  const [composeInitial, setComposeInitial] = useState<Notice | undefined>(undefined);

  const filtered = NOTICES.filter(n => {
    if (search && !n.title.includes(search) && !n.author.includes(search)) return false;
    if (statusFilter !== "전체" && n.status !== statusFilter) return false;
    if (categoryFilter !== "전체" && n.category !== categoryFilter) return false;
    if (audienceFilter !== "전체" && n.audience !== audienceFilter) return false;
    return true;
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-8 max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">공지 관리</h1>
            <p className="text-sm text-muted-foreground mt-0.5">가맹점에 전달할 서비스 공지와 운영 안내를 작성하고 게시 상태를 관리합니다.</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs font-semibold px-3 py-2 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> 게시 예약 관리
            </button>
            <button
              onClick={() => { setComposeInitial(undefined); setComposeMode("create"); }}
              className="text-xs font-semibold px-4 py-2 bg-[#246BFD] text-white rounded-xl hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> 공지 작성
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {SUMMARY.map(s => (
            <button
              key={s.label}
              onClick={() => setStatusFilter(statusFilter === s.label ? "전체" : s.label as NoticeStatus)}
              className={`bg-card border border-border rounded-2xl p-4 text-left hover:border-[#246BFD]/30 transition-colors ${statusFilter === s.label ? "ring-2 ring-[#246BFD]/30" : ""}`}
            >
              <div className={`text-2xl font-black tabular-nums ${s.color}`}>{s.count}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="제목 또는 작성자 검색"
              className="w-full h-8 pl-8 pr-3 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as NoticeStatus | "전체")}
            className="text-xs h-8 px-3 bg-card border border-border rounded-xl text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
          >
            {(["전체", "게시 중", "게시 예정", "임시 저장", "종료됨"] as const).map(v => <option key={v}>{v}</option>)}
          </select>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as NoticeCategory | "전체")}
            className="text-xs h-8 px-3 bg-card border border-border rounded-xl text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
          >
            {(["전체", "서비스 안내", "점검 안내", "기능 업데이트", "정책 변경", "긴급 공지"] as const).map(v => <option key={v}>{v}</option>)}
          </select>
          <select
            value={audienceFilter}
            onChange={e => setAudienceFilter(e.target.value as AudienceType | "전체")}
            className="text-xs h-8 px-3 bg-card border border-border rounded-xl text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
          >
            {(["전체", "전체 가맹점", "선택 가맹점", "지역", "업종"] as const).map(v => <option key={v}>{v}</option>)}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-xs h-8 px-3 bg-card border border-border rounded-xl text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30 ml-auto"
          >
            {["최신 게시순", "수정일순", "조회순"].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {/* Board table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">조건에 맞는 공지가 없습니다.</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="border-b border-border">
                <tr>
                  {["", "상태", "분류", "제목", "대상", "작성자", "게시일", "확인률", "최종 수정"].map(h => (
                    <th key={h} className="text-left text-muted-foreground font-semibold px-4 py-3 first:px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr
                    key={n.id}
                    onClick={() => setSelectedNotice(n)}
                    className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {n.pinned && <Pin className="w-3.5 h-3.5 text-[#246BFD]" />}
                        {n.urgent && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[n.status]}`}>{n.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${CATEGORY_COLORS[n.category]}`}>{n.category}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold max-w-xs">
                      <div className="flex items-center gap-1.5">
                        {n.urgent && <span className="text-[10px] font-black text-red-600 bg-red-50 px-1 rounded">긴급</span>}
                        <span className="truncate">{n.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{n.audience}</td>
                    <td className="px-4 py-3 text-muted-foreground">{n.author}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{n.publishDate}</td>
                    <td className="px-4 py-3">
                      {n.status === "게시 중" ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-[#246BFD] rounded-full" style={{ width: `${n.viewRate}%` }} />
                          </div>
                          <span className="tabular-nums">{n.viewRate}%</span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{n.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination stub */}
        <div className="flex items-center justify-center gap-1 mt-4 text-xs text-muted-foreground">
          <button className="px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">이전</button>
          <span className="px-3 py-1.5 bg-[#246BFD]/10 text-[#246BFD] rounded-lg font-semibold">1</span>
          <button className="px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">2</button>
          <button className="px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">다음</button>
        </div>
      </div>

      {selectedNotice && (
        <DetailDrawer
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
          onEdit={() => { setComposeInitial(selectedNotice); setComposeMode("edit"); setSelectedNotice(null); }}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {composeMode && (
        <ComposePanel
          initial={composeInitial}
          mode={composeMode}
          onClose={() => setComposeMode(null)}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}
