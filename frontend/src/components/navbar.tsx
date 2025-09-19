// src/components/navbar.tsx
'use client';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuthState } from '@/hooks/useAuthState';
import { useSearch } from '@/contexts/SearchContext';
import LoginModal from './LoginModal';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { handleNewSearch } = useSearch();

  const { isLoggedIn, mounted } = useAuthState();
  const logout = useAuthStore((s) => s.logout);
  const authInit = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    // Only initialize auth when mounted (handled by useAuthState)
    if (mounted) {
      const timer = setTimeout(() => {
        authInit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, authInit]);

  const handleSignOut = () => {
    logout();
  };

  const handleLoginClose = () => {
    setShowLogin(false);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/') {
      // If already on home page, just reset search state
      handleNewSearch();
    } else {
      // Navigate to home page and reset state
      handleNewSearch();
      router.push('/');
    }
  };

  if (!mounted) return null;

  return (
    <>
      {showLogin && <LoginModal onClose={handleLoginClose} />}

      <nav className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <div className="flex gap-4 items-center">
          <Link href="/" className="text-xl font-semibold" onClick={handleHomeClick}>CardRewards</Link>
          <Link href="/discover" className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">Discover</Link>
          <Link href="/cards" className="text-sm text-blue-600 dark:text-blue-400">My Cards</Link>
          <Link href="/visualize" className="text-sm text-blue-600 dark:text-blue-400">Visualize</Link>
        </div>

        <div className="space-x-2 flex items-center">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="border px-3 py-1 rounded-md text-sm"
          >
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>

          {isLoggedIn ? (
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm px-3 py-1 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
