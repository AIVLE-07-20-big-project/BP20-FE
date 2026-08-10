import { ShieldCheck } from "lucide-react";

export function RecaptchaNotice() {
  return (
    <aside
      aria-label="reCAPTCHA 보안 안내"
      className="flex items-start justify-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-2.5 text-center shadow-sm shadow-blue-100/50"
    >
      <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#246BFD]" />
      <p className="text-[10px] leading-4 text-slate-600">
        이 사이트는 reCAPTCHA로 보호되며 Google의
        <br />
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#246BFD] underline-offset-2 hover:underline"
        >
          개인정보처리방침
        </a>
        과{" "}
        <a
          href="https://policies.google.com/terms"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#246BFD] underline-offset-2 hover:underline"
        >
          서비스 약관
        </a>
        이 적용됩니다.
      </p>
    </aside>
  );
}
