'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Star,
  Clock,
  Zap
} from 'lucide-react';
import type { RecommendationResponse } from '@/types';

interface RecommendationResultsProps {
  results: RecommendationResponse;
  onNewSearch: () => void;
  mode?: 'purchase' | 'discovery';
}

export function RecommendationResults({ results, onNewSearch, mode }: RecommendationResultsProps) {
  const topRecommendation = results.recommendations[0];
  
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

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      'keyword': { label: 'Keyword Match', variant: 'secondary' as const, icon: <Zap className="h-3 w-3" /> },
      'pinecone_semantic': { label: 'AI Semantic', variant: 'default' as const, icon: <Star className="h-3 w-3" /> },
      'openai': { label: 'OpenAI', variant: 'outline' as const, icon: <CheckCircle className="h-3 w-3" /> },
      'cache': { label: 'Cached', variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> }
    };
    
    const config = sourceConfig[source as keyof typeof sourceConfig] || { label: source, variant: 'outline' as const, icon: null };
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
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
              <div className="mt-1">
                {getSourceBadge(results.source)}
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
              {results.metadata.amount && (
                <span className="text-green-600 font-medium"> • ${results.metadata.amount.toFixed(2)}</span>
              )}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-xl">{topRecommendation.cardName}</h3>
                  <p className="text-muted-foreground font-medium">{topRecommendation.issuer}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reward Rate:</span>
                    <span className="font-bold text-lg text-primary">
                      {topRecommendation.effectiveRate}%
                    </span>
                  </div>
                  
                  {results.metadata.amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Reward Value:</span>
                      <span className="font-bold text-lg text-green-600">
                        ${topRecommendation.rewardValue}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Annual Fee:</span>
                    <span className={`font-semibold ${topRecommendation.annualFee === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${topRecommendation.annualFee}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Simplicity Score:</span>
                    <span className="font-semibold">
                      {topRecommendation.simplicity}/100
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Why This Card?</h4>
                  <p className="text-sm text-muted-foreground">
                    {topRecommendation.reasoning}
                  </p>
                </div>

                {topRecommendation.conditions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Important Conditions
                    </h4>
                    <ul className="space-y-1">
                      {topRecommendation.conditions.map((condition, index) => (
                        <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {topRecommendation.capStatus && topRecommendation.capStatus.total && (
                  <div>
                    <h4 className="font-semibold mb-2">Spending Cap Status</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Used</span>
                        <span>${(topRecommendation.capStatus.total - (topRecommendation.capStatus.remaining || 0)).toFixed(0)} / ${topRecommendation.capStatus.total}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ 
                            width: `${((topRecommendation.capStatus.total - (topRecommendation.capStatus.remaining || 0)) / topRecommendation.capStatus.total) * 100}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ${topRecommendation.capStatus.remaining} remaining this period
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                <div key={card.cardId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 2}</span>
                      <div>
                        <h4 className="font-semibold">{card.cardName}</h4>
                        <p className="text-sm text-muted-foreground">{card.issuer}</p>
                      </div>
                    </div>
                    {card.conditions.length > 0 && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {card.conditions[0]}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{card.effectiveRate}%</p>
                    {results.metadata.amount && (
                      <p className="text-sm text-green-600 font-medium">${card.rewardValue}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      ${card.annualFee} annual fee
                    </p>
                  </div>
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