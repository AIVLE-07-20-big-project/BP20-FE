export type OnlineSalesStatus = "OPEN" | "CLOSED";
export type ProductStatus = "ACTIVE" | "INACTIVE" | "SOLD_OUT";
export type ProductOnlineSalesStatus = "NOT_REGISTERED" | "ON_SALE";
export type DiscountType = "RATE" | "FIXED_AMOUNT";
export type DiscountStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED";
export type CouponStatus = "ISSUED" | "USED" | "EXPIRED" | "REVOKED";
export type CouponUsageChannel = "ONLINE_ONLY" | "OFFLINE_ONLY";
export type CustomerStatus = "ACTIVE" | "INACTIVE";

export interface Store {
  id: number;
  name: string;
  businessNumber: string;
  category: string;
  address: string;
  phoneNumber: string | null;
  onlineSalesStatus: OnlineSalesStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
  status: ProductStatus;
  onlineSalesStatus: ProductOnlineSalesStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountProduct {
  id: number;
  name: string;
  price: number;
}

export interface Discount {
  id: number;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  product: DiscountProduct;
  startsAt: string;
  endsAt: string;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  reminderEnabled: boolean;
  status: DiscountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  email: string;
  name: string;
  phoneNumber: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: number;
  name: string;
  status: CouponStatus;
  discountType: DiscountType;
  discountValue: number;
  customerId: number;
  customerEmail: string;
  customerName: string;
  usageChannel: CouponUsageChannel;
  sourceOnlinePurchaseId: number | null;
  issuedAt: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
}

export interface OnlinePurchaseItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
}

export interface OnlinePurchase {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  purchasedAt: string;
  totalAmount: number;
  items: OnlinePurchaseItem[];
}

export interface CreateStorePayload {
  name: string;
  businessNumber: string;
  category: string;
  address: string;
  phoneNumber: string;
}

export interface UpdateStorePayload {
  name: string;
  category: string;
  address: string;
  phoneNumber: string;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
}

export type UpdateProductPayload = CreateProductPayload;

export interface CreateDiscountPayload {
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  productId: number;
  startsAt: string;
  endsAt: string;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  reminderEnabled: boolean;
}

export interface CreateCustomerPayload {
  email: string;
  name: string;
  phoneNumber: string;
}

export interface IssueCouponPayload {
  customerId: number;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  expiresAt: string;
  usageChannel: CouponUsageChannel;
  sourceOnlinePurchaseId: number | null;
}
