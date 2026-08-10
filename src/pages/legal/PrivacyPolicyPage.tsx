import { ShieldCheck } from "lucide-react";
import { LegalDocumentLayout, LegalSection } from "./components/LegalDocumentLayout";
import { LEGAL_CONFIG } from "./legalConfig";

const tableClassName = "w-full min-w-[680px] border-collapse text-left text-xs leading-5";
const headClassName = "border border-border bg-muted/70 px-3 py-2 font-bold text-foreground";
const cellClassName = "border border-border px-3 py-2.5 align-top";

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      title="개인정보 처리방침"
      description={`${LEGAL_CONFIG.operatorName}는 정보주체의 개인정보를 중요하게 여기며 관련 법령에 따라 안전하게 처리합니다.`}
      icon={<ShieldCheck className="h-6 w-6" />}
      meta={`시행일 ${LEGAL_CONFIG.effectiveDate} · 버전 ${LEGAL_CONFIG.privacyPolicyVersion}`}
    >
      <LegalSection title="1. 개인정보의 처리 목적">
        <p>{LEGAL_CONFIG.serviceName}는 다음 목적에 필요한 범위에서만 개인정보를 처리하며, 목적이 변경되는 경우 관계 법령에 따른 조치를 이행합니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>초대 대상 확인, 회원가입, 로그인, 본인 식별 및 역할별 권한 관리</li>
          <li>점주 매장 등록·관리, 고객 관리, 할인 및 쿠폰 운영</li>
          <li>매출·재고·리뷰·영수증 분석과 AI 기반 운영 지원 기능 제공</li>
          <li>계정 잠금, 부정 로그인 차단, 인증 세션 관리 및 보안 감사</li>
          <li>서비스 장애 대응, 민원 처리 및 법적 의무 이행</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. 처리하는 개인정보의 항목·목적·보유기간">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className={tableClassName}>
            <thead><tr><th className={headClassName}>구분</th><th className={headClassName}>처리 항목</th><th className={headClassName}>처리 목적</th><th className={headClassName}>보유기간</th></tr></thead>
            <tbody>
              <tr><td className={cellClassName}>관리자·점주 계정</td><td className={cellClassName}>이메일, 이름, 비밀번호 해시, 연락처(선택), 역할, 계정 상태, 비밀번호 변경일, 로그인 실패 횟수·잠금 만료일</td><td className={cellClassName}>회원가입, 인증, 계정·권한 및 보안 관리</td><td className={cellClassName}>계정 이용 종료 시까지. 종료 후 법령상 보존 의무가 없다면 지체 없이 파기</td></tr>
              <tr><td className={cellClassName}>초대</td><td className={cellClassName}>초대 이메일, 대상 역할, 초대한 사용자, 생성·만료·수락·취소 일시, 임시 비밀번호 해시</td><td className={cellClassName}>초대 발급·검증·상태 관리</td><td className={cellClassName}>초대 처리 완료 또는 만료 후 1년</td></tr>
              <tr><td className={cellClassName}>개인정보 동의 기록</td><td className={cellClassName}>사용자 식별자, 방침 버전, 동의 일시, 접속 IP</td><td className={cellClassName}>동의 사실과 적용 방침 확인</td><td className={cellClassName}>계정 이용 종료 후 3년</td></tr>
              <tr><td className={cellClassName}>점주 등록 고객</td><td className={cellClassName}>이름, 이메일, 연락처(선택), 매장 식별자, 고객·쿠폰 이용 정보</td><td className={cellClassName}>매장 고객 및 쿠폰 관리</td><td className={cellClassName}>점주의 삭제 요청 또는 해당 매장 서비스 이용 종료 시까지</td></tr>
              <tr><td className={cellClassName}>보안·IAM 기록</td><td className={cellClassName}>행위자·대상 사용자 식별자, 대상 이메일, 작업 유형, 처리 결과, 접속 IP, 일시</td><td className={cellClassName}>권한 변경 추적, 오남용 탐지 및 보안 사고 대응</td><td className={cellClassName}>기록 생성일로부터 1년</td></tr>
              <tr><td className={cellClassName}>인증 세션</td><td className={cellClassName}>사용자 식별자, 세션·토큰 식별자, 만료 정보, 사용된 토큰 여부</td><td className={cellClassName}>로그인 유지, 토큰 회전 및 재사용 공격 차단</td><td className={cellClassName}>일반 7일, 로그인 상태 유지 선택 시 30일 또는 로그아웃·폐기 시까지</td></tr>
              <tr><td className={cellClassName}>AI·분석 이용</td><td className={cellClassName}>사용자·매장 식별자, 업로드한 영수증·거래명세서·CSV, 매출·재고·상품·리뷰 정보, 분석 요청·결과</td><td className={cellClassName}>OCR, 매출·원가·재고·리뷰 분석 및 추천 제공</td><td className={cellClassName}>분석 결과 삭제 요청 또는 해당 매장 서비스 이용 종료 시까지</td></tr>
              <tr><td className={cellClassName}>자동 생성 정보</td><td className={cellClassName}>접속 IP, 요청 일시, 브라우저·기기 및 접속 기록, CAPTCHA 평가 정보</td><td className={cellClassName}>서비스 보안, 오류 분석, 자동화 공격 방지</td><td className={cellClassName}>수집일로부터 1년. CAPTCHA 제공자가 처리하는 정보는 해당 계약·정책에 따름</td></tr>
            </tbody>
          </table>
        </div>
        <p>비밀번호 원문과 임시 비밀번호 원문은 저장하지 않으며 단방향 해시로만 보관합니다. 이용자는 개인정보 수집 동의를 거부할 수 있으나, 필수 항목에 동의하지 않으면 계정 생성과 서비스 이용이 제한됩니다.</p>
      </LegalSection>

      <LegalSection title="3. 개인정보의 제3자 제공">
        <p>{LEGAL_CONFIG.serviceName}은 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다. 법령에 특별한 근거가 있거나 정보주체가 별도로 동의한 경우에는 제공받는 자, 목적, 항목, 보유기간과 동의 거부권을 사전에 안내합니다.</p>
      </LegalSection>

      <LegalSection title="4. 개인정보 처리업무의 위탁 및 국외 처리">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className={tableClassName}>
            <thead><tr><th className={headClassName}>수탁자</th><th className={headClassName}>위탁 업무</th><th className={headClassName}>처리 정보·기간</th></tr></thead>
            <tbody>
              <tr><td className={cellClassName}>Google LLC (reCAPTCHA)</td><td className={cellClassName}>로그인 자동화 공격, 부정 이용 및 악성 트래픽 탐지</td><td className={cellClassName}>CAPTCHA 토큰, 접속 IP, 브라우저·기기 신호. 로그인 시 암호화 통신으로 전송되며 Google Cloud 계약과 데이터 처리 부속서에 따라 처리</td></tr>
              <tr><td className={cellClassName}>클라우드 인프라 사업자</td><td className={cellClassName}>서버, 데이터베이스, 캐시·큐, 파일 저장 및 모니터링</td><td className={cellClassName}>운영 배포 사업자·리전·계약을 확정한 뒤 본 표에 상호, 처리 위치와 보유기간을 반영해야 함</td></tr>
            </tbody>
          </table>
        </div>
        <p>Google reCAPTCHA는 서비스 제공 과정에서 국외 인프라를 이용할 수 있습니다. 운영 전 실제 Google 계약, 처리 국가·연락처·이전 거부 방법을 확인하여 별도 국외이전 고지를 확정해야 합니다.</p>
      </LegalSection>

      <LegalSection title="5. 개인정보의 파기 절차 및 방법">
        <p>보유기간 만료 또는 처리 목적 달성 시 파기 대상 정보를 확인하여 지체 없이 파기합니다. 전자 파일은 복구·재생이 어렵도록 안전하게 삭제하고, 종이 문서는 분쇄 또는 소각합니다. 법령상 보존이 필요한 정보는 다른 정보와 분리하여 해당 기간 동안만 보관합니다.</p>
      </LegalSection>

      <LegalSection title="6. 정보주체의 권리·의무 및 행사 방법">
        <p>정보주체는 개인정보 열람, 정정·삭제, 처리정지 및 동의 철회를 요청할 수 있습니다. 본인 또는 적법한 대리인이 아래 개인정보 보호 담당 부서에 요청하면 본인 확인 후 관계 법령이 정한 기간 안에 처리합니다. 다른 법령에서 보존을 요구하거나 타인의 권리를 침해할 우려가 있는 경우 일부 요청이 제한될 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="7. 개인정보의 안전성 확보 조치">
        <ul className="list-disc space-y-1 pl-5">
          <li>역할 기반 접근 통제와 최소 권한 부여, 관리자 작업 기록</li>
          <li>비밀번호 BCrypt 단방향 해시, 이름·연락처·감사 로그의 AES-GCM 암호화</li>
          <li>JWT Access Token 단기 만료, Redis 기반 Refresh Token 회전·재사용 차단</li>
          <li>로그인 실패 계정 잠금, 비밀번호 유효기간, reCAPTCHA v3 기반 자동화 공격 방지</li>
          <li>관리 화면의 이메일·이름·연락처·IP 마스킹 및 전송 구간 암호화 적용</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. 자동 수집 장치의 설치·운영 및 거부">
        <p>로그인 유지 기능을 위해 필수 인증 쿠키를 사용할 수 있습니다. Refresh Token 쿠키는 HttpOnly 속성으로 JavaScript에서 읽을 수 없으며 로그아웃 또는 만료 시 제거됩니다. reCAPTCHA가 활성화되면 보안 위험 분석을 위한 <code className="rounded bg-muted px-1 py-0.5">_GRECAPTCHA</code> 쿠키가 설정될 수 있습니다. 필수 쿠키를 차단하면 로그인 유지 또는 보안 검증이 정상 동작하지 않을 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="9. 개인정보 보호책임자 및 권익침해 구제">
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <p><strong className="text-foreground">운영 주체</strong> {LEGAL_CONFIG.operatorName}</p>
          <p><strong className="text-foreground">담당 부서</strong> {LEGAL_CONFIG.privacyDepartment}</p>
          <p><strong className="text-foreground">보호책임자</strong> {LEGAL_CONFIG.privacyOfficer}</p>
          <p><strong className="text-foreground">이메일</strong> {LEGAL_CONFIG.privacyEmail}</p>
          <p><strong className="text-foreground">전화</strong> {LEGAL_CONFIG.privacyPhone}</p>
          <p><strong className="text-foreground">주소</strong> {LEGAL_CONFIG.businessAddress}</p>
        </div>
        <p>추가적인 피해 구제가 필요한 경우 개인정보침해신고센터(국번 없이 118), 개인정보분쟁조정위원회(1833-6972) 등 관계 기관에 문의할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="10. 개인정보 처리방침의 변경">
        <p>법령, 서비스 또는 처리 현황 변경으로 방침을 개정하는 경우 시행일과 변경 내용을 서비스 화면에서 알립니다. 중요한 변경은 시행 전에 충분한 기간을 두고 별도로 안내합니다. 이전 버전은 이용자가 확인할 수 있도록 관리합니다.</p>
        <p>
          기준: <a className="font-semibold text-[#246BFD] hover:underline" href="https://www.pipc.go.kr/" target="_blank" rel="noreferrer">개인정보보호위원회</a>
          {" · "}<a className="font-semibold text-[#246BFD] hover:underline" href="https://law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1020398435" target="_blank" rel="noreferrer">개인정보 보호법 제30조</a>
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
