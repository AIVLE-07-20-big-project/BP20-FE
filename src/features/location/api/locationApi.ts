import { apiRequest } from "../../../shared/api/apiClient";

export interface LocationCandidate {
  displayName: string;
  latitude: number;
  longitude: number;
}

export function searchLocations(query: string) {
  const params = new URLSearchParams({ query });
  return apiRequest<LocationCandidate[]>(`/api/locations/search?${params}`);
}
