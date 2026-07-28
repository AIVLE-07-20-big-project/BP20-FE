import type { InventoryItem } from "../../../entities/inventory/inventory.types";
import { apiRequest } from "../../../shared/api/apiClient";

interface InventoryCsvResponse {
  name: string;
  lot: string;
  stock: number;
  unit: string;
  expectedDepletion: string;
  expiry: string;
  supplier: string;
  status: string;
  reorderQty: number;
  supplierPrice: number;
  leadTime: number;
}

const INVENTORY_STATUSES = new Set<InventoryItem["status"]>(["정상", "부족", "품절", "과잉", "임박"]);

export async function getUploadedInventories(): Promise<InventoryItem[]> {
  const inventories = await apiRequest<InventoryCsvResponse[]>("/api/csv/inventories");
  return inventories.map((item, index) => ({
    ...item,
    id: `${item.name}-${item.lot}-${index}`,
    status: INVENTORY_STATUSES.has(item.status as InventoryItem["status"])
      ? item.status as InventoryItem["status"]
      : "정상",
  }));
}

export type CsvDataType = "products" | "sales" | "inventories";

export interface CsvUploadResult {
  message: string;
  count: number;
}

export interface CsvUploadStatus {
  productCount: number;
  salesCount: number;
  inventoryCount: number;
}

export function uploadCsv(type: CsvDataType, file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<CsvUploadResult>(`/api/csv/${type}`, { method: "POST", body });
}

export function getCsvUploadStatus() {
  return apiRequest<CsvUploadStatus>("/api/csv/status");
}
