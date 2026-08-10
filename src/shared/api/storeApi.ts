import { apiRequest } from './apiClient';

export interface StoreInfo {
  id: number;
  name: string;
  businessNumber: string;
  category: string;
  address: string;
  phoneNumber: string;
  onlineSalesStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const getMyStoreInfo = async (): Promise<StoreInfo> => {
  return apiRequest<StoreInfo>('/api/store-owner/stores/me');
};