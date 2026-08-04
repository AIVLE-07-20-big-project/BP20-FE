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

export function ReportBox({ title, text, tone }: ReportBoxProps) {
  return (
    <div className={`rounded-xl border p-4 ${TONE_CLASS[tone]}`}>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{text}</p>
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

// 헤더가 감지되면 근거별 카드 그리드로, 아니면 통짜 본문을 하나의 강조 문단으로 보여준다.
export function ReportSections({ text }: { text: string }) {
  const sections = parseReportSections(text);
  if (sections.length >= 2) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <ReportBox key={section.title} title={section.title} text={section.body} tone={toneForTitle(section.title)} />
        ))}
      </div>
    );
  }
  return (
    <p className="rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-foreground whitespace-pre-line">
      {text}
    </p>
  );
}
