import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  setLoggedIn: (value: boolean) => void;
  setUser: (userId: string | null) => void;
  initializeAuth: () => void;
  logout: () => void;
}

// Helper function to decode JWT token (basic implementation)
function decodeJWT(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userId: null,

  setLoggedIn: (value) => set({ isLoggedIn: value }),
  
  setUser: (userId) => set({ userId }),

  // initialize from localStorage (to call once on app load)
  initializeAuth: () => {
    // Only run on client side to avoid hydration mismatch
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.id) {
        set({ isLoggedIn: true, userId: decoded.id });
      } else {
        set({ isLoggedIn: true, userId: null });
      }
    } else {
      set({ isLoggedIn: false, userId: null });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    set({ isLoggedIn: false, userId: null });
  },
}));
