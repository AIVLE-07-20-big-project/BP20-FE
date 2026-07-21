import { clsx } from "clsx";
import type { ConnectionStatus, RiskLevel } from "../../entities/merchant/merchant.types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "positive" | "warning" | "negative" | "info" | "mint" | "indigo" | "sky" | "muted";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  default: "bg-gray-100 text-gray-700",
  positive: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  negative: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  mint: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  indigo: "bg-indigo-50 text-indigo-600 border border-indigo-200",
  sky: "bg-sky-50 text-sky-700 border border-sky-200",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ children, variant = "default", size = "sm", icon }: BadgeProps) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 font-semibold rounded-full",
      size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1",
      variantClasses[variant]
    )}>
      {icon}
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, { label: string; variant: BadgeProps["variant"] }> = {
    critical: { label: "위험", variant: "negative" },
    high: { label: "주의", variant: "warning" },
    watch: { label: "관찰", variant: "warning" },
    medium: { label: "보통", variant: "info" },
    low: { label: "양호", variant: "positive" },
    stable: { label: "안정", variant: "positive" },
  };
  const { label, variant } = map[level] || { label: level, variant: "muted" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const map: Record<ConnectionStatus, { label: string; variant: BadgeProps["variant"]; dot: string }> = {
    connected: { label: "연동 정상", variant: "positive", dot: "bg-emerald-500" },
    delayed: { label: "지연", variant: "warning", dot: "bg-amber-500" },
    disconnected: { label: "연결 끊김", variant: "negative", dot: "bg-red-500" },
    error: { label: "오류", variant: "negative", dot: "bg-red-500" },
  };
  const { label, variant, dot } = map[status];
  return (
    <Badge variant={variant}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}
