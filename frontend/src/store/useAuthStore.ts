import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,

  setLoggedIn: (value) => set({ isLoggedIn: value }),

  // initialize from localStorage (to call once on app load)
  initializeAuth: () => {
    const token = localStorage.getItem('auth_token');
    set({ isLoggedIn: !!token });
  },
}));
