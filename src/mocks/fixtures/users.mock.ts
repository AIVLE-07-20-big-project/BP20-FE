import type { User } from "../../entities/user/user.types";
import { LEGAL_CONFIG } from "../../pages/legal/legalConfig";

const PARTNER_CONSOLE_NAME = `${LEGAL_CONFIG.serviceName} 파트너 콘솔`;

export const DEMO_USERS: User[] = [
  {
    id: "u1",
    name: "에이블러 카페",
    email: "aivler-cafe@gmail.com",
    role: "STORE_OWNER",
    storeName: "AIVLE Cafe",
    storeCategory: "카페·베이커리",
  },
  {
    id: "u2",
    name: "관리자",
    email: "admin1@bp20.com",
    role: "ADMIN",
    organizationName: PARTNER_CONSOLE_NAME,
  },
  {
    id: "u3",
    name: "최고 관리자",
    email: "super-admin@bp20.com",
    role: "SUPER_ADMIN",
    organizationName: PARTNER_CONSOLE_NAME,
  },
];

// 데모 종료 시 삭제 필수
export const DEMO_LOGIN_PASSWORDS: Record<string, string> = {
  u1: "Aivlercafe20",
  u2: "Bp20admin001",
  u3: "6AAqsg4nytG6stsH",
};
