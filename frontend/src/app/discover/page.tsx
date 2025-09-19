'use client';

import { useState, useCallback } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { SmartRecommendationResults } from '@/components/SmartRecommendationResults';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function DiscoverPage() {
  // Main view state
  const [currentView, setCurrentView] = useState<'portfolio' | 'category' | 'search'>('portfolio');

  // Smart discovery state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);

  // Card search state
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    issuer: '',
    network: '',
    annual_fee: '',
    reward_category: '',
    min_multiplier: ''
  });
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const { isLoggedIn, mounted } = useAuthState();

  const categories = ['Dining', 'Grocery', 'Gas', 'Travel', 'Entertainment', 'Online'];
  const issuers = ['Chase', 'American Express', 'Bank of America', 'Capital One', 'Citi', 'Wells Fargo'];
  const networks = ['Visa', 'Mastercard', 'American Express', 'Discover'];

  // Smart discovery handlers
  const handleSmartDiscovery = useCallback(async () => {
    if (!isLoggedIn) {
      setDiscoveryError('Please log in to use portfolio analysis');
      return;
    }

    setDiscoveryLoading(true);
    setDiscoveryError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/cards/analyze-portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          mode: currentView === 'category' ? 'category' : 'auto',
          category: currentView === 'category' ? selectedCategory : undefined
        })
      });

      if (!response.ok) {
        let errorMessage = 'Analysis failed';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            // Handle HTML error pages (likely authentication errors)
            if (response.status === 401 || response.status === 403) {
              errorMessage = 'Authentication required. Please log in again.';
            } else {
              errorMessage = `Server error (${response.status})`;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid response format');
      }

      const results = await response.json();
      setDiscoveryResults(results);
    } catch (err) {
      if (err instanceof Error) {
        setDiscoveryError(err.message);
      } else {
        setDiscoveryError('Something went wrong during analysis');
      }
    } finally {
      setDiscoveryLoading(false);
    }
  }, [currentView, selectedCategory, isLoggedIn]);

  const handleNewAnalysis = useCallback(() => {
    setDiscoveryResults(null);
    setDiscoveryError(null);
    setSelectedCategory('');
  }, []);

  // Card search handlers
  const handleCardSearch = useCallback(async () => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}/api/cards?${params}`);
      if (!response.ok) throw new Error('Search failed');

      const results = await response.json();
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [searchFilters]);

  const updateFilter = (key: string, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({
      search: '',
      issuer: '',
      network: '',
      annual_fee: '',
      reward_category: '',
      min_multiplier: ''
    });
    setSearchResults(null);
  };

  if (!mounted) {
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Discover Cards</h1>
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Credit Cards</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Find the perfect cards to optimize your rewards or explore our complete database
        </p>
      </div>

      {/* Discovery Mode Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setCurrentView('portfolio');
                setDiscoveryResults(null);
                setDiscoveryError(null);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'portfolio'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Portfolio Analysis
            </button>
            <button
              onClick={() => {
                setCurrentView('category');
                setDiscoveryResults(null);
                setDiscoveryError(null);
                setSelectedCategory('');
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'category'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Category Search
            </button>
            <button
              onClick={() => {
                setCurrentView('search');
                setSearchResults(null);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentView === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advanced Search
            </button>
          </nav>
        </div>
      </div>

      {/* Portfolio Analysis View */}
      {currentView === 'portfolio' && (
        <div className="mb-8 p-6 border rounded-lg bg-green-50 dark:bg-green-900/20">
          <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">
            Smart Card Discovery
          </h2>

          {!isLoggedIn ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please log in to use portfolio analysis and get personalized recommendations.
              </p>
              <p className="text-sm text-gray-500">
                Portfolio analysis requires access to your saved cards to find gaps and improvements.
              </p>
            </div>
          ) : !discoveryResults ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Portfolio Gap Analysis</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  Analyze your current cards to find categories where you could earn significantly more rewards.
                  We'll identify gaps where market-leading cards offer 1%+ better rates than your current portfolio.
                </p>
              </div>

              <button
                onClick={handleSmartDiscovery}
                disabled={discoveryLoading}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {discoveryLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing Portfolio...
                  </div>
                ) : (
                  'Find Portfolio Gaps'
                )}
              </button>
            </div>
          ) : (
            <SmartRecommendationResults
              results={discoveryResults}
              onNewAnalysis={handleNewAnalysis}
            />
          )}

          {discoveryError && (
            <div className="mt-4 p-4 text-red-700 bg-red-100 border border-red-300 rounded-lg dark:bg-red-900 dark:text-red-100 dark:border-red-700">
              <h3 className="font-semibold">Error</h3>
              <p>{discoveryError}</p>
            </div>
          )}
        </div>
      )}

      {/* Category Search View */}
      {currentView === 'category' && (
        <div className="mb-8 p-6 border rounded-lg bg-green-50 dark:bg-green-900/20">
          <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">
            Category-Specific Search
          </h2>

          {!isLoggedIn ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please log in to use category search and get personalized recommendations.
              </p>
              <p className="text-sm text-gray-500">
                Category search compares your current cards with the best market options.
              </p>
            </div>
          ) : !discoveryResults ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Find Best Category Cards</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  Find the best cards for a specific spending category and see how they compare to your current options.
                </p>
                <div className="max-w-md">
                  <label className="block text-sm font-medium mb-2">Select Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Choose a category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSmartDiscovery}
                disabled={discoveryLoading || !selectedCategory}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {discoveryLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Finding Best Cards...
                  </div>
                ) : (
                  'Find Best Category Cards'
                )}
              </button>
            </div>
          ) : (
            <SmartRecommendationResults
              results={discoveryResults}
              onNewAnalysis={handleNewAnalysis}
            />
          )}

          {discoveryError && (
            <div className="mt-4 p-4 text-red-700 bg-red-100 border border-red-300 rounded-lg dark:bg-red-900 dark:text-red-100 dark:border-red-700">
              <h3 className="font-semibold">Error</h3>
              <p>{discoveryError}</p>
            </div>
          )}
        </div>
      )}

      {/* Advanced Search View */}
      {currentView === 'search' && (
        <div className="mb-8 p-6 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">
            Advanced Card Search
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Card Name Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Card Name</label>
              <input
                type="text"
                placeholder="e.g. Sapphire, Freedom, Gold"
                value={searchFilters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Issuer Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Issuer</label>
              <select
                value={searchFilters.issuer}
                onChange={(e) => updateFilter('issuer', e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Issuers</option>
                {issuers.map(issuer => (
                  <option key={issuer} value={issuer}>{issuer}</option>
                ))}
              </select>
            </div>

            {/* Network Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Network</label>
              <select
                value={searchFilters.network}
                onChange={(e) => updateFilter('network', e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Networks</option>
                {networks.map(network => (
                  <option key={network} value={network}>{network}</option>
                ))}
              </select>
            </div>

            {/* Annual Fee Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Annual Fee</label>
              <select
                value={searchFilters.annual_fee}
                onChange={(e) => updateFilter('annual_fee', e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Fee</option>
                <option value="0">No Annual Fee</option>
                <option value="<100">Under $100</option>
                <option value=">=100">$100 or More</option>
              </select>
            </div>

            {/* Reward Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Reward Category</label>
              <select
                value={searchFilters.reward_category}
                onChange={(e) => updateFilter('reward_category', e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Minimum Multiplier */}
            <div>
              <label className="block text-sm font-medium mb-2">Min Reward Rate</label>
              <select
                value={searchFilters.min_multiplier}
                onChange={(e) => updateFilter('min_multiplier', e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Rate</option>
                <option value="2">2x or higher</option>
                <option value="3">3x or higher</option>
                <option value="4">4x or higher</option>
                <option value="5">5x or higher</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCardSearch}
              disabled={searchLoading}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {searchLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : (
                'Search Cards'
              )}
            </button>

            <button
              onClick={clearFilters}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">
                Search Results ({searchResults.cards?.length || 0} cards found)
              </h3>

              {searchResults.cards?.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border">
                  <p className="text-gray-600 dark:text-gray-400">
                    No cards found matching your criteria. Try adjusting your filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.cards?.map((card: any) => (
                    <div key={card.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                      <div className="mb-3">
                        <h4 className="font-semibold text-lg">{card.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{card.issuer}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Annual Fee:</span>
                          <span className={card.annual_fee === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                            ${card.annual_fee}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Network:</span>
                          <span className="font-medium">{card.network}</span>
                        </div>
                      </div>

                      {card.rewards && card.rewards.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Top Rewards:</p>
                          <div className="space-y-1">
                            {card.rewards.slice(0, 3).map((reward: any, index: number) => (
                              <div key={index} className="text-xs flex justify-between">
                                <span>{reward.category}</span>
                                <span className="font-medium">{reward.multiplier}x</span>
                              </div>
                            ))}
                            {card.rewards.length > 3 && (
                              <p className="text-xs text-gray-500">+{card.rewards.length - 3} more categories</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}