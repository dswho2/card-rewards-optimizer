// src/app/visualize/page.tsx
"use client";

import { useCardsStore } from '@/store/useCardsStore';
import { useAuthStore } from '@/store/useAuthStore';
import CoverageVisualizer from '@/components/CoverageVisualizer';

export default function VisualizePage() {
  const cards = useCardsStore((state) => state.cards);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!isLoggedIn) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Category Coverage</h2>
        <p className="text-gray-600 dark:text-gray-300">Log in to visualize your card coverage.</p>
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Category Coverage</h2>
        <p className="text-gray-600 dark:text-gray-300">You don&apos;t have any cards to visualize. Go to the Cards page to add one.</p>
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
