/**
 * 로그인 토큰은 실제 인증 시스템(features/auth)이 관리한다.
 * 우리 API 클라이언트(httpClient.ts)는 그 저장소를 그대로 재사용만 한다
 * (독자적인 저장 방식을 따로 만들면 로그인 시스템과 토큰이 어긋나게 된다).
 *
 * features/auth/model/authSession.ts의 getAccessToken()은
 * "로그인 상태 유지" 여부에 따라 sessionStorage 또는 localStorage에서
 * 순수 토큰 값(Bearer 접두사 없음)을 찾아 반환한다.
 */
export { getAccessToken } from "@/features/auth/model/authSession";