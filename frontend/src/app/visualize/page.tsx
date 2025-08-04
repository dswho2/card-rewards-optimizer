// src/app/visualize/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useCardsStore } from '@/store/useCardsStore';
import CoverageVisualizer from '@/components/CoverageVisualizer';

export default function VisualizePage() {
  const cards = useCardsStore((state) => state.cards);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) setIsLoggedIn(true);
  }, []);

  if (!isLoggedIn) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Category Coverage</h2>
        <p className="text-gray-600 dark:text-gray-300">Log in to visualize your card coverage.</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Category Coverage</h2>
      <CoverageVisualizer cards={cards} />
    </main>
  );
}
