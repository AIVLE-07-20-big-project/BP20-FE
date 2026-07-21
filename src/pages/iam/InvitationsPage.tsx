import { useState } from "react";
import { Copy, RotateCcw, Ban, Check } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { Badge } from "../../shared/components/Badge";
import { INVITATIONS } from "../../mocks";
import type { InvitationStatus } from "../../entities/invitation/invitation.types";

const STATUS_STYLE: Record<InvitationStatus, { variant: any }> = {
  "대기": { variant: "warning" },
  "수락": { variant: "positive" },
  "만료": { variant: "muted" },
  "취소": { variant: "negative" },
};

export function InvitationsPage() {
  const [filter, setFilter] = useState<string>("전체");
  const [copied, setCopied] = useState<string | null>(null);

  const filters = ["전체", "대기", "수락", "만료", "취소"];

  const filtered = filter === "전체"
    ? INVITATIONS
    : INVITATIONS.filter((inv) => inv.status === filter);

  const handleCopy = (id: string) => {
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <PageShell title="초대 관리" subtitle="SUPER_ADMIN 전용 기능">
      <div className="flex gap-1 mb-4">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
            filter === f ? "bg-[#087F65] text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}>{f}</button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["이메일", "역할", "초대자", "상태", "발송일", "만료일", "작업"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{inv.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={inv.role === "STORE_OWNER" ? "mint" : "indigo"}>
                      {inv.role === "STORE_OWNER" ? "점주" : "관리자"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.invitedBy}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_STYLE[inv.status].variant}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{inv.createdAt}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{inv.expiresAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {inv.status === "대기" && (
                        <>
                          <button
                            onClick={() => handleCopy(inv.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            title="임시 자격증명 복사 (1회)"
                          >
                            {copied === inv.id ? <Check className="w-3.5 h-3.5 text-[#0E9F6E]" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === inv.id ? "복사됨" : "코드"}
                          </button>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors">
                            <Ban className="w-3.5 h-3.5" />
                            취소
                          </button>
                        </>
                      )}
                      {inv.status === "만료" && (
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <RotateCcw className="w-3.5 h-3.5" />
                          재발송
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
