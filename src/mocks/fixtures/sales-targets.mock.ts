import type { SalesTargetBusiness } from "../../entities/sales-target/sales-target.types";

export const SALES_TARGETS: SalesTargetBusiness[] = [
  { id: "st1", name: "성수 그린팩토리카페", industry: "카페", region: "서울 성동구", score: 92, growthScore: 95, trafficScore: 88, reviewScore: 91, similarityScore: 93, proposition: "성수 상권 성장세에 최적화된 AI 재고·고객 관리", pipelineStatus: "후보" },
  { id: "st2", name: "합정 아티장베이커리", industry: "베이커리", region: "서울 마포구", score: 88, growthScore: 82, trafficScore: 90, reviewScore: 86, similarityScore: 91, proposition: "제빵 원가 최적화 및 발주 자동화", pipelineStatus: "연락 예정" },
  { id: "st3", name: "강남 피크닉레스토랑", industry: "양식", region: "서울 강남구", score: 85, growthScore: 88, trafficScore: 84, reviewScore: 79, similarityScore: 87, proposition: "예약 전환율 개선 및 리뷰 관리", pipelineStatus: "접촉" },
  { id: "st4", name: "서초 일번지국밥", industry: "한식", region: "서울 서초구", score: 81, growthScore: 79, trafficScore: 85, reviewScore: 80, similarityScore: 80, proposition: "식재료 매입 비용 절감 및 수익성 분석", pipelineStatus: "미팅" },
  { id: "st5", name: "이태원 루프탑바", industry: "바·라운지", region: "서울 용산구", score: 78, growthScore: 85, trafficScore: 76, reviewScore: 74, similarityScore: 76, proposition: "시간대별 매출 최적화 및 쿠폰 전략", pipelineStatus: "후보" },
];

