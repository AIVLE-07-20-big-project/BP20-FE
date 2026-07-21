import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx";

interface MetricCardProps {
  label: string;
  value: string;
  subLabel?: string;
  change?: number;
  changePeriod?: string;
  icon?: React.ReactNode;
  accent?: boolean;
  mini?: boolean;
  children?: React.ReactNode;
}

export function MetricCard({ label, value, subLabel, change, changePeriod = "전주 대비", icon, accent, mini, children }: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className={clsx(
      "bg-card border border-border rounded-2xl p-4 flex flex-col gap-2",
      accent && "border-l-4 border-l-[#246BFD]",
      mini && "p-3 gap-1"
    )}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium leading-tight">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className={clsx("font-bold tabular-nums leading-none", mini ? "text-xl" : "text-2xl")}>{value}</span>
        {subLabel && <span className="text-xs text-muted-foreground mb-0.5">{subLabel}</span>}
      </div>
      {change !== undefined && (
        <div className={clsx("flex items-center gap-1 text-xs font-semibold",
          isPositive && "text-[#0E9F6E]",
          isNegative && "text-[#D92D20]",
          !isPositive && !isNegative && "text-muted-foreground"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          <span>{changePeriod} {Math.abs(change)}% {isPositive ? "증가" : isNegative ? "감소" : "동일"}</span>
        </div>
      )}
      {children}
    </div>
  );
}
