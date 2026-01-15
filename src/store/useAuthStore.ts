import { create } from 'zustand';

interface User {
  id: number;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },
}));
