import { apiRequest, apiRequestRaw } from "@/shared/api/apiClient";
import type { CategoriesResponse } from "./product-image.types";

/** 지원하는 메뉴 카테고리 목록을 가져온다. */
export function getProductImageCategories(): Promise<CategoriesResponse> {
  return apiRequest<CategoriesResponse>("/api/store-owner/product-images/categories");
}

/**
 * 상품 사진 + 카테고리를 보내 배경이 합성된 이미지를 생성한다.
 * 응답은 image/png 바이너리 그대로 오므로 Blob으로 받는다.
 *
 * ⚠️ 호출 1건당 실제 비용(OpenAI API 과금)이 발생하고, 처리에 수 초~수십 초 걸릴 수 있다.
 */
export async function generateProductImage(file: File, category: string): Promise<Blob> {
  // 파일을 그대로 넘기면 전송 시점에 디스크를 다시 읽어오다 ERR_UPLOAD_FILE_CHANGED가 날 수 있어서,
  // 선택 즉시 메모리로 읽어들인 사본을 올린다.
  const buffer = await file.arrayBuffer();
  const fileCopy = new Blob([buffer], { type: file.type });

  const formData = new FormData();
  formData.append("file", fileCopy, file.name);
  formData.append("category", category);

  const response = await apiRequestRaw("/api/store-owner/product-images/generate", {
    method: "POST",
    body: formData,
  });
  return response.blob();
}