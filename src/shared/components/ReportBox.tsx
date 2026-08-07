import { useState } from "react";
import { AlertTriangle, Info, TrendingUp } from "lucide-react";

interface ReportBoxProps {
  title: string;
  text: string;
  tone: "positive" | "negative" | "neutral";
}

const TONE_CLASS: Record<ReportBoxProps["tone"], string> = {
  positive: "border-emerald-100 bg-emerald-50 text-emerald-800",
  negative: "border-amber-100 bg-amber-50 text-amber-800",
  neutral: "border-border bg-muted/40 text-foreground",
};

const TONE_ACCENT: Record<ReportBoxProps["tone"], string> = {
  positive: "border-l-emerald-400",
  negative: "border-l-amber-400",
  neutral: "border-l-slate-300",
};

const TONE_ICON: Record<ReportBoxProps["tone"], typeof TrendingUp> = {
  positive: TrendingUp,
  negative: AlertTriangle,
  neutral: Info,
};

const TONE_ICON_CLASS: Record<ReportBoxProps["tone"], string> = {
  positive: "text-emerald-600",
  negative: "text-amber-600",
  neutral: "text-muted-foreground",
};

// 본문이 길면 접어서 한눈에 훑어볼 수 있게 하고, 필요할 때만 펼쳐 전체를 읽게 한다.
const COLLAPSE_THRESHOLD = 160;

export function ReportBox({ title, text, tone }: ReportBoxProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TONE_ICON[tone];
  const isLong = text.length > COLLAPSE_THRESHOLD;
  const shownText = isLong && !expanded ? `${text.slice(0, COLLAPSE_THRESHOLD).trimEnd()}…` : text;

  return (
    <div className={`rounded-xl border border-l-4 p-4 ${TONE_CLASS[tone]} ${TONE_ACCENT[tone]}`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${TONE_ICON_CLASS[tone]}`} />
        <p className="text-sm font-bold break-keep">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line break-keep">{shownText}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-semibold underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100"
        >
          {expanded ? "접기" : "더 보기"}
        </button>
      )}
    </div>
  );
}

export interface ParsedReportSection {
  title: string;
  body: string;
}

// 실제 추천승인 리포트는 마크다운/번호 없이 "대응방안 요약", "권장 실행 순서" 같은 짧은 제목 줄이
// 빈 줄로 구분된 채 그대로 온다. 그래서 헤더 판정은 "빈 줄(또는 글 시작) 다음에 오는 20자 이하이면서
// 목록(-, 1.)도 아니고 문장 종결부호(./!/?)로 끝나지도 않는 줄"로 잡는다.
function normalizeHeaderCandidate(line: string): string {
  return line
    .replace(/^#{1,3}\s+/, "")
    .replace(/^\*\*(.+)\*\*$/, "$1")
    .replace(/:$/, "")
    .trim();
}

function isHeaderLine(line: string): boolean {
  if (!line) return false;
  if (line.length > 20) return false;
  if (/^[-•*]\s/.test(line)) return false;
  if (/^\d+[.)]\s/.test(line)) return false;
  if (/[.!?]$/.test(line)) return false;
  return true;
}

export function parseReportSections(text: string): ParsedReportSection[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: ParsedReportSection[] = [];
  let title: string | null = null;
  let body: string[] = [];
  let prevBlank = true;

  const flush = () => {
    const trimmedBody = body.join("\n").trim();
    if (title && trimmedBody) sections.push({ title, body: trimmedBody });
    body = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      body.push("");
      prevBlank = true;
      continue;
    }
    if (prevBlank) {
      const candidate = normalizeHeaderCandidate(line);
      if (isHeaderLine(candidate)) {
        flush();
        title = candidate;
        prevBlank = false;
        continue;
      }
    }
    body.push(line);
    prevBlank = false;
  }
  flush();
  return sections;
}

function toneForTitle(title: string): ReportBoxProps["tone"] {
  if (/성과|효과|장점|긍정|개선|증가|상승|기회/.test(title)) return "positive";
  if (/보완|위험|주의|우려|한계|부정|감소|하락|리스크|문제|이슈/.test(title)) return "negative";
  return "neutral";
}

const TONE_SUMMARY_LABEL: Record<ReportBoxProps["tone"], string> = {
  positive: "긍정/성과",
  negative: "주의/리스크",
  neutral: "참고",
};

const TONE_BAR_CLASS: Record<ReportBoxProps["tone"], string> = {
  positive: "bg-emerald-400",
  negative: "bg-amber-400",
  neutral: "bg-slate-300",
};

const TONE_DOT_CLASS: Record<ReportBoxProps["tone"], string> = {
  positive: "bg-emerald-400",
  negative: "bg-amber-400",
  neutral: "bg-slate-300",
};

// 섹션별 톤(긍정/주의/참고) 비율을 막대 하나로 요약해 본문을 읽기 전에 전체 톤을 한눈에 보여준다.
function ToneSummaryBar({ sections }: { sections: ParsedReportSection[] }) {
  const tones: ReportBoxProps["tone"][] = ["positive", "negative", "neutral"];
  const counts = tones.reduce((acc, tone) => {
    acc[tone] = sections.filter((s) => toneForTitle(s.title) === tone).length;
    return acc;
  }, {} as Record<ReportBoxProps["tone"], number>);
  const total = sections.length;
  const visibleTones = tones.filter((tone) => counts[tone] > 0);
  if (visibleTones.length < 2) return null;

  return (
    <div className="mb-3">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {visibleTones.map((tone) => (
          <div
            key={tone}
            className={TONE_BAR_CLASS[tone]}
            style={{ width: `${(counts[tone] / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {visibleTones.map((tone) => (
          <span key={tone} className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT_CLASS[tone]}`} />
            {TONE_SUMMARY_LABEL[tone]} {counts[tone]}
          </span>
        ))}
      </div>
    </div>
  );
}

// 헤더가 감지되면 근거별 카드 그리드로, 아니면 통짜 본문을 하나의 강조 문단으로 보여준다.
export function ReportSections({ text }: { text: string }) {
  const sections = parseReportSections(text);
  if (sections.length >= 2) {
    return (
      <div>
        <ToneSummaryBar sections={sections} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sections.map((section) => (
            <ReportBox key={section.title} title={section.title} text={section.body} tone={toneForTitle(section.title)} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <p className="rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-foreground whitespace-pre-line break-keep">
      {text}
    </p>
  );
}
