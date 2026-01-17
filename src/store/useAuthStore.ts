import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  expiresAt: string | null; // token 过期时间 ISO 字符串
  expiresIn: number | null; // 剩余秒数
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      expiresAt: null,
      expiresIn: null,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, expiresAt: null, expiresIn: null }),
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            set({ 
              user: data.user, 
              isAuthenticated: true, 
              isLoading: false,
              expiresAt: data.expiresAt || null,
              expiresIn: data.expiresIn || null,
            });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false, expiresAt: null, expiresIn: null });
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false, expiresAt: null, expiresIn: null });
        }
      },
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
          set({ user: null, isAuthenticated: false, isLoading: false, expiresAt: null, expiresIn: null });
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
