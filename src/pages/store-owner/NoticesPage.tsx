import { useEffect, useState } from "react";
import { FileText, Megaphone } from "lucide-react";
import { getAccessToken } from "../../features/auth/model/authSession";
import { getPublishedNotices, type NoticeApi } from "../../features/notices/api/noticesApi";

export function NoticesPage() {
  const [notices, setNotices] = useState<NoticeApi[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (token) getPublishedNotices(token).then(setNotices).catch(() => undefined);
  }, []);

  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">공지사항</h1>
          <p className="text-sm text-muted-foreground mt-1">관리자가 전달한 운영 공지를 확인하세요.</p>
        </div>
        <div className="space-y-3">
          {notices.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-sm text-muted-foreground">
              <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-40" />등록된 공지가 없습니다.
            </div>
          ) : notices.map(notice => (
            <article key={notice.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-[#246BFD] bg-[#246BFD]/10 px-2 py-1 rounded">{notice.category}</span>
                <span className="text-xs text-muted-foreground">{notice.author}</span>
              </div>
              <h2 className="text-base font-bold">{notice.title}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap mt-3 text-muted-foreground">{notice.body}</p>
              {notice.attachment && (
                <a href={baseUrl + "/api/notices/" + notice.id + "/attachment"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 text-sm text-[#246BFD] hover:underline">
                  <FileText className="w-4 h-4" />{notice.attachment.originalName} 다운로드
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
