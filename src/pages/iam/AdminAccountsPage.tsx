import { useState } from "react";
import { Shield, UserPlus, UserX, CheckCircle2, X } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { Badge } from "../../shared/components/Badge";

const ADMINS = [
  { id: "a1", name: "박준혁", email: "junhyuk@bp20.com", status: "활성", invitedBy: "이서연", joinedAt: "2024-10-15", lastLogin: "2025-07-20", scope: "전체" },
  { id: "a2", name: "이수빈", email: "subin@bp20.com", status: "활성", invitedBy: "이서연", joinedAt: "2024-12-01", lastLogin: "2025-07-19", scope: "서울·경기" },
  { id: "a3", name: "최민준", email: "minjun@bp20.com", status: "활성", invitedBy: "박준혁", joinedAt: "2025-02-20", lastLogin: "2025-07-18", scope: "부산·대전" },
  { id: "a4", name: "강하은", email: "haeun@bp20.com", status: "비활성", invitedBy: "이서연", joinedAt: "2025-01-10", lastLogin: "2025-05-12", scope: "전체" },
];

export function AdminAccountsPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const handleInvite = () => {
    setInviteSent(true);
    setTimeout(() => { setInviteSent(false); setShowInvite(false); setInviteEmail(""); }, 2000);
  };

  return (
    <PageShell
      title="관리자 계정"
      subtitle="SUPER_ADMIN 전용 기능"
      actions={
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[#087F65] text-white rounded-xl hover:bg-[#066652] transition-colors">
          <UserPlus className="w-3.5 h-3.5" />
          관리자 초대
        </button>
      }
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["이름", "이메일", "상태", "초대자", "가입일", "최근 로그인", "관할 범위", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADMINS.map((admin) => (
                <tr key={admin.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#5B6CFF]/10 flex items-center justify-center text-xs font-bold text-[#5B6CFF]">
                        {admin.name[0]}
                      </div>
                      <span className="font-semibold">{admin.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={admin.status === "활성" ? "positive" : "muted"}>{admin.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{admin.invitedBy}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{admin.joinedAt}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{admin.lastLogin}</td>
                  <td className="px-4 py-3"><Badge variant="muted">{admin.scope}</Badge></td>
                  <td className="px-4 py-3">
                    <button
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        admin.status === "활성" ? "text-muted-foreground hover:text-red-600" : "text-muted-foreground hover:text-[#0E9F6E]"
                      } transition-colors`}
                    >
                      {admin.status === "활성" ? <UserX className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {admin.status === "활성" ? "비활성화" : "활성화"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl">
            {inviteSent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-[#0E9F6E] mx-auto mb-2" />
                <p className="font-bold">초대 이메일이 발송되었습니다.</p>
                <p className="text-xs text-muted-foreground mt-1">IAM 로그에서 확인할 수 있습니다.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#5B6CFF]" />
                    <h3 className="font-bold">관리자 초대</h3>
                  </div>
                  <button onClick={() => setShowInvite(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">이메일 주소</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="newadmin@company.com"
                      className="w-full h-10 px-3 text-sm bg-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-[#18C79A]/40"
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                    초대받은 계정은 7일 내에 가입을 완료해야 합니다. 임시 자격증명은 최초 1회만 확인 가능합니다.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleInvite} disabled={!inviteEmail} className="flex-1 h-10 bg-[#087F65] text-white text-sm font-bold rounded-xl hover:bg-[#066652] transition-colors disabled:opacity-50">
                    초대 발송
                  </button>
                  <button onClick={() => setShowInvite(false)} className="flex-1 h-10 bg-muted text-sm font-semibold rounded-xl hover:bg-muted-foreground/10 transition-colors">
                    취소
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
