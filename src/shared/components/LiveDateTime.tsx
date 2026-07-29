import { useLiveDateTime } from "../hooks/useLiveDateTime";

export function LiveDateTime({ className = "" }: { className?: string }) {
  const { dateTime, label } = useLiveDateTime();

  return (
    <span className={`items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-[#0E9F6E]" />
      <time dateTime={dateTime}>{label}</time>
    </span>
  );
}
