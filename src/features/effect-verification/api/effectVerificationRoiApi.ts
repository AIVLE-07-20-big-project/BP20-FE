import type { EffectVerificationRoiSummary } from "../../../entities/effect-verification/effect-verification-roi.types";
import { getAccessToken } from "../../../shared/api/apiClient";
import { API_BASE_URL } from "../../../shared/config/runtimeEnv";

export async function getEffectVerificationRoiSummary(storeId?: number) {
  const query = storeId == null ? "" : `?store_id=${encodeURIComponent(storeId)}`;
  const accessToken = getAccessToken();
  const response = await fetch(
    `${API_BASE_URL}/api/admin/effect-verifications/roi${query}`,
    {
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("최고관리자 권한으로 다시 로그인해 주세요.");
    }
    throw new Error(`효과 검증 통계를 불러오지 못했습니다. (${response.status})`);
  }

  return response.json() as Promise<EffectVerificationRoiSummary>;
}
