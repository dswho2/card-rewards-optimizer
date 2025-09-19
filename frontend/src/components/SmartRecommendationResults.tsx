'use client';

import CreditCardItem from './CreditCardItem';

interface SmartRecommendationResultsProps {
  results: any;
  onNewAnalysis: () => void;
}

export function SmartRecommendationResults({ results, onNewAnalysis }: SmartRecommendationResultsProps) {
  // Handle new category response format vs old portfolio gap format
  const isPortfolioMode = results.mode === 'auto';
  const isCategoryMode = results.mode === 'category';

  // For category mode, check if it's the new format
  const isNewCategoryFormat = isCategoryMode && results.userCurrentCards !== undefined;

  if (!results || (!results.recommendations && !results.marketLeaders && !results.gaps)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No recommendations available.</p>
        <button
          onClick={onNewAnalysis}
          className="mt-4 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isNewCategoryFormat) {
    return renderCategoryComparison();
  }

  // Check if it's the new gap-based portfolio format
  if (isPortfolioMode && results.gaps) {
    return renderPortfolioGaps();
  }

  return renderPortfolioAnalysis();

  function renderPortfolioGaps() {
    const { gaps, summary } = results;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-lg">Portfolio Gap Analysis</h4>
          <button
            onClick={onNewAnalysis}
            className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            New Analysis
          </button>
        </div>

        {/* Analysis Summary */}
        {summary && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Portfolio Summary</h5>
            <div className="grid grid-cols-3 gap-4 text-sm text-blue-700 dark:text-blue-300">
              <div className="text-center">
                <div className="font-bold text-lg">{summary.totalGaps || 0}</div>
                <div>Categories with gaps</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{summary.highPriorityGaps || 0}</div>
                <div>High priority gaps</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{(summary.totalImprovementPotential || 0).toFixed(1)}%</div>
                <div>Total improvement potential</div>
              </div>
            </div>
          </div>
        )}

        {/* Category Gaps */}
        {gaps.length === 0 ? (
          <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg border">
            <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">🎉 Excellent Portfolio!</h3>
            <p className="text-green-700 dark:text-green-300 mb-2">
              No significant gaps found in your credit card portfolio.
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Your current cards provide competitive rewards across major spending categories.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {gaps.map((gap: any, gapIndex: number) => (
              <div key={gap.category} className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
                {/* Category Header */}
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{gap.category} Category</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current: {(gap.userCurrentRate || 1.0).toFixed(1)}x •
                        Market best: {(gap.marketBestRate || 1.0).toFixed(1)}x •
                        <span className={`ml-1 font-medium ${
                          gap.priority === 'high' ? 'text-red-600' :
                          gap.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {gap.priority} priority
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-orange-600">
                        +{(gap.improvementPotential || 0).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">improvement potential</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations for this category */}
                <div className="p-6">
                  <h4 className="font-medium mb-4">Recommended Cards for {gap.category}</h4>
                  <div className="space-y-4">
                    {gap.recommendations.map((card: any, cardIndex: number) => (
                      <CreditCardItem
                        key={`${gap.category}-${card.cardId}-${cardIndex}`}
                        card={{
                          id: card.cardId,
                          name: card.cardName,
                          issuer: card.issuer,
                          annual_fee: card.annualFee || 0,
                          rewards: card.rewards || [],
                          image_url: card.imageUrl || `/api/cards/${card.cardId}/image`,
                          notes: ''
                        }}
                        issuer={card.issuer}
                        className="bg-gray-50 dark:bg-gray-700"
                        rightContent={
                          <div>
                            <div className="font-bold text-green-600 text-lg">{card.improvement}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {(card.currentRate || 1.0).toFixed(1)}x → {(card.newRate || 1.0).toFixed(1)}x
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Annual Fee: ${card.annualFee || 0}
                            </div>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analysis Details */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Analysis Details:</strong>
            <div className="mt-1 grid grid-cols-2 gap-4">
              <div>Mode: Portfolio Gap Analysis</div>
              <div>Analyzed: {new Date(results.analyzedAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderCategoryComparison() {
    const { userCurrentCards, marketLeaders, analysis, category } = results;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-lg">
            {category} Card Comparison
          </h4>
          <button
            onClick={onNewAnalysis}
            className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            New Analysis
          </button>
        </div>

        {/* Analysis Summary */}
        {analysis && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Analysis Summary</h5>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Your best rate: <strong>{(analysis.userBestRate || 1.0).toFixed(1)}x</strong> •
              Market best rate: <strong>{(analysis.marketBestRate || 1.0).toFixed(1)}x</strong>
              {analysis.hasGoodCoverage ? (
                <span className="block mt-1">✅ You have good coverage for this category!</span>
              ) : (
                <span className="block mt-1">💡 Opportunity for improvement available</span>
              )}
            </div>
          </div>
        )}

        {/* User's Current Cards */}
        <div>
          <h5 className="font-medium mb-3">Your Current {category} Cards</h5>
          {userCurrentCards.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-dashed">
              <p className="text-gray-600 dark:text-gray-400 text-center">
                You don't have any cards with specific {category.toLowerCase()} rewards
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userCurrentCards.map((card: any, index: number) => (
                <CreditCardItem
                  key={card.cardId}
                  card={{
                    id: card.cardId,
                    name: card.cardName,
                    issuer: card.issuer,
                    annual_fee: card.annualFee || 0,
                    rewards: [],
                    image_url: `/api/cards/${card.cardId}/image`,
                    notes: ''
                  }}
                  issuer={card.issuer}
                  className="bg-white dark:bg-gray-800"
                  rightContent={
                    <div className="text-right">
                      <div className="font-bold text-lg">{(card.rate || 1.0).toFixed(1)}x</div>
                      <div className="text-xs text-gray-500">Annual Fee: ${card.annualFee || 0}</div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Market Leaders */}
        <div>
          <h5 className="font-medium mb-3">Market Leaders</h5>
          {marketLeaders.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border">
              <p className="text-green-700 dark:text-green-300 text-center">
                No better cards found - you already have excellent {category.toLowerCase()} coverage!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {marketLeaders.map((card: any, index: number) => (
                <CreditCardItem
                  key={card.cardId}
                  card={{
                    id: card.cardId,
                    name: card.cardName,
                    issuer: card.issuer,
                    annual_fee: card.annualFee || 0,
                    rewards: card.rewards || [],
                    image_url: card.imageUrl || `/api/cards/${card.cardId}/image`,
                    notes: ''
                  }}
                  issuer={card.issuer}
                  className="bg-white dark:bg-gray-800 shadow-sm"
                  rightContent={
                    <div>
                      <div className="font-bold text-lg text-green-600">
                        {card.improvement}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {(card.currentRate || 1.0).toFixed(1)}x → {(card.newRate || 1.0).toFixed(1)}x
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        #{index + 1} recommendation
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderPortfolioAnalysis() {
    const recommendations = Array.isArray(results.recommendations) ? results.recommendations : [];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">
            {isPortfolioMode ? 'Portfolio Gap Analysis' : `Best ${results.category} Cards`}
          </h4>
          <button
            onClick={onNewAnalysis}
            className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            New Analysis
          </button>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {isPortfolioMode
                ? 'Great news! No significant gaps found in your portfolio.'
                : 'No better cards found for this category.'}
            </p>
            <p className="text-sm text-gray-500">
              {isPortfolioMode
                ? 'Your current cards provide competitive rewards across major categories.'
                : 'Your current cards already offer good rewards for this category.'}
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm text-green-700 dark:text-green-300 mb-4">
              Found {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
              {isPortfolioMode ? ' to fill portfolio gaps' : ` for ${results.category}`}
            </div>

            {recommendations.map((card: any, index: number) => (
              <CreditCardItem
                key={card.cardId}
                card={{
                  id: card.cardId,
                  name: card.cardName,
                  issuer: card.issuer,
                  annual_fee: card.annualFee || 0,
                  rewards: card.rewards || [],
                  image_url: card.imageUrl || `/api/cards/${card.cardId}/image`,
                  notes: ''
                }}
                issuer={card.issuer}
                className="bg-white dark:bg-gray-800 shadow-sm"
                rightContent={
                  <div>
                    <div className="font-bold text-lg text-green-600">
                      {card.improvement}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {(card.currentRate || 1.0).toFixed(1)}% → {(card.newRate || 1.0).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex flex-col gap-1">
                      <span>Category: {card.category}</span>
                      <span>#{index + 1} recommendation</span>
                    </div>
                  </div>
                }
              />
            ))}
          </>
        )}

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Analysis Details:</strong>
            <div className="mt-1 grid grid-cols-2 gap-4">
              <div>Mode: {isPortfolioMode ? 'Portfolio Gaps' : 'Category Specific'}</div>
              <div>Analyzed: {new Date(results.analyzedAt).toLocaleString()}</div>
            </div>
            {results.category && (
              <div className="mt-1">Category: {results.category}</div>
            )}
          </div>
        </div>
      </div>
    );
  }
}