import { create } from 'zustand';
import { getMyStoreInfo, StoreInfo } from '@/shared/api/storeApi'; // 👈 storeApi 경로에 맞게 수정

interface StoreState {
  currentStoreId: number | null;
  storeInfo: StoreInfo | null;
  isLoading: boolean;
  error: string | null;

  fetchMyStore: () => Promise<void>;
  setCurrentStoreId: (storeId: number) => void;
  resetStore: () => void;
}

export const useStoreStore = create<StoreState>((set) => ({
  currentStoreId: null,
  storeInfo: null,
  isLoading: false,
  error: null,

  fetchMyStore: async () => {
    set({ isLoading: true, error: null });
    try {
      const storeData = await getMyStoreInfo();
      
      set({
        currentStoreId: storeData.id,
        storeInfo: storeData,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('내 매장 정보 조회 실패:', err);
      set({
        error: err.message || '매장 정보를 불러오지 못했습니다.',
        isLoading: false,
      });
    }
  },

  setCurrentStoreId: (storeId: number) => {
    set({ currentStoreId: storeId });
  },

  resetStore: () => {
    set({
      currentStoreId: null,
      storeInfo: null,
      isLoading: false,
      error: null,
    });
  },
}));