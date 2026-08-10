import type { User } from "../../entities/user/user.types";

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
    name: "박관리",
    email: "admin@bp20.com",
    role: "ADMIN",
    organizationName: "Market Poke 파트너 콘솔",
  },
  {
    id: "u3",
    name: "이관리",
    email: "super-admin@bp20.com",
    role: "SUPER_ADMIN",
    organizationName: "Market Poke 파트너 콘솔",
  },
];

