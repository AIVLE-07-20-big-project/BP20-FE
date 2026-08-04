import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { PolicyFooter } from "../../../shared/components/PolicyFooter";

interface LegalDocumentLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  meta: string;
  children: ReactNode;
}

export function LegalDocumentLayout({ title, description, icon, meta, children }: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F7FB] px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 서비스로 돌아가기
        </Link>
        <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <header className="border-b border-border bg-gradient-to-r from-[#EAF2FF] to-[#F4F0FF] px-6 py-8 sm:px-10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#246BFD] text-white">
              {icon}
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            <p className="mt-4 text-xs font-semibold text-[#246BFD]">{meta}</p>
          </header>
          <div className="space-y-9 px-5 py-8 sm:px-10">{children}</div>
        </article>
        <div className="mt-6"><PolicyFooter /></div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-foreground sm:text-lg">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
