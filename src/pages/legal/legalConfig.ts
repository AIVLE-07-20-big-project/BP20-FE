function configured(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

export const LEGAL_CONFIG = {
  serviceName: "MarketPoke",
  operatorName: configured(import.meta.env.VITE_LEGAL_OPERATOR_NAME, "MarketPoke 프로젝트팀"),
  privacyDepartment: configured(import.meta.env.VITE_PRIVACY_DEPARTMENT, "개인정보 보호 담당"),
  privacyOfficer: configured(import.meta.env.VITE_PRIVACY_OFFICER, "운영 전 지정 필요"),
  privacyEmail: configured(import.meta.env.VITE_PRIVACY_CONTACT_EMAIL, "운영 전 등록 필요"),
  privacyPhone: configured(import.meta.env.VITE_PRIVACY_CONTACT_PHONE, "운영 전 등록 필요"),
  businessAddress: configured(import.meta.env.VITE_LEGAL_BUSINESS_ADDRESS, "운영 전 등록 필요"),
  privacyPolicyVersion: "2026-08-03",
  termsVersion: "2026-08-03",
  openSourceNoticeVersion: "2026-08-03",
  effectiveDate: "2026년 8월 3일",
} as const;
