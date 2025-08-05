// src/components/navbar.tsx
'use client';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import LoginModal from './LoginModal';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);
  const authInit = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    setMounted(true);
    authInit();
  }, [authInit]);

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    setLoggedIn(false);
  };

  const handleLoginClose = () => {
    setShowLogin(false);
  };

  if (!mounted) return null;

  return (
    <>
      {showLogin && <LoginModal onClose={handleLoginClose} />}

      <nav className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <div className="flex gap-4 items-center">
          <Link href="/" className="text-xl font-semibold">CardRewards</Link>
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
