// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { getCardRecommendation } from '@/app/api/user';
import { RecommendationResults } from '@/components/RecommendationResults';
import { useAuthState } from '@/hooks/useAuthState';
import { useUser } from '@/contexts/UserContext';
import { useSearch } from '@/contexts/SearchContext';
import type { RecommendationResponse } from '@/types';

export default function Home() {
  const { isLoggedIn, userId, mounted } = useAuthState();
  const { cards: userCards, loading: loadingCards } = useUser();
  const {
    input,
    setInput,
    amount,
    setAmount,
    loading,
    setLoading,
    error,
    setError,
    recommendations,
    setRecommendations,
    currentMode,
    setCurrentMode,
    reanalyzingMethod,
    setReanalyzingMethod,
    handleNewSearch,
  } = useSearch();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecommendations(null);
    setCurrentMode('purchase');

    if (!input.trim()) return;

    // For purchase recommendations, check if user has cards
    if (isLoggedIn && userCards.length === 0) {
      setError('You need to add some credit cards first to get personalized purchase recommendations. Visit the "My Cards" page to add your cards.');
      return;
    }

    setLoading(true);

    try {
      const results = await getCardRecommendation(
        input.trim(),
        amount ? parseFloat(amount) : undefined,
        new Date().toISOString(),
        userId ? userId : undefined
        // No detectionMethod specified = use cache and auto-detect method
      );
      setRecommendations(results);
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

  const handleReanalyze = async (method: string) => {
    if (!recommendations) return;

    setLoading(true);
    setError(null);
    setReanalyzingMethod(method);

    try {
      // Map the method names to backend expected values
      const methodMap: { [key: string]: string } = {
        'keyword': 'keyword',
        'semantic': 'semantic',
        'llm': 'openai'
      };

      // Re-run the same search but with the specified detection method
      // Cache automatically bypassed since detectionMethod is specified
      const results = await getCardRecommendation(
        recommendations.metadata.description,
        recommendations.metadata.amount || undefined,
        new Date().toISOString(),
        currentMode === 'purchase' && userId ? userId : undefined,
        methodMap[method] || method // Specifying method = auto bypass cache
      );
      setRecommendations(results);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong while reanalyzing');
      }
    } finally {
      setLoading(false);
      setReanalyzingMethod(null);
    }
  };

  // Show loading during hydration to prevent mismatch
  if (!mounted) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Card Rewards Optimizer</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  // Show recommendations if we have them
  if (recommendations) {
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <RecommendationResults
          results={recommendations}
          onNewSearch={handleNewSearch}
          onReanalyze={handleReanalyze}
          mode={currentMode}
          loading={loading}
          reanalyzingMethod={reanalyzingMethod}
        />
      </main>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Card Rewards Optimizer</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Find the best credit card for every purchase
        </p>
      </div>

      {!isLoggedIn ? (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Log in to get personalized card recommendations powered by AI.
          </p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Purchase Description
                </label>
                <input
                  id="description"
                  type="text"
                  placeholder="e.g. booking a hotel in NYC, buying groceries, gas station"
                  className="w-full p-4 text-lg border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-2">
                  Amount (optional)
                </label>
                <input
                  id="amount"
                  type="number"
                  placeholder="$0.00"
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : (
                <>
                  <div className="text-sm opacity-90 mb-1">Best from My Cards</div>
                  <div>Get Purchase Recommendation</div>
                </>
              )}
            </button>

            {/* Feature explanation */}
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p><strong>Purchase Recommendation:</strong> Find the best card from your existing cards to maximize rewards for this purchase.</p>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 text-red-700 bg-red-100 border border-red-300 rounded-lg dark:bg-red-900 dark:text-red-100 dark:border-red-700">
              <h3 className="font-semibold">Error</h3>
              <p>{error}</p>
            </div>
          )}

          {/* Quick suggestions */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Quick examples:
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                'booking a hotel in NYC',
                'dinner at Italian restaurant', 
                'groceries at Whole Foods',
                'gas at Shell station',
                'flight to Los Angeles',
                'Netflix subscription'
              ].map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold mb-1">AI-Powered</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced semantic analysis with Pinecone and OpenAI
              </p>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">Smart Matching</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analyzes spending caps, conditions, and optimal timing
              </p>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold mb-1">Detailed Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See confidence scores, alternatives, and reasoning
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
