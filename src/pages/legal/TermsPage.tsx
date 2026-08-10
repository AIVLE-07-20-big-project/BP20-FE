import { FileText } from "lucide-react";
import { LegalDocumentLayout, LegalSection } from "./components/LegalDocumentLayout";
import { LEGAL_CONFIG } from "./legalConfig";

export function TermsPage() {
  return (
    <LegalDocumentLayout
      title="서비스 이용약관"
      description={`${LEGAL_CONFIG.serviceName}의 초대 기반 계정과 매장 운영 지원 서비스를 이용할 때 적용되는 기본 조건입니다.`}
      icon={<FileText className="h-6 w-6" />}
      meta={`시행일 ${LEGAL_CONFIG.effectiveDate} · 약관 버전 ${LEGAL_CONFIG.termsVersion}`}
    >
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        {LEGAL_CONFIG.serviceName}은 현재 관리자·점주 대상의 비공개 프로젝트 서비스이며 유료 결제와 고객용 주문 기능은 본 약관의 범위에 포함하지 않습니다.
      </div>

      <LegalSection title="제1조 (목적)"><p>본 약관은 {LEGAL_CONFIG.operatorName}(이하 “운영자”)가 제공하는 {LEGAL_CONFIG.serviceName} 서비스의 이용 조건과 운영자 및 이용자의 권리·의무를 정함을 목적으로 합니다.</p></LegalSection>
      <LegalSection title="제2조 (용어의 정의)">
        <ul className="list-disc space-y-1 pl-5">
          <li>“서비스”란 계정·권한 관리, 매장·상품·온라인 판매·할인·쿠폰 관리, 데이터 분석 및 AI 운영 지원 기능을 의미합니다.</li>
          <li>“이용자”란 초대를 수락하고 계정을 생성한 최고 관리자, 관리자 또는 점주를 의미합니다.</li>
          <li>“콘텐츠”란 이용자가 서비스에 입력·업로드한 매장, 상품, 고객, 매출, 재고, 리뷰, 영수증 등의 자료를 의미합니다.</li>
          <li>“AI 결과”란 입력 자료를 바탕으로 생성된 분석, 추천, 예측, 이미지 등의 결과를 의미합니다.</li>
        </ul>
      </LegalSection>
      <LegalSection title="제3조 (약관의 게시·효력 및 변경)">
        <p>운영자는 이용자가 쉽게 확인할 수 있도록 약관을 서비스 Footer에 상시 게시합니다. 일반적인 변경은 시행 7일 전, 이용자에게 불리하거나 중요한 변경은 시행 30일 전에 변경 사유와 내용을 서비스 공지 등 합리적인 방법으로 알립니다. 이용자는 변경 약관에 동의하지 않을 경우 이용 종료를 요청할 수 있습니다.</p>
      </LegalSection>
      <LegalSection title="제4조 (계정 생성과 관리)">
        <p>계정은 권한 있는 관리자의 초대와 이용자의 가입 절차 완료로 생성됩니다. 이용자는 정확한 정보를 제공하고 비밀번호 및 인증 수단을 안전하게 관리해야 합니다. 계정 공유, 타인 명의 사용, 권한 양도는 허용되지 않습니다. 인증 정보 유출이 의심되면 즉시 관리자에게 알려야 합니다.</p>
      </LegalSection>
      <LegalSection title="제5조 (서비스의 제공)">
        <p>운영자는 역할별 권한에 따라 매장 운영, 상품·고객·쿠폰 관리, AI 분석 및 관리자 계정 관리 기능을 제공합니다. 구체적인 기능은 개발·운영 상황에 따라 추가·변경될 수 있습니다. 서비스 제공 시간은 원칙적으로 연중무휴이나 점검, 장애, 재난 또는 외부 서비스 장애로 일시 중단될 수 있습니다.</p>
      </LegalSection>
      <LegalSection title="제6조 (이용자의 의무)">
        <ul className="list-disc space-y-1 pl-5">
          <li>관계 법령, 본 약관, 개인정보 처리방침 및 서비스 안내 준수</li>
          <li>고객 정보와 영수증 등 제3자 정보를 입력하기 전 적법한 처리 근거 확보</li>
          <li>업무 목적에 필요한 최소한의 정보만 입력하고 불필요한 민감정보 업로드 금지</li>
          <li>서비스 침해, 비정상 호출, 자동화 공격, 역설계 및 타인의 권한·정보 침해 금지</li>
          <li>AI 결과를 실제 경영에 적용하기 전 정확성·적합성 검토</li>
        </ul>
      </LegalSection>
      <LegalSection title="제7조 (이용 제한과 계정 보호)">
        <p>운영자는 비밀번호 반복 오류, 비정상 접근, 계정 공유, 법령 또는 약관 위반이 확인되면 필요한 범위에서 로그인을 잠그거나 계정·기능 이용을 제한할 수 있습니다. 긴급한 보안 조치가 아닌 경우 사유와 해제 방법을 안내하며, 이용자는 관리자에게 이의를 제기할 수 있습니다.</p>
      </LegalSection>
      <LegalSection title="제8조 (콘텐츠와 지식재산권)">
        <p>이용자가 적법하게 보유한 콘텐츠의 권리는 이용자 또는 원권리자에게 귀속됩니다. 이용자는 서비스 제공에 필요한 범위에서 운영자가 콘텐츠를 저장·변환·분석하도록 허용합니다. 서비스 자체의 소프트웨어, 화면 구성, 상표와 운영자가 제작한 자료의 권리는 운영자 또는 정당한 권리자에게 귀속됩니다.</p>
      </LegalSection>
      <LegalSection title="제9조 (AI 결과의 이용)">
        <p>AI 결과는 의사결정을 지원하는 참고 정보이며 정확성, 완전성 또는 특정한 성과를 보장하지 않습니다. 이용자는 데이터 품질, 실제 재고·시장 상황 및 관련 규정을 함께 검토하여 최종 결정을 내려야 합니다. 운영자는 오류를 줄이고 결과의 근거와 한계를 알기 쉽게 제공하도록 노력합니다.</p>
      </LegalSection>
      <LegalSection title="제10조 (개인정보 보호)"><p>개인정보의 항목, 목적, 보유기간, 위탁, 파기 및 권리행사 방법은 별도의 개인정보 처리방침에 따릅니다. 개인정보 처리방침과 본 약관이 다른 경우 정보주체에게 유리한 내용을 적용합니다.</p></LegalSection>
      <LegalSection title="제11조 (서비스 이용 종료)"><p>이용자는 관리자에게 계정 이용 종료를 요청할 수 있습니다. 운영자는 이용 종료 시 관계 법령과 개인정보 처리방침에 따라 개인정보와 콘텐츠를 처리합니다. 미처리 업무 또는 법적 보존 의무가 있는 정보는 필요한 기간 동안 분리 보관할 수 있습니다.</p></LegalSection>
      <LegalSection title="제12조 (책임과 분쟁 해결)">
        <p>운영자와 이용자는 자신의 귀책으로 상대방에게 발생한 손해에 대해 관계 법령에 따라 책임을 부담합니다. 운영자는 고의 또는 중대한 과실이 없는 외부 통신망 장애, 천재지변 등 통제하기 어려운 사유로 발생한 중단에 대해 법령이 허용하는 범위에서 책임이 제한될 수 있습니다. 분쟁은 상호 협의를 우선하며, 해결되지 않는 경우 대한민국 법령과 민사소송법상 관할 법원에 따릅니다.</p>
      </LegalSection>
      <LegalSection title="부칙"><p>본 약관은 {LEGAL_CONFIG.effectiveDate}부터 시행합니다. 실제 운영 전 운영 주체, 연락처, 계정 종료 절차 및 서비스 수준을 확정하고 법률 검토를 거쳐야 합니다.</p></LegalSection>
    </LegalDocumentLayout>
  );
}
