import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { Badge } from "./Badge";

interface AIInsightCardProps {
  title: string;
  summary: string;
  confidence: number;
  impact?: string;
  evidences?: string[];
  actions?: { label: string; onClick: () => void; primary?: boolean }[];
  priority?: "P1" | "P2" | "P3";
  category?: string;
  dark?: boolean;
}

export function AIInsightCard({ title, summary, confidence, impact, evidences = [], actions = [], priority, category, dark }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  const confidenceColor = confidence >= 80 ? "text-[#0E9F6E]" : confidence >= 60 ? "text-[#D97706]" : "text-[#D92D20]";

  return (
    <div className={clsx(
      "rounded-2xl border p-4 flex flex-col gap-3",
      dark ? "bg-[#111A2E] border-white/10 text-white" : "bg-card border-border"
    )}>
      <div className="flex items-start gap-2">
        <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
          dark ? "bg-[#8B5CF6]/20" : "bg-[#246BFD]/10"
        )}>
          <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={clsx("text-[11px] font-bold px-1.5 py-0.5 rounded",
              dark ? "bg-[#8B5CF6]/20 text-[#C4B5FD]" : "bg-[#246BFD]/10 text-[#246BFD]"
            )}>AI 분석</span>
            {category && <span className={clsx("text-[11px] font-semibold", dark ? "text-white/50" : "text-muted-foreground")}>{category}</span>}
            {priority && <Badge variant="indigo">{priority}</Badge>}
          </div>
          <h4 className={clsx("font-bold text-sm leading-snug", dark ? "text-white" : "text-foreground")}>{title}</h4>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className={clsx("text-[11px] font-bold", confidenceColor)}>신뢰도 {confidence}%</div>
          <div className={clsx("text-[10px]", dark ? "text-white/40" : "text-muted-foreground")}>AI 추정</div>
        </div>
      </div>

      <p className={clsx("text-xs leading-relaxed", dark ? "text-white/70" : "text-muted-foreground")}>{summary}</p>

      {impact && (
        <div className={clsx("rounded-xl px-3 py-2 text-xs font-semibold",
          dark ? "bg-white/5 text-[#93BBFD]" : "bg-[#246BFD]/8 text-[#246BFD]"
        )}>
          예상 효과: {impact}
        </div>
      )}

      {evidences.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className={clsx("flex items-center gap-1 text-xs font-semibold",
              dark ? "text-[#38BDF8]" : "text-[#246BFD]"
            )}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            분석 근거 보기 ({evidences.length}개)
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {evidences.map((e, i) => (
                <li key={i} className={clsx("flex items-start gap-1.5 text-xs",
                  dark ? "text-white/60" : "text-muted-foreground"
                )}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-1.5 flex-shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={clsx("flex items-center gap-1 text-[10px]", dark ? "text-white/30" : "text-muted-foreground/60")}>
        <AlertCircle className="w-3 h-3" />
        AI 분석은 참고용이며 인과관계를 보장하지 않습니다.
      </div>

      {actions.length > 0 && (
        <div className="flex gap-2 pt-1">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className={clsx(
                "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
                action.primary
                  ? "bg-[#246BFD] text-white hover:bg-[#1D4ED8]"
                  : dark
                    ? "bg-white/10 text-white/80 hover:bg-white/20"
                    : "bg-muted text-foreground hover:bg-muted-foreground/10"
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
