import { Construction } from "lucide-react";
import { PageShell } from "../../shared/components/PageShell";

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <PageShell title={title} subtitle={subtitle}>
      <div className="bg-card border border-border rounded-2xl p-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Construction className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          이 화면은 P1 우선순위로, 준비 중입니다. 핵심 기능은 동작 중이며 디자인 및 데이터가 순차적으로 추가됩니다.
        </p>
      </div>
    </PageShell>
  );
}
