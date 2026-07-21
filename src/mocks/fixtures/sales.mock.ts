import type { DailySales, HourlyData } from "../../entities/sales/sales.types";

export const WEEKLY_SALES: DailySales[] = [
  { date: "07.14", online: 284000, offline: 1820000, total: 2104000 },
  { date: "07.15", online: 340000, offline: 2210000, total: 2550000 },
  { date: "07.16", online: 420000, offline: 2680000, total: 3100000 },
  { date: "07.17", online: 520000, offline: 2940000, total: 3460000 },
  { date: "07.18", online: 180000, offline: 1540000, total: 1720000 },
  { date: "07.19", online: 145000, offline: 1380000, total: 1525000 },
  { date: "07.20", online: 98000, offline: 840000, total: 938000 },
];


export const HOURLY_DATA: HourlyData[] = [
  { hour: 8, value: 142000 },
  { hour: 9, value: 284000 },
  { hour: 10, value: 412000 },
  { hour: 11, value: 380000 },
  { hour: 12, value: 520000 },
  { hour: 13, value: 494000 },
  { hour: 14, value: 210000 },
  { hour: 15, value: 168000 },
  { hour: 16, value: 198000 },
  { hour: 17, value: 284000 },
  { hour: 18, value: 320000 },
  { hour: 19, value: 248000 },
  { hour: 20, value: 142000 },
];

