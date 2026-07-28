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

export function generateAutomaticOrderRecommendation(latitude: number, longitude: number) {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
  return apiRequest<AutomaticOrderRecommendation>(`/api/order-recommendations/automatic?${params}`, { method: "POST" });
}
