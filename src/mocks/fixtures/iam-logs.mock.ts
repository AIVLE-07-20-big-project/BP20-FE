import type { IAMLog } from "../../entities/iam-log/iam-log.types";

export const IAM_LOGS: IAMLog[] = [
  { id: "l1", timestamp: "2025-07-20 09:42:11", actor: "이서연", action: "관리자 초대 생성", target: "newadmin@bp20.com", result: "성공", ipSummary: "220.90.xxx.xxx (서울)", detail: "INVITE_ADMIN:newadmin@bp20.com" },
  { id: "l2", timestamp: "2025-07-20 09:10:05", actor: "박준혁", action: "가맹점 AI 활성화", target: "종로 옛날국밥 (m5)", result: "성공", ipSummary: "125.132.xxx.xxx (서울)", detail: "ACTIVATE_AI:merchant_id=m5" },
  { id: "l3", timestamp: "2025-07-19 18:22:34", actor: "박준혁", action: "공지 발송", target: "전체 가맹점 (1,284곳)", result: "성공", ipSummary: "125.132.xxx.xxx (서울)", detail: "NOTICE_PUBLISH:notice_id=n42" },
  { id: "l4", timestamp: "2025-07-19 14:05:18", actor: "김민지", action: "로그인", target: "김민지 (u1)", result: "성공", ipSummary: "121.161.xxx.xxx (서울)", detail: "LOGIN:user_id=u1" },
  { id: "l5", timestamp: "2025-07-19 09:33:51", actor: "시스템", action: "초대 자동 만료", target: "manager2@corp.com", result: "성공", ipSummary: "-", detail: "EXPIRE_INVITE:inv3" },
  { id: "l6", timestamp: "2025-07-18 22:11:04", actor: "알 수 없음", action: "로그인 실패", target: "newadmin@bp20.com", result: "실패", ipSummary: "1.234.xxx.xxx (해외)", detail: "LOGIN_FAIL:invalid_password:attempts=3" },
];

