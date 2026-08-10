import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import {
  getIamLogs,
  type IamLog,
  type IamLogAction,
} from "../../features/iam/api/iamLogApi";
import { ApiError } from "../../shared/api/apiClient";
import { Badge } from "../../shared/components/Badge";
import { PageShell } from "../../shared/components/PageShell";

const ACTION_LABEL: Record<IamLogAction, string> = {
  SUPER_ADMIN_CREATED: "최고 관리자 생성",
  ADMIN_INVITATION_CREATED: "관리자 초대 생성",
  ADMIN_INVITATION_ACCEPTED: "관리자 초대 수락",
  ADMIN_INVITATION_REVOKED: "관리자 초대 취소",
  STORE_OWNER_INVITATION_CREATED: "점주 초대 생성",
  STORE_OWNER_INVITATION_ACCEPTED: "점주 초대 수락",
  STORE_OWNER_INVITATION_REVOKED: "점주 초대 취소",
  ADMIN_DEACTIVATED: "관리자 비활성화",
  ADMIN_ACTIVATED: "관리자 활성화",
  ADMIN_PERSONAL_DATA_REVEALED: "관리자 개인정보 원문 조회",
  ADMIN_PERSONAL_DATA_REVEAL_FAILED: "관리자 개인정보 재인증 실패",
  STORE_OWNER_DEACTIVATED: "점주 비활성화",
  STORE_OWNER_ACTIVATED: "점주 활성화",
  STORE_OWNER_PERSONAL_DATA_REVEALED: "점주 개인정보 원문 조회",
  STORE_OWNER_PERSONAL_DATA_REVEAL_FAILED: "점주 개인정보 재인증 실패",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function IAMLogsPage() {
  const [logs, setLogs] = useState<IamLog[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      setLogs(await getIamLogs());
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "IAM 로그를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <PageShell
      title="IAM 로그"
      subtitle="최고 관리자 전용 계정·초대 관리 작업 기록입니다."
      actions={(
        <button
          type="button"
          onClick={() => void loadLogs()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </button>
      )}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">IAM 로그를 불러오는 중입니다.</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">기록된 IAM 로그가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["일시", "행위자 ID", "작업", "대상", "결과", "IP", ""].map((header) => (
                    <th key={header} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr className="border-b border-border hover:bg-muted/20">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold">{log.actorUserId ?? "CLI"}</td>
                      <td className="px-4 py-3">{ACTION_LABEL[log.action]}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground">
                        {log.targetEmail ?? (log.targetUserId ? `사용자 #${log.targetUserId}` : "-")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={log.action.endsWith("_FAILED") ? "negative" : "positive"}>
                          {log.action.endsWith("_FAILED") ? "실패" : "성공"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{log.sourceIp}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {expanded === log.id
                            ? <ChevronUp className="h-3.5 w-3.5" />
                            : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr className="border-b border-border bg-muted/30">
                        <td colSpan={7} className="px-4 py-3">
                          <code className="text-xs">
                            action={log.action}, actorUserId={log.actorUserId ?? "null"},
                            targetUserId={log.targetUserId ?? "null"}, targetEmail={log.targetEmail ?? "null"}
                          </code>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
