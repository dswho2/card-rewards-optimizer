'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CreditCardItem from './CreditCardItem';
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star,
  Clock,
  Zap,
  ChevronDown
} from 'lucide-react';
import type { RecommendationResponse } from '@/types';

interface RecommendationResultsProps {
  results: RecommendationResponse;
  onNewSearch: () => void;
  onReanalyze?: (method: string) => void;
  mode?: 'purchase' | 'discovery';
  loading?: boolean;
  reanalyzingMethod?: string | null;
}

export function RecommendationResults({ results, onNewSearch, onReanalyze, mode, loading, reanalyzingMethod }: RecommendationResultsProps) {
  const topRecommendation = results.recommendations[0];
  const [showDetectionDropdown, setShowDetectionDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDetectionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getSourceConfig = (source: string) => {
    // Map all possible backend sources to our 3 standard methods
    const sourceMapping = {
      // Keyword matching variations
      'keyword': 'keyword',
      'cache': 'keyword',
      'merchant': 'keyword',
      'exact_match': 'keyword',

      // Semantic search variations
      'pinecone_semantic': 'semantic',
      'semantic': 'semantic',
      'vector': 'semantic',

      // LLM prompting variations
      'openai': 'llm',
      'llm': 'llm',
      'gpt': 'llm'
    };

    const standardMethods = {
      'keyword': { label: 'Keyword Matching', variant: 'secondary' as const, icon: <Zap className="h-3 w-3" /> },
      'semantic': { label: 'Semantic Search', variant: 'secondary' as const, icon: <Star className="h-3 w-3" /> },
      'llm': { label: 'LLM Prompting', variant: 'secondary' as const, icon: <CheckCircle className="h-3 w-3" /> }
    };

    const mappedSource = sourceMapping[source as keyof typeof sourceMapping] || 'keyword';
    return standardMethods[mappedSource as keyof typeof standardMethods];
  };

  const detectionMethods = [
    { value: 'keyword', label: 'Keyword Matching', icon: <Zap className="h-3 w-3" /> },
    { value: 'semantic', label: 'Semantic Search', icon: <Star className="h-3 w-3" /> },
    { value: 'llm', label: 'LLM Prompting', icon: <CheckCircle className="h-3 w-3" /> }
  ];

  const getCurrentMethod = (source: string): string | null => {
    try {
      const sourceMapping = {
        'keyword': 'keyword',
        'cache': 'keyword',
        'merchant': 'keyword',
        'exact_match': 'keyword',
        'pinecone_semantic': 'semantic',
        'semantic': 'semantic',
        'vector': 'semantic',
        'openai': 'llm',
        'llm': 'llm',
        'gpt': 'llm'
      };

      if (!source || typeof source !== 'string') {
        console.warn('Invalid source provided to getCurrentMethod:', source);
        return null;
      }

      return sourceMapping[source as keyof typeof sourceMapping] || null;
    } catch (error) {
      console.warn('Failed to determine current method:', error);
      return null; // Allow all methods on error
    }
  };

  const handleReanalyze = (method: string) => {
    if (onReanalyze) {
      onReanalyze(method);
    } else {
      // Fallback: if no onReanalyze provided, we could show a message or handle differently
      console.log('Reanalyze requested with method:', method);
    }
    setShowDetectionDropdown(false);
  };

  const currentMethod = getCurrentMethod(results.source);

  const getMethodDisplayName = (method: string): string => {
    const methodNames = {
      'keyword': 'Keyword Matching',
      'semantic': 'Semantic Search',
      'llm': 'LLM Prompting'
    };
    return methodNames[method as keyof typeof methodNames] || method;
  };

  const hasValidAmount = () => {
    const amount = results.metadata.amount;
    return amount != null &&
           amount !== 0 &&
           Number(amount) > 0;
  };

  return (
    <div className="space-y-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="flex items-center gap-3 bg-background p-4 rounded-lg shadow-lg border border-border">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-foreground">
              {reanalyzingMethod
                ? `Reanalyzing with ${getMethodDisplayName(reanalyzingMethod)}...`
                : 'Reanalyzing with different method...'
              }
            </span>
          </div>
        </div>
      )}
      {/* Analysis Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Analysis Results</CardTitle>
              {mode && (
                <Badge variant={mode === 'purchase' ? 'default' : 'secondary'} className="mt-1">
                  {mode === 'purchase' ? 'Purchase Recommendation' : 'Card Discovery'}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onNewSearch}>
              New Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <Badge variant="secondary" className="mt-1 text-sm">
                {results.category}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getConfidenceColor(results.confidence)}`}
                    style={{ width: `${results.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {(results.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Detection Method</p>
              <div className="relative mt-1" ref={dropdownRef}>
                <div
                  onClick={() => setShowDetectionDropdown(!showDetectionDropdown)}
                  className="inline-block cursor-pointer"
                >
                  <Badge variant={getSourceConfig(results.source).variant} className="flex items-center gap-1 hover:opacity-80">
                    {getSourceConfig(results.source).icon}
                    {getSourceConfig(results.source).label}
                    <ChevronDown className="h-3 w-3" />
                  </Badge>
                </div>

                {showDetectionDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 min-w-[150px]">
                    {detectionMethods.map((method) => {
                      const isCurrentMethod = currentMethod ? method.value === currentMethod : false;

                      return (
                        <button
                          key={method.value}
                          onClick={() => !isCurrentMethod && handleReanalyze(method.value)}
                          disabled={isCurrentMethod}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors first:rounded-t-md last:rounded-b-md ${
                            isCurrentMethod
                              ? 'cursor-not-allowed opacity-50 text-muted-foreground bg-muted'
                              : 'hover:bg-muted cursor-pointer text-foreground'
                          }`}
                        >
                          {method.icon}
                          <span>{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cards Analyzed</p>
              <p className="font-semibold text-lg mt-1">{results.metadata.cardsAnalyzed}</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>&quot;{results.metadata.description}&quot;</strong>
              {hasValidAmount() ? (
                <span className="font-medium"> • ${Number(results.metadata.amount).toFixed(2)}</span>
              ) : null}
            </p>
            {results.reasoning && (
              <p className="text-xs text-muted-foreground mt-1">
                {results.reasoning}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Recommendation */}
      {topRecommendation && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              Best Card for This Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreditCardItem
              card={{
                id: topRecommendation.cardId,
                name: topRecommendation.cardName,
                issuer: topRecommendation.issuer,
                annual_fee: topRecommendation.annualFee,
                rewards: [],
                image_url: topRecommendation.imageUrl || `/api/cards/${topRecommendation.cardId}/image`,
                notes: ''
              }}
              reasoning={`${topRecommendation.effectiveRate}% back on ${topRecommendation.category.toLowerCase()} purchases${topRecommendation.conditions.length > 0 ? '\n' + topRecommendation.conditions.map(c => `• ${c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()}`).join('\n') : ''}${topRecommendation.capStatus && topRecommendation.capStatus.total ? `\n• Spending cap: $${topRecommendation.capStatus.remaining || 0} remaining of $${topRecommendation.capStatus.total}` : ''}`}
              issuer={topRecommendation.issuer}
              className="bg-white dark:bg-gray-800"
              rightContent={
                <div className="text-right space-y-2">
                  <div>
                    <div className="font-bold text-lg text-green-600">
                      {topRecommendation.effectiveRate}%
                    </div>
                    <div className="text-xs text-gray-500">Reward Rate</div>
                  </div>
                  {hasValidAmount() && (
                    <div>
                      <div className="font-bold text-lg text-green-600">
                        ${topRecommendation.rewardValue}
                      </div>
                      <div className="text-xs text-gray-500">Reward Value</div>
                    </div>
                  )}
                </div>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Alternative Recommendations */}
      {results.alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Alternative Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.alternatives.slice(0, 5).map((card, index) => (
                <div key={card.cardId} className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <span className="text-2xl font-bold text-muted-foreground">#{index + 2}</span>
                  </div>
                  <CreditCardItem
                    card={{
                      id: card.cardId,
                      name: card.cardName,
                      issuer: card.issuer,
                      annual_fee: card.annualFee,
                      rewards: [],
                      image_url: card.imageUrl || `/api/cards/${card.cardId}/image`,
                      notes: ''
                    }}
                    reasoning={`${card.effectiveRate}% back on ${card.category.toLowerCase()} purchases${card.conditions.length > 0 ? '\n' + card.conditions.map(c => `• ${c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()}`).join('\n') : ''}`}
                    issuer={card.issuer}
                    className="bg-gray-50 dark:bg-gray-700 flex-1"
                    rightContent={
                      <div className="text-right space-y-1">
                        <div>
                          <div className="font-bold text-lg">{card.effectiveRate}%</div>
                          <div className="text-xs text-gray-500">Reward Rate</div>
                        </div>
                        {hasValidAmount() && (
                          <div>
                            <div className="text-sm font-medium">
                              ${card.rewardValue}
                            </div>
                            <div className="text-xs text-gray-500">Reward Value</div>
                          </div>
                        )}
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis */}
      {results.details && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {results.recommendations.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Recommendations</p>
              </div>
              
              {topRecommendation && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {topRecommendation.effectiveRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Best Rate Found</p>
                </div>
              )}
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {getConfidenceText(results.confidence)}
                </p>
                <p className="text-sm text-muted-foreground">Confidence Level</p>
              </div>
              
              {results.details.topScore && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {(results.details.topScore * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Match Similarity</p>
                </div>
              )}
            </div>

            {results.details.allScores && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Category Similarity Scores</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(results.details.allScores).map(([category, score]) => (
                    <div key={category} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                      <span>{category}</span>
                      <span className="font-medium">{(parseFloat(score) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}