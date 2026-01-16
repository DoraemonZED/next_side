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
  toast: Toast | null;
  confirm: Confirm | null;
  setLoading: (loading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  showConfirm: (confirm: Confirm) => void;
  hideConfirm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  toast: null,
  confirm: null,
  setLoading: (loading) => set({ isLoading: loading }),
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  hideToast: () => set({ toast: null }),
  showConfirm: (confirm) => set({ confirm }),
  hideConfirm: () => set({ confirm: null }),
}));
