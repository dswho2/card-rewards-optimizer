// src/app/visualize/page.tsx
"use client";

import { useCardsStore } from '@/store/useCardsStore';
import CoverageVisualizer from '@/components/CoverageVisualizer';

export default function VisualizePage() {
  const cards = useCardsStore((state) => state.cards);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Category Coverage</h2>
      <CoverageVisualizer cards={cards} />
    </main>
  );
}
