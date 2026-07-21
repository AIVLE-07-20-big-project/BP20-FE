import { clsx } from "clsx";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx("flex flex-col items-center justify-center py-16 px-8 text-center", className)}>
      {icon && <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm font-semibold text-[#246BFD] hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
