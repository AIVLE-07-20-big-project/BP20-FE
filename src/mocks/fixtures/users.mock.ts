import type { User } from "../../entities/user/user.types";

export const DEMO_USERS: User[] = [
  {
    id: "u1",
    name: "김민지",
    email: "minji@broolab.com",
    role: "STORE_OWNER",
    storeName: "성수 브루랩",
    storeCategory: "카페·베이커리",
  },
  {
    id: "u2",
    name: "박준혁",
    email: "junhyuk@bp20.com",
    role: "ADMIN",
    organizationName: "BP20 파트너 콘솔",
  },
  {
    id: "u3",
    name: "이서연",
    email: "seoyeon@bp20.com",
    role: "SUPER_ADMIN",
    organizationName: "BP20 파트너 콘솔",
  },
];

