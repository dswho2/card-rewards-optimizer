// src/app/page.tsx
'use client';

import { useState } from 'react';
import { getCardRec } from '@/api/user';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    category: string;
    bestCard: string;
    reward: string;
    reasoning: string;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:4000/api/recommend-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: input }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText || res.statusText}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      console.error('Error fetching recommendation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-3xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">What's your purchase?</h1>

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

      {result && (
        <div className="mt-6 p-4 text-left border rounded-md bg-gray-100 dark:bg-gray-800 dark:text-white">
          <p><strong>Category:</strong> {result.category}</p>
          <p><strong>Best Card:</strong> {result.bestCard}</p>
          <p><strong>Reward:</strong> {result.reward}</p>
          <p><strong>Why:</strong> {result.reasoning}</p>
        </div>
      )}
    </main>
  );
}
