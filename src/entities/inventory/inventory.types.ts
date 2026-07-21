export interface InventoryItem {
  id: string;
  name: string;
  lot: string;
  stock: number;
  unit: string;
  expectedDepletion: string;
  expiry: string;
  supplier: string;
  status: "정상" | "부족" | "품절" | "과잉" | "임박";
  reorderQty?: number;
  supplierPrice?: number;
  leadTime?: number;
}
