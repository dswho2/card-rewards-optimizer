// src/components/navbar.tsx
'use client';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="flex justify-between items-center p-4 border-b dark:border-gray-700">
      <div className="flex gap-4 items-center">
        <Link href="/" className="text-xl font-semibold">CardRewards</Link>
        <Link href="/cards" className="text-sm text-blue-600 dark:text-blue-400">My Cards</Link>
        <Link href="/visualize" className="text-sm text-blue-600 dark:text-blue-400">Visualize</Link>
      </div>
      <div className="space-x-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="border px-3 py-1 rounded-md text-sm"
        >
          Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>
    </nav>
  );
}
