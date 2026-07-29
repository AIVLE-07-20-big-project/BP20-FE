interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  freshness?: string;
}

export function PageShell({ title, subtitle, actions, children, freshness }: PageShellProps) {
  return (
    <div className="flex flex-col h-full min-h-0 print:block print:h-auto">
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 flex-shrink-0 print:px-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          {freshness && (
            <div className="flex items-center gap-1.5 mt-1 print:hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E9F6E] animate-pulse" />
              <span className="text-xs text-muted-foreground">{freshness}</span>
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6 print:overflow-visible print:h-auto print:px-0">
        {children}
      </div>
    </div>
  );
}
