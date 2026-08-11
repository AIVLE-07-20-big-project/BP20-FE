import type { User } from "../../entities/user/user.types";
import { LEGAL_CONFIG } from "../../pages/legal/legalConfig";

const PARTNER_CONSOLE_NAME = `${LEGAL_CONFIG.serviceName} 파트너 콘솔`;

export const DEMO_USERS: User[] = [
  {
    id: "u1",
    name: "김점주",
    email: "store-owner@bp20.com",
    role: "STORE_OWNER",
    storeName: "AIVLE Cafe",
    storeCategory: "카페·베이커리",
  },
  {
    id: "u2",
    name: "박준혁",
    email: "junhyuk@marketpoke.com",
    role: "ADMIN",
    organizationName: PARTNER_CONSOLE_NAME,
  },
  {
    id: "u3",
    name: "이서연",
    email: "seoyeon@marketpoke.com",
    role: "SUPER_ADMIN",
    organizationName: PARTNER_CONSOLE_NAME,
  },
];
