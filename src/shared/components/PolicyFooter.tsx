import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { LEGAL_CONFIG } from "../../pages/legal/legalConfig";

export function PolicyFooter({ dark = false }: { dark?: boolean }) {
  const linkClassName = clsx(
    "font-semibold underline-offset-4 hover:underline",
    dark ? "text-white/60 hover:text-white" : "text-foreground/75 hover:text-foreground",
  );

  return (
    <footer
      className={clsx(
        "flex flex-col items-center justify-center gap-1.5 text-center text-[11px]",
        dark ? "text-white/35" : "text-muted-foreground",
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>
          Contact : {LEGAL_CONFIG.privacyEmail === "운영 전 등록 필요"
            ? LEGAL_CONFIG.privacyDepartment
            : LEGAL_CONFIG.privacyEmail}
        </span>
        <span aria-hidden="true" className={dark ? "text-white/15" : "text-border"}>|</span>
        <Link to="/privacy-policy" className={clsx(linkClassName, "font-bold")}>
          개인정보 처리방침
        </Link>
        <span aria-hidden="true" className={dark ? "text-white/15" : "text-border"}>|</span>
        <Link to="/terms" className={linkClassName}>서비스 이용약관</Link>
        <span aria-hidden="true" className={dark ? "text-white/15" : "text-border"}>|</span>
        <Link to="/open-source-licenses" className={linkClassName}>오픈소스 라이선스</Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className={clsx("font-semibold", dark ? "text-white/55" : "text-foreground/70")}>{LEGAL_CONFIG.serviceName}</span>
        <span>개인정보 처리방침 버전 {LEGAL_CONFIG.privacyPolicyVersion}</span>
        <span aria-hidden="true" className={dark ? "text-white/15" : "text-border"}>|</span>
        <span>© 2026 {LEGAL_CONFIG.serviceName}. All rights reserved.</span>
      </div>
    </footer>
  );
}
