import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function useAuthState() {
  const [mounted, setMounted] = useState(false);
  const authStore = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return default values during SSR, actual values after hydration
  if (!mounted) {
    return {
      isLoggedIn: false,
      userId: null,
      mounted: false
    };
  }

  return {
    isLoggedIn: authStore.isLoggedIn,
    userId: authStore.userId,
    mounted: true
  };
}