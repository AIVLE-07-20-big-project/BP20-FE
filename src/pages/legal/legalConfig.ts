function configured(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

const SERVICE_NAME = configured(import.meta.env.VITE_SERVICE_NAME, "Market Poke");

export const LEGAL_CONFIG = {
  serviceName: SERVICE_NAME,
  operatorName: configured(import.meta.env.VITE_LEGAL_OPERATOR_NAME, `${SERVICE_NAME} 프로젝트팀`),
  privacyDepartment: configured(import.meta.env.VITE_PRIVACY_DEPARTMENT, "KT AIVLE School AI 충남충북 20조"),
  privacyOfficer: configured(import.meta.env.VITE_PRIVACY_OFFICER, "박형우, 박선호, 박승훈, 박유경, 박희상, 이상준"),
  privacyEmail: configured(import.meta.env.VITE_PRIVACY_CONTACT_EMAIL, "aivle-school@kt.com"),
  privacyPhone: configured(import.meta.env.VITE_PRIVACY_CONTACT_PHONE, "010-1234-5678"),
  businessAddress: configured(import.meta.env.VITE_LEGAL_BUSINESS_ADDRESS, "대전 서구 문정로48번길 30"),
  privacyPolicyVersion: "2026-08-26",
  termsVersion: "2026-08-26",
  openSourceNoticeVersion: "2026-08-26",
  effectiveDate: "2026년 8월 26일",
} as const;
