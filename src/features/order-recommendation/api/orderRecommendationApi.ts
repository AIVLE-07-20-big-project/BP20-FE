import { apiRequest } from "../../../shared/api/apiClient";

export interface WeatherForecast {
  orderDateTime: string;
  forecastDateTime: string;
  latitude: number;
  longitude: number;
  temperature: number | null;
  windSpeed: number | null;
  sky: string | null;
  precipitationType: string | null;
  rainProbability: number | null;
  humidity: number | null;
}

export interface OrderRecommendation {
  ingredientName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  incomingStock: number;
  safetyStock: number;
  expectedUsage: number;
  recommendedOrderQuantity: number;
  orderRequired: boolean;
  confidenceScore: number;
  modelName: string;
  recommendationReason: string;
}

export interface AutomaticOrderRecommendation {
  latitude: number;
  longitude: number;
  weatherForecasts: WeatherForecast[];
  recommendations: OrderRecommendation[];
}

export type SortDirection = "ASC" | "DESC";

export function generateAutomaticOrderRecommendation(
  latitude: number,
  longitude: number,
  sortDirection: SortDirection = "ASC",
  orderRequiredOnly = false,
) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    sortDirection,
    orderRequiredOnly: String(orderRequiredOnly),
  });
  return apiRequest<AutomaticOrderRecommendation>(`/api/order-recommendations/automatic?${params}`, { method: "POST" });
}
