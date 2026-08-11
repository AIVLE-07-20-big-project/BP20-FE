import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, FileText, Megaphone, X } from "lucide-react";
import { getAccessToken } from "../../auth/model/authSession";
import {
  getPublishedNotices,
  type NoticeApi,
} from "../api/noticesApi";
import { apiUrl } from "../../../shared/config/runtimeEnv";
import { LEGAL_CONFIG } from "../../../pages/legal/legalConfig";

const NOTICE_AUTHOR = `${LEGAL_CONFIG.serviceName} 운영팀`;

const DEMO_NOTICES: NoticeApi[] = [
  {
    id: 1,
    title: "AI 전략 추천 기능 업데이트 안내",
    body: "추천 근거와 예상 효과를 더 쉽게 확인할 수 있도록 화면이 개선되었습니다.",
    category: "기능 업데이트",
    audience: "전체 가맹점",
    status: "PUBLISHED",
    urgent: false,
    author: NOTICE_AUTHOR,
    createdAt: "2026-07-28T09:00:00",
    updatedAt: "2026-07-28T09:00:00",
  },
  {
    id: 2,
    title: "POS 연동 점검 완료 안내",
    body: "정기 점검이 완료되어 현재 모든 POS 연동 기능을 정상적으로 이용할 수 있습니다.",
    category: "점검 안내",
    audience: "전체 가맹점",
    status: "PUBLISHED",
    urgent: true,
    author: NOTICE_AUTHOR,
    createdAt: "2026-07-27T15:30:00",
    updatedAt: "2026-07-27T15:30:00",
  },
];

export function StoreNoticePopover({ isDemo }: { isDemo: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<NoticeApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isDemo) {
      setNotices(DEMO_NOTICES);
      setLoading(false);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("공지사항을 불러오려면 다시 로그인해 주세요.");
      setLoading(false);
      return;
    }

    getPublishedNotices(token)
      .then(setNotices)
      .catch(() => setError("공지사항을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [isDemo]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="공지 알림"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`relative rounded-lg p-2 transition-colors ${
          open ? "bg-[#EAF2FF] text-[#246BFD]" : "text-muted-foreground hover:bg-muted"
        }`}
      >
        <Bell className="h-5 w-5" />
        {notices.length > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#D92D20]" />
        )}
      </button>

      {open && (
        <section className="absolute right-0 top-11 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#D8E3F2] bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-[#F4F8FF] to-white px-4 py-3.5">
            <div>
              <h2 className="text-sm font-bold">공지 알림</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{NOTICE_AUTHOR}에서 전달한 최신 안내입니다.</p>
            </div>
            <button
              type="button"
              aria-label="공지 알림 닫기"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {loading ? (
              <NoticeState message="공지사항을 불러오는 중입니다." loading />
            ) : error ? (
              <NoticeState message={error} />
            ) : notices.length === 0 ? (
              <NoticeState message="새로운 공지사항이 없습니다." />
            ) : (
              <div className="divide-y divide-border">
                {notices.slice(0, 5).map((notice) => (
                  <article key={notice.id} className="px-4 py-3.5 hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      {notice.urgent && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                      <span className="rounded-md bg-[#EAF2FF] px-1.5 py-0.5 text-[10px] font-bold text-[#246BFD]">
                        {notice.category}
                      </span>
                      <time className="ml-auto text-[10px] text-muted-foreground">
                        {formatNoticeDate(notice.updatedAt)}
                      </time>
                    </div>
                    <h3 className="mt-2 text-sm font-bold leading-snug">{notice.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{notice.body}</p>
                    {notice.attachment && (
                      <a
                        href={apiUrl(`/api/notices/${notice.id}/attachment`)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#246BFD] hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {notice.attachment.originalName}
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function NoticeState({ message, loading = false }: { message: string; loading?: boolean }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center text-xs text-muted-foreground">
      {loading
        ? <span className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#246BFD]/20 border-t-[#246BFD]" />
        : <Megaphone className="mb-3 h-7 w-7 opacity-35" />}
      {message}
    </div>
  );
}

function formatNoticeDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}
