import { apiRequest } from "../../../shared/api/http";

export type NoticeStatusApi = "PUBLISHED" | "DRAFT";

export interface NoticeApi {
  id: number;
  title: string;
  body: string;
  category: string;
  audience: string;
  status: NoticeStatusApi;
  urgent: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  attachment?: { originalName: string; downloadUrl: string };
}

export interface NoticeRequestApi {
  title: string;
  body: string;
  category: string;
  audience: string;
  status: NoticeStatusApi;
  urgent: boolean;
}

export function getNotices(token: string) {
  return apiRequest<NoticeApi[]>("/api/admin/notices", { method: "GET" }, token);
}

export function getPublishedNotices(token: string) {
  return apiRequest<NoticeApi[]>("/api/notices", { method: "GET" }, token);
}

export function createNotice(request: NoticeRequestApi, token: string) {
  return apiRequest<NoticeApi>("/api/admin/notices", { method: "POST", body: JSON.stringify(request) }, token);
}

export function updateNotice(id: number, request: NoticeRequestApi, token: string) {
  return apiRequest<NoticeApi>("/api/admin/notices/" + id, { method: "PUT", body: JSON.stringify(request) }, token);
}

export function deleteNotice(id: number, token: string) {
  return apiRequest<void>("/api/admin/notices/" + id, { method: "DELETE" }, token);
}

export function uploadNoticeAttachment(id: number, file: File, token: string) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<{ id: number; originalName: string; contentType: string; size: number; downloadUrl: string }>(
    "/api/admin/notices/" + id + "/attachment",
    { method: "POST", body: form },
    token,
  );
}
