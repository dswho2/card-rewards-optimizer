// src/app/visualize/page.tsx
"use client";

import { useAuthState } from '@/hooks/useAuthState';
import { useUser } from '@/contexts/UserContext';
import CoverageVisualizer from '@/components/CoverageVisualizer';

export default function VisualizePage() {
  const { isLoggedIn, mounted } = useAuthState();
  const { cards, loading, error, refetchCards } = useUser();

  // Debug logging
  console.log('Visualize page state:', { 
    isLoggedIn, 
    mounted, 
    cardsCount: cards.length, 
    loading, 
    error,
    cards: cards.slice(0, 2) // First 2 cards for debugging
  });


  // Show loading state during hydration
  if (!mounted) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Category Coverage</h2>
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Category Coverage</h2>
        <p className="text-gray-600 dark:text-gray-300">Log in to visualize your card coverage.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Category Coverage</h2>
        <p className="text-gray-600 dark:text-gray-300">Loading your cards...</p>
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <main className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Category Coverage</h2>
        <p className="text-gray-600 dark:text-gray-300">You don&apos;t have any cards to visualize. Go to the Cards page to add one.</p>
        
        {/* Debug section */}
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p className="text-sm">Logged in: {isLoggedIn ? 'Yes' : 'No'}</p>
          <p className="text-sm">Loading: {loading ? 'Yes' : 'No'}</p>
          <p className="text-sm">Cards count: {cards.length}</p>
          <p className="text-sm">Error: {error || 'None'}</p>
          <button 
            onClick={refetchCards}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Refetch Cards
          </button>
        </div>
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
