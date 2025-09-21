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
import { Menu, X, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
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
    setMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  if (!mounted) return null;

  return (
    <>
      {showLogin && <LoginModal onClose={handleLoginClose} />}

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <nav className="sticky top-0 flex justify-between items-center p-4 border-b dark:border-gray-700 bg-background/95 backdrop-blur-sm z-50">
        {/* Left side - Logo and Navigation */}
        <div className="flex gap-4 items-center">
          <Link href="/" className="text-xl font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 transform hover:scale-105" onClick={handleHomeClick}>CardRewards</Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex gap-4 items-center">
            <Link href="/discover" className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-2 rounded-md transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5" onClick={handleNavClick}>Discover</Link>
            <Link href="/cards" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-md transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5" onClick={handleNavClick}>My Cards</Link>
            <Link href="/visualize" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-md transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5" onClick={handleNavClick}>Visualize</Link>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 border rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110 hover:rotate-12"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isLoggedIn ? (
              <button
                onClick={handleSignOut}
                className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-foreground hover:bg-muted transition-all duration-200"
              aria-label="Toggle mobile menu"
            >
              <div className="relative">
                <Menu className={`h-6 w-6 transition-all duration-300 ${mobileMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
                <X className={`h-6 w-6 absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`absolute top-full left-0 right-0 md:hidden overflow-hidden transition-all duration-300 ease-in-out z-40 ${
          mobileMenuOpen
            ? 'max-h-96 opacity-100 translate-y-0'
            : 'max-h-0 opacity-0 -translate-y-2'
        }`}>
          <div className="border-t dark:border-gray-700 bg-background border-x border-b rounded-b-lg shadow-lg">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Link
                href="/discover"
                className="block px-3 py-2 text-base font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors transform hover:scale-[1.02]"
                onClick={handleNavClick}
              >
                Discover
              </Link>
              <Link
                href="/cards"
                className="block px-3 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors transform hover:scale-[1.02]"
                onClick={handleNavClick}
              >
                My Cards
              </Link>
              <Link
                href="/visualize"
                className="block px-3 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors transform hover:scale-[1.02]"
                onClick={handleNavClick}
              >
                Visualize
              </Link>
            </div>

            <div className="border-t dark:border-gray-700 px-4 pt-4 pb-3 space-y-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full flex items-center justify-center px-3 py-2 border rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02]"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {isLoggedIn ? (
                <button
                  onClick={handleSignOut}
                  className="w-full text-sm px-3 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowLogin(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-sm px-3 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
