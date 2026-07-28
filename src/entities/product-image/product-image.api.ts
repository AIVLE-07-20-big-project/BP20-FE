import { apiGet, apiPostFileForBlob } from "@/shared/api/httpClient";
import type { CategoriesResponse } from "./product-image.types";

/** 지원하는 메뉴 카테고리 목록을 가져온다. */
export function getProductImageCategories(): Promise<CategoriesResponse> {
  return apiGet<CategoriesResponse>("/api/store-owner/product-images/categories");
}

/**
 * 상품 사진 + 카테고리를 보내 배경이 합성된 이미지를 생성한다.
 * 응답은 image/png 바이너리 그대로 오므로 Blob으로 받는다.
 *
 * ⚠️ 호출 1건당 실제 비용(OpenAI API 과금)이 발생하고, 처리에 수 초~수십 초 걸릴 수 있다.
 */
export function generateProductImage(file: File, category: string): Promise<Blob> {
  return apiPostFileForBlob("/api/store-owner/product-images/generate", file, "file", { category });
}