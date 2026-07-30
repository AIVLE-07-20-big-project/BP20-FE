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

export function getSavedLocation() {
  return apiRequest<LocationCandidate | null>("/api/locations/saved");
}

export function getStoreLocation() {
  return apiRequest<LocationCandidate>("/api/locations/store");
}

export function saveLocation(location: LocationCandidate) {
  return apiRequest<LocationCandidate>("/api/locations/saved", {
    method: "PUT",
    body: JSON.stringify(location),
  });
}
