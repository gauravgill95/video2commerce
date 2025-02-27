import { Store as StoreType } from '@/types/api';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  currentStore: StoreType | null;
  recentStores: StoreType[];
  setStore: (store: StoreType) => void;
  clearStore: () => void;
}

const useStoreState = create<StoreState>()(
  persist(
    (set, get) => ({
      currentStore: null,
      recentStores: [],
      setStore: (store: StoreType) => {
        // Add to recent stores if not already there
        const recentStores = get().recentStores;
        const storeExists = recentStores.some(s => s.url === store.url);
        
        let updatedRecentStores = recentStores;
        if (!storeExists) {
          // Add to the beginning and limit to 5 recent stores
          updatedRecentStores = [store, ...recentStores].slice(0, 5);
        }
        
        set({ currentStore: store, recentStores: updatedRecentStores });
      },
      clearStore: () => set({ currentStore: null }),
    }),
    {
      name: 'video2commerce-store',
    }
  )
);

// Helper functions to make the store easier to use
export const Store = {
  useStore: () => useStoreState(state => state.currentStore),
  useSetStore: () => useStoreState(state => state.setStore),
  useClearStore: () => useStoreState(state => state.clearStore),
  useRecentStores: () => useStoreState(state => state.recentStores),
  
  // Non-hook versions for use outside of components
  getStore: () => useStoreState.getState().currentStore,
  setStore: (store: StoreType) => useStoreState.getState().setStore(store),
  clearStore: () => useStoreState.getState().clearStore(),
  getRecentStores: () => useStoreState.getState().recentStores,
};