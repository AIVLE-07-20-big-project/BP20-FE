import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";
import { Badge } from "../../shared/components/Badge";
import { IAM_LOGS } from "../../mocks";

export function IAMLogsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <PageShell title="IAM 로그" subtitle="변경 불가능한 감사 기록입니다. SUPER_ADMIN 전용 기능.">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["타임스탬프", "행위자", "액션", "대상", "결과", "IP", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IAM_LOGS.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3 font-semibold">{log.actor}</td>
                    <td className="px-4 py-3">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{log.target}</td>
                    <td className="px-4 py-3">
                      <Badge variant={log.result === "성공" ? "positive" : log.result === "거부" ? "warning" : "negative"}>
                        {log.result}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{log.ipSummary}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {expanded === log.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr className="bg-muted/30 border-b border-border">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">상세:</span>
                          <code className="text-xs font-mono bg-card border border-border px-2 py-1 rounded-lg">{log.detail}</code>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
