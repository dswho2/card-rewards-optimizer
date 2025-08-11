// src/app/page.tsx
'use client';

import { useState } from 'react';
import { getCardRec } from '@/app/api/user';
import { useCardsStore } from '@/store/useCardsStore';
import CreditCardItem from '@/components/CreditCardItem';
import { useAuthStore } from '@/store/useAuthStore';
import type { Card, Category } from '@/types';

const getRewardValue = (card: Card, category: string): number =>
  card.rewards.find((r) => r.category === category)?.multiplier ?? 0;

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [bestCards, setBestCards] = useState<Card[]>([]);

  const cards = useCardsStore((state) => state.cards);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCategory(null);
    setBestCards([]);

    if (!input.trim()) return;

    if (!cards.length) {
      setError('You need to add cards before getting a recommendation.');
      return;
    }

    setLoading(true);

    try {
      const matchedCategory = await getCardRec(input);
      setCategory(matchedCategory);

      const key = matchedCategory as Category;

      let maxReward = 0;
      for (const card of cards) {
        const reward = Math.max(getRewardValue(card, key), getRewardValue(card, 'All'));
        if (reward > maxReward) maxReward = reward;
      }

      const matching = cards.filter((card) => {
        const reward = Math.max(getRewardValue(card, key), getRewardValue(card, 'All'));
        return reward === maxReward && reward > 0;
      });

      setBestCards(matching);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="p-6 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">What&apos;s your purchase?</h1>
        <p className="text-gray-600 dark:text-gray-300">Log in to get personalized card recommendations.</p>
      </main>
    );
  }

  if (!cards.length) {
    return (
      <main className="p-6 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">What&apos;s your purchase?</h1>
        <p className="text-gray-600 dark:text-gray-300">You don&apos;t have any cards saved. Go to the My Cards page to add one.</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-3xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">What&apos;s your purchase?</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="e.g. Booking a hotel in NYC"
          className="w-full p-3 border rounded-md dark:bg-gray-800 dark:text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get Recommendation'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded dark:bg-red-900 dark:text-red-100 dark:border-red-700">
          {error}
        </div>
      )}

      {category && (
        <h2 className="mt-8 text-xl font-semibold">
          Matched Category: <span className="text-blue-600">{category}</span>
        </h2>
      )}

      {bestCards.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          {bestCards.map((card) => (
            <CreditCardItem key={card.id} card={card} editMode={false} />
          ))}
        </div>
      )}

      {category && bestCards.length === 0 && (
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          No matching cards found for category: <strong>{category}</strong>
        </p>
      )}
    </main>
  );
}
