import type { InventoryItem } from "../../entities/inventory/inventory.types";

export const INVENTORY_ITEMS: InventoryItem[] = [
  { id: "i1", name: "에스프레소 원두 (싱글오리진)", lot: "L2507-01", stock: 2.4, unit: "kg", expectedDepletion: "2025-07-21 16:00", expiry: "2025-09-30", supplier: "커피플러스", status: "부족", reorderQty: 20, supplierPrice: 48000, leadTime: 1 },
  { id: "i2", name: "우유 (매일 1L)", lot: "L2507-12", stock: 18, unit: "개", expectedDepletion: "2025-07-23", expiry: "2025-07-25", supplier: "매일유업", status: "임박", reorderQty: 36, supplierPrice: 2200, leadTime: 1 },
  { id: "i3", name: "크루아상 냉동 반죽", lot: "L2507-08", stock: 120, unit: "개", expectedDepletion: "2025-07-28", expiry: "2025-08-15", supplier: "유로베이크", status: "정상", reorderQty: 200, supplierPrice: 850, leadTime: 2 },
  { id: "i4", name: "딸기잼 (업소용 5kg)", lot: "L2507-03", stock: 1, unit: "통", expectedDepletion: "2025-07-22", expiry: "2025-10-30", supplier: "삼립", status: "부족", reorderQty: 3, supplierPrice: 32000, leadTime: 2 },
  { id: "i5", name: "아몬드 시럽", lot: "L2506-22", stock: 4, unit: "병", expectedDepletion: "2025-08-10", expiry: "2026-03-20", supplier: "모닌코리아", status: "정상", reorderQty: 6, supplierPrice: 18500, leadTime: 3 },
  { id: "i6", name: "테이크아웃 컵 (12oz)", lot: "L2507-15", stock: 850, unit: "개", expectedDepletion: "2025-07-30", expiry: "-", supplier: "에코팩", status: "정상", reorderQty: 1000, supplierPrice: 85, leadTime: 2 },
  { id: "i7", name: "샌드위치용 식빵", lot: "L2507-16", stock: 0, unit: "개", expectedDepletion: "품절", expiry: "2025-07-22", supplier: "파리크라상", status: "품절", reorderQty: 80, supplierPrice: 1200, leadTime: 1 },
  { id: "i8", name: "바닐라 에센스", lot: "L2504-11", stock: 8, unit: "병", expectedDepletion: "2025-09-15", expiry: "2026-08-01", supplier: "오트커", status: "과잉", reorderQty: 0, supplierPrice: 12000, leadTime: 5 },
];

