import type {
  Coupon,
  CreateCustomerPayload,
  CreateDiscountPayload,
  CreateProductPayload,
  CreateStorePayload,
  Customer,
  Discount,
  DiscountStatus,
  IssueCouponPayload,
  OnlineSalesStatus,
  Product,
  ProductStatus,
  Store,
  UpdateProductPayload,
  UpdateStorePayload,
} from "../../../entities/commerce/commerce.types";
import { apiRequest } from "../../../shared/api/apiClient";
import { normalizePhoneNumber } from "../../../shared/lib/phoneNumber";

const STORE_OWNER_BASE = "/api/store-owner/stores/me";

function withNormalizedPhone<T extends { phoneNumber: string }>(payload: T): T {
  return {
    ...payload,
    phoneNumber: normalizePhoneNumber(payload.phoneNumber),
  };
}

export const commerceApi = {
  getStore: () => apiRequest<Store>("/api/store-owner/stores/me"),
  createStore: (payload: CreateStorePayload) => apiRequest<Store>("/api/store-owner/stores", {
    method: "POST",
    body: JSON.stringify(withNormalizedPhone(payload)),
  }),
  updateStore: (payload: UpdateStorePayload) => apiRequest<Store>(`${STORE_OWNER_BASE}`, {
    method: "PUT",
    body: JSON.stringify(withNormalizedPhone(payload)),
  }),

  getProducts: () => apiRequest<Product[]>(`${STORE_OWNER_BASE}/products`),
  createProduct: (payload: CreateProductPayload) => apiRequest<Product>(`${STORE_OWNER_BASE}/products`, {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  updateProduct: (productId: number, payload: UpdateProductPayload) =>
    apiRequest<Product>(`${STORE_OWNER_BASE}/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  changeProductStatus: (productId: number, status: ProductStatus) =>
    apiRequest<Product>(`${STORE_OWNER_BASE}/products/${productId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  changeOnlineSalesStatus: (status: OnlineSalesStatus) =>
    apiRequest<Store>(`${STORE_OWNER_BASE}/online-sales/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  registerOnline: (productId: number) =>
    apiRequest<Product>(`${STORE_OWNER_BASE}/online-sales/products/${productId}`, {
      method: "POST",
    }),
  unregisterOnline: (productId: number) =>
    apiRequest<Product>(`${STORE_OWNER_BASE}/online-sales/products/${productId}`, {
      method: "DELETE",
    }),

  getDiscounts: () => apiRequest<Discount[]>(`${STORE_OWNER_BASE}/discounts`),
  createDiscount: (payload: CreateDiscountPayload) =>
    apiRequest<Discount>(`${STORE_OWNER_BASE}/discounts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  changeDiscountStatus: (discountId: number, status: DiscountStatus) =>
    apiRequest<Discount>(`${STORE_OWNER_BASE}/discounts/${discountId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getCustomers: () => apiRequest<Customer[]>(`${STORE_OWNER_BASE}/customers`),
  createCustomer: (payload: CreateCustomerPayload) =>
    apiRequest<Customer>(`${STORE_OWNER_BASE}/customers`, {
      method: "POST",
      body: JSON.stringify(withNormalizedPhone(payload)),
    }),
  getCoupons: () => apiRequest<Coupon[]>(`${STORE_OWNER_BASE}/coupons`),
  issueCoupon: (payload: IssueCouponPayload) =>
    apiRequest<Coupon>(`${STORE_OWNER_BASE}/coupons`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  revokeCoupon: (couponId: number) =>
    apiRequest<Coupon>(`${STORE_OWNER_BASE}/coupons/${couponId}/revoke`, {
      method: "PATCH",
    }),
};
