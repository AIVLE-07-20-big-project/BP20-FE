import { apiRequest } from "@/shared/api/apiClient";
import type { CategoriesResponse, ProductImageResponse } from "./product-image.types";

/** 지원하는 메뉴 카테고리 목록을 가져온다. */
export function getProductImageCategories(): Promise<CategoriesResponse> {
  return apiRequest<CategoriesResponse>("/api/store-owner/product-images/categories");
}

/**
 * 상품 사진 + 카테고리를 보내 배경이 합성된 이미지를 생성한다.
 * 백엔드가 생성 즉시 저장소(로컬 디스크 또는 S3)에 저장해두므로, 응답으로는 접근 가능한
 * imageUrl만 돌아온다. 이 URL을 그대로 상품 수정 API(imageUrl 필드)에 넘기면 메뉴 이미지로 저장된다.
 *
 * ⚠️ 호출 1건당 실제 비용(OpenAI API 과금)이 발생하고, 처리에 수 초~수십 초 걸릴 수 있다.
 */
export async function generateProductImage(file: File, category: string, prompt?: string): Promise<ProductImageResponse> {
  // 파일을 그대로 넘기면 전송 시점에 디스크를 다시 읽어오다 ERR_UPLOAD_FILE_CHANGED가 날 수 있어서,
  // 선택 즉시 메모리로 읽어들인 사본을 올린다.
  const buffer = await file.arrayBuffer();
  const fileCopy = new Blob([buffer], { type: file.type });

  const formData = new FormData();
  formData.append("file", fileCopy, file.name);
  formData.append("category", category);
  if (prompt && prompt.trim()) {
    formData.append("prompt", prompt.trim());
  }

  return apiRequest<ProductImageResponse>("/api/store-owner/product-images/generate", {
    method: "POST",
    body: formData,
  });
}