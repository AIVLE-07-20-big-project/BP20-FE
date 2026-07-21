export interface DailySales {
  date: string;
  online: number;
  offline: number;
  total: number;
}

export interface HourlyData {
  hour: number;
  value: number;
}
