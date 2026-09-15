import { create } from 'zustand';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Confirm {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface UIState {
  isLoading: boolean;
  loadingCount: number;
  toast: Toast | null;
  confirm: Confirm | null;
  setLoading: (loading: boolean) => void;
  beginLoading: () => void;
  endLoading: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  showConfirm: (confirm: Confirm) => void;
  hideConfirm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  loadingCount: 0,
  toast: null,
  confirm: null,
  setLoading: (loading) => set((state) => {
    const loadingCount = Math.max(0, state.loadingCount + (loading ? 1 : -1));
    return { loadingCount, isLoading: loadingCount > 0 };
  }),
  beginLoading: () => set((state) => {
    const loadingCount = state.loadingCount + 1;
    return { loadingCount, isLoading: true };
  }),
  endLoading: () => set((state) => {
    const loadingCount = Math.max(0, state.loadingCount - 1);
    return { loadingCount, isLoading: loadingCount > 0 };
  }),
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  hideToast: () => set({ toast: null }),
  showConfirm: (confirm) => set({ confirm }),
  hideConfirm: () => set({ confirm: null }),
}));
