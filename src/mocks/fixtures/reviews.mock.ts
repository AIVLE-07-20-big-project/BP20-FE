import type { ReviewData } from "../../entities/review/review.types";

export const REVIEW_DATA: ReviewData[] = [
  { id: "rv1", source: "네이버 플레이스", rating: 5, content: "아메리카노 진짜 맛있어요. 원두가 좋은 것 같아요.", date: "2025-07-19", aspects: { taste: 5, price: 4, kindness: 5, waitTime: 3, cleanliness: 5 } },
  { id: "rv2", source: "카카오맵", rating: 3, content: "커피는 맛있는데 대기시간이 너무 길어요. 20분 기다렸어요.", date: "2025-07-18", aspects: { taste: 5, price: 3, kindness: 4, waitTime: 1, cleanliness: 4 } },
  { id: "rv3", source: "네이버 플레이스", rating: 4, content: "분위기 좋고 직원분들 친절해요. 가격이 조금 비싼 편이지만 맛으로 납득됩니다.", date: "2025-07-17", aspects: { taste: 5, price: 3, kindness: 5, waitTime: 4, cleanliness: 5 } },
  { id: "rv4", source: "구글맵", rating: 2, content: "주말에는 웨이팅이 너무 심해요. 30분 기다리다 그냥 나왔어요.", date: "2025-07-16", aspects: { taste: 0, price: 3, kindness: 3, waitTime: 1, cleanliness: 4 } },
  { id: "rv5", source: "네이버 플레이스", rating: 5, content: "빵이 갓 구워져서 나와요. 크루아상 완전 추천!", date: "2025-07-15", aspects: { taste: 5, price: 4, kindness: 5, waitTime: 4, cleanliness: 5 } },
];

