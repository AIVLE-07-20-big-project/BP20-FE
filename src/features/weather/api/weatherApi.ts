import { apiRequest } from "../../../shared/api/apiClient";

export interface CurrentWeather {
  forecastDateTime: string;
  temperature: number | null;
  sky: string | null;
  precipitationType: string | null;
  rainProbability: number | null;
  humidity: number | null;
}

export function getCurrentWeather(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });

  return apiRequest<CurrentWeather>(`/api/weather/order/now?${params}`);
}
