import { useState } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { ActionItem } from "../api/review";

interface ActionItemCardProps {
    item: ActionItem;
    onComplete: () => void;
}

export default function ActionItemCard({ item, onComplete }: ActionItemCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const ASPECT_MAP: Record<string, string> = {
    food: "음식",
    service: "서비스",
    price: "가격",
    atmosphere: "분위기",
    convenience: "편의성"
  }

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className="bg-muted/50 hover:bg-muted/80 transition-colors rounded-xl p-3.5 cursor-pointer space-y-2 border border-transparent hover:border-border"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#246BFD]/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-[#246BFD]" />
          </div>
          <span className="text-sm font-semibold">{item.keyword}</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              item.priority === "HIGH"
                ? "bg-red-50 text-red-600"
                : item.priority === "MEDIUM"
                ? "bg-orange-50 text-orange-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {item.priority}
          </span>
          <div className="flex items-center gap-3">
            <button 
                disabled={!!item.executedAt}
                onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    item.executedAt
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#246BFD] text-white hover:bg-[#246BFD]/90"
                }`}
                >
                {item.executedAt ? "완료" : "실행"}
            </button>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="pt-2 border-t border-border/50 text-xs space-y-1.5 text-muted-foreground animate-in fade-in-50 duration-200">
          <p>
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                {ASPECT_MAP[item.aspect] || item.aspect}
            </span>
          </p>
          <p>
            <strong className="text-foreground">원인:</strong> {item.problemCause}
          </p>
          <p>
            <strong className="text-foreground">권장:</strong> {item.actionPlan}
          </p>
          <p className="text-[#0E9F6E]">
            <strong className="text-[#0E9F6E]">예상 효과:</strong> {item.expectedOutcome}
          </p>
        </div>
      )}
    </div>
  );
}