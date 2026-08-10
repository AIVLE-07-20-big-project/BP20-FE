import { Library } from "lucide-react";
import { LegalDocumentLayout, LegalSection } from "./components/LegalDocumentLayout";
import { LEGAL_CONFIG } from "./legalConfig";

const LIBRARIES = [
  { name: "React / React DOM", version: "18.3.1", license: "MIT", url: "https://github.com/facebook/react" },
  { name: "React Router DOM", version: "6.30.4", license: "MIT", url: "https://github.com/remix-run/react-router" },
  { name: "Lucide React", version: "0.487.0", license: "ISC", url: "https://github.com/lucide-icons/lucide" },
  { name: "Recharts", version: "2.15.2", license: "MIT", url: "https://github.com/recharts/recharts" },
  { name: "clsx", version: "2.1.1", license: "MIT", url: "https://github.com/lukeed/clsx" },
  { name: "tw-animate-css", version: "1.3.8", license: "MIT", url: "https://github.com/Wombosvideo/tw-animate-css" },
  { name: "Tailwind CSS", version: "4.1.12", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss" },
  { name: "Vite", version: "6.4.3", license: "MIT", url: "https://github.com/vitejs/vite" },
  { name: "Spring Boot", version: "4.0.6", license: "Apache-2.0", url: "https://github.com/spring-projects/spring-boot" },
  { name: "Apache Commons CSV", version: "1.14.1", license: "Apache-2.0", url: "https://github.com/apache/commons-csv" },
  { name: "Apache Commons IO", version: "2.20.0", license: "Apache-2.0", url: "https://github.com/apache/commons-io" },
  { name: "Springdoc OpenAPI", version: "3.0.2", license: "Apache-2.0", url: "https://github.com/springdoc/springdoc-openapi" },
];

export function OpenSourceLicensesPage() {
  return (
    <LegalDocumentLayout
      title="오픈소스 라이선스"
      description={`${LEGAL_CONFIG.serviceName}은 여러 오픈소스 소프트웨어를 사용하며 각 저작권자의 라이선스와 고지 조건을 존중합니다.`}
      icon={<Library className="h-6 w-6" />}
      meta={`고지 기준일 ${LEGAL_CONFIG.effectiveDate} · 고지 버전 ${LEGAL_CONFIG.openSourceNoticeVersion}`}
    >
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        아래 목록은 주요 직접 의존성입니다. 실제 배포 전 프론트엔드·백엔드·AI 이미지에 포함된 전이 의존성까지 SBOM과
        THIRD-PARTY NOTICES를 자동 생성하여 배포 산출물과 함께 보관해야 합니다.
      </div>
      <LegalSection title="주요 오픈소스 소프트웨어">
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border bg-muted/70 px-4 py-3 text-xs font-bold text-foreground">
            <span>소프트웨어</span><span>버전</span><span>라이선스</span>
          </div>
          {LIBRARIES.map((library) => (
            <a
              key={`${library.name}-${library.version}`}
              href={library.url}
              target="_blank"
              rel="noreferrer"
              className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border px-4 py-3 text-xs transition-colors last:border-0 hover:bg-muted/40"
            >
              <strong className="text-foreground">{library.name}</strong><span>{library.version}</span><span className="font-semibold text-[#246BFD]">{library.license}</span>
            </a>
          ))}
        </div>
      </LegalSection>
      <LegalSection title="라이선스 고지 원칙">
        <ul className="list-disc space-y-1 pl-5">
          <li>각 소프트웨어의 저작권 고지, LICENSE 및 NOTICE 파일을 임의로 제거하지 않음</li>
          <li>수정·재배포 시 해당 라이선스가 요구하는 소스 공개, 변경 고지 및 고지문 포함 조건을 개별 확인</li>
          <li>새 의존성 도입 전 라이선스 호환성과 상업적 이용·배포 조건 검토</li>
          <li>컨테이너 이미지와 배포 번들의 직접·전이 의존성을 정기적으로 스캔하고 기록</li>
        </ul>
        <p>오픈소스의 저작권과 상표는 각 권리자에게 있으며, 별도 명시가 없는 한 해당 소프트웨어는 각 라이선스에서 정한 조건과 책임 제한에 따라 제공됩니다.</p>
        <p>
          라이선스 원문: <a className="font-semibold text-[#246BFD] hover:underline" href="https://opensource.org/license/mit" target="_blank" rel="noreferrer">MIT</a>
          {" · "}<a className="font-semibold text-[#246BFD] hover:underline" href="https://opensource.org/license/apache-2-0" target="_blank" rel="noreferrer">Apache-2.0</a>
          {" · "}<a className="font-semibold text-[#246BFD] hover:underline" href="https://opensource.org/license/bsd-3-clause" target="_blank" rel="noreferrer">BSD-3-Clause</a>
          {" · "}<a className="font-semibold text-[#246BFD] hover:underline" href="https://opensource.org/license/isc-license-txt" target="_blank" rel="noreferrer">ISC</a>
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
