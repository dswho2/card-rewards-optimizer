# Frontend Implementation Plan - Card Rewards Optimizer

## Current Frontend Architecture

### Technology Stack
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom components (shadcn/ui architecture)
- **State Management**: Zustand
- **Features**: Drag & drop (dnd-kit), dark mode (next-themes)

### Current Component Structure
```
src/
├── app/           # Next.js app directory
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and configurations
├── stores/        # Zustand state management
└── types/         # TypeScript type definitions
```

## Phase 1 Frontend Implementation

### Task 1: Enhanced Purchase Input Interface
**Timeline**: 2-3 days

#### 1.1 Smart Purchase Input Component
**File**: `src/components/PurchaseInput.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PurchaseInputProps {
  onRecommendation: (data: RecommendationRequest) => void;
  loading?: boolean;
}

interface RecommendationRequest {
  description: string;
  amount?: number;
  date?: string;
}

export function PurchaseInput({ onRecommendation, loading }: PurchaseInputProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onRecommendation({
      description: description.trim(),
      amount: amount ? parseFloat(amount) : undefined,
      date: date || undefined
    });
  };

  const suggestedPurchases = [
    'Booking a hotel in NYC',
    'Dinner at Italian restaurant',
    'Groceries at Whole Foods',
    'Gas at Shell station',
    'Flight to Los Angeles',
    'Coffee at Starbucks'
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Find Your Best Credit Card</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Purchase Description</Label>
            <Input
              id="description"
              placeholder="e.g., booking a hotel in New York"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-lg"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (optional)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="$0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date (optional)</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!description.trim() || loading}
          >
            {loading ? 'Analyzing...' : 'Get Recommendation'}
          </Button>
        </form>

        {/* Quick suggestions */}
        <div className="mt-6">
          <Label className="text-sm text-muted-foreground">Quick examples:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestedPurchases.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setDescription(suggestion)}
                disabled={loading}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 1.2 Recommendation Results Display
**File**: `src/components/RecommendationResults.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  DollarSign 
} from 'lucide-react';

interface RecommendationResultsProps {
  results: RecommendationResponse;
  onNewSearch: () => void;
}

interface RecommendationResponse {
  category: string;
  confidence: number;
  source: string;
  recommendations: CardRecommendation[];
  alternatives: CardRecommendation[];
  metadata: {
    description: string;
    amount?: number;
    date: string;
    cardsAnalyzed: number;
  };
}

interface CardRecommendation {
  cardId: string;
  cardName: string;
  issuer: string;
  annualFee: number;
  effectiveRate: number;
  rewardValue: string;
  reasoning: string;
  conditions: string[];
  capStatus?: {
    remaining: number | null;
    total: number | null;
  };
  category: string;
}

export function RecommendationResults({ results, onNewSearch }: RecommendationResultsProps) {
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

  return (
    <div className="space-y-6">
      {/* Category Detection Results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Purchase Analysis</CardTitle>
            <Button variant="outline" size="sm" onClick={onNewSearch}>
              New Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <Badge variant="secondary" className="mt-1">
                {results.category}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress 
                  value={results.confidence * 100} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium">
                  {(results.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <Badge 
                variant={results.source === 'openai' ? 'default' : 'outline'}
                className="mt-1"
              >
                {results.source}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>"{results.metadata.description}"</strong>
              {results.metadata.amount && (
                <span> • ${results.metadata.amount.toFixed(2)}</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Recommendation */}
      {topRecommendation && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Best Card for This Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg">{topRecommendation.cardName}</h3>
                <p className="text-muted-foreground">{topRecommendation.issuer}</p>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Reward Rate:</span>
                    <span className="font-semibold">
                      {topRecommendation.effectiveRate}%
                    </span>
                  </div>
                  {results.metadata.amount && (
                    <div className="flex justify-between">
                      <span>Reward Value:</span>
                      <span className="font-semibold text-green-600">
                        ${topRecommendation.rewardValue}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Annual Fee:</span>
                    <span className={topRecommendation.annualFee === 0 ? 'text-green-600' : ''}>
                      ${topRecommendation.annualFee}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Details</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {topRecommendation.reasoning}
                </p>

                {topRecommendation.conditions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-600">Conditions:</p>
                    {topRecommendation.conditions.map((condition, index) => (
                      <p key={index} className="text-xs text-amber-700 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {condition}
                      </p>
                    ))}
                  </div>
                )}

                {topRecommendation.capStatus && topRecommendation.capStatus.total && (
                  <div className="mt-3">
                    <p className="text-sm font-medium">Spending Cap Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress 
                        value={
                          ((topRecommendation.capStatus.total - (topRecommendation.capStatus.remaining || 0)) / 
                           topRecommendation.capStatus.total) * 100
                        }
                        className="flex-1 h-2"
                      />
                      <span className="text-xs">
                        ${topRecommendation.capStatus.remaining} left
                      </span>
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
            <CardTitle>Alternative Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.alternatives.map((card, index) => (
                <div key={card.cardId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{card.cardName}</h4>
                    <p className="text-sm text-muted-foreground">{card.issuer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{card.effectiveRate}%</p>
                    {results.metadata.amount && (
                      <p className="text-sm text-green-600">${card.rewardValue}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {results.recommendations.length}
              </p>
              <p className="text-sm text-muted-foreground">Recommendations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {topRecommendation?.effectiveRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Best Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {results.metadata.cardsAnalyzed}
              </p>
              <p className="text-sm text-muted-foreground">Cards Analyzed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {getConfidenceText(results.confidence)}
              </p>
              <p className="text-sm text-muted-foreground">Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 2: Card Management Interface
**Timeline**: 2-3 days

#### 2.1 Card Selection Interface
**File**: `src/components/CardSelector.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter } from 'lucide-react';

interface CardSelectorProps {
  selectedCards: string[];
  onCardSelectionChange: (cardIds: string[]) => void;
}

interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  network: string;
  annual_fee: number;
  image_url?: string;
  rewards: CardReward[];
}

interface CardReward {
  category: string;
  multiplier: number;
  cap?: number;
  portal_only: boolean;
  notes: string;
}

export function CardSelector({ selectedCards, onCardSelectionChange }: CardSelectorProps) {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [issuerFilter, setIssuerFilter] = useState('');
  const [feeFilter, setFeeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, [searchTerm, issuerFilter, feeFilter]);

  const fetchCards = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (issuerFilter) params.append('issuer', issuerFilter);
    if (feeFilter) params.append('annual_fee', feeFilter);

    try {
      const response = await fetch(`/api/cards?${params}`);
      const data = await response.json();
      setCards(data.cards || []);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardToggle = (cardId: string) => {
    const updated = selectedCards.includes(cardId)
      ? selectedCards.filter(id => id !== cardId)
      : [...selectedCards, cardId];
    
    onCardSelectionChange(updated);
  };

  const getTopRewardRate = (card: CreditCard) => {
    return Math.max(...card.rewards.map(r => r.multiplier), 1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Credit Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={issuerFilter}
              onChange={(e) => setIssuerFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">All Issuers</option>
              <option value="Chase">Chase</option>
              <option value="American Express">American Express</option>
              <option value="Bank of America">Bank of America</option>
              <option value="Capital One">Capital One</option>
            </select>

            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">All Fees</option>
              <option value="0">No Annual Fee</option>
              <option value="<100">Under $100</option>
              <option value=">=100">$100+</option>
            </select>
          </div>

          {selectedCards.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Selected: {selectedCards.length} cards
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCardSelectionChange([])}
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card 
            key={card.id} 
            className={`cursor-pointer transition-all ${
              selectedCards.includes(card.id) 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleCardToggle(card.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">
                    {card.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{card.issuer}</p>
                </div>
                <Checkbox
                  checked={selectedCards.includes(card.id)}
                  onChange={() => handleCardToggle(card.id)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Annual Fee:</span>
                  <Badge variant={card.annual_fee === 0 ? 'secondary' : 'outline'}>
                    ${card.annual_fee}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Top Rate:</span>
                  <Badge variant="default">
                    {getTopRewardRate(card)}x
                  </Badge>
                </div>

                {card.rewards.slice(0, 2).map((reward, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    {reward.multiplier}x on {reward.category}
                    {reward.cap && ` (cap: $${reward.cap})`}
                  </div>
                ))}

                {card.rewards.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{card.rewards.length - 2} more categories
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading cards...</p>
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No cards found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
```

### Task 3: Main Application Layout
**Timeline**: 1-2 days

#### 3.1 Main Page Component
**File**: `src/app/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { PurchaseInput } from '@/components/PurchaseInput';
import { RecommendationResults } from '@/components/RecommendationResults';
import { CardSelector } from '@/components/CardSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCardStore } from '@/stores/cardStore';

export default function HomePage() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const { selectedCards, setSelectedCards } = useCardStore();

  const handleRecommendation = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/recommend-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const results = await response.json();
      setRecommendations(results);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setRecommendations(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Card Rewards Optimizer
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Find the best credit card for every purchase
          </p>
        </div>

        <Tabs defaultValue="recommend" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="recommend">Get Recommendation</TabsTrigger>
            <TabsTrigger value="cards">Manage Cards</TabsTrigger>
          </TabsList>

          <TabsContent value="recommend" className="mt-8">
            {!recommendations ? (
              <PurchaseInput 
                onRecommendation={handleRecommendation}
                loading={loading}
              />
            ) : (
              <RecommendationResults
                results={recommendations}
                onNewSearch={handleNewSearch}
              />
            )}
          </TabsContent>

          <TabsContent value="cards" className="mt-8">
            <CardSelector
              selectedCards={selectedCards}
              onCardSelectionChange={setSelectedCards}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

#### 3.2 Zustand Store
**File**: `src/stores/cardStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CardStore {
  selectedCards: string[];
  setSelectedCards: (cards: string[]) => void;
  addCard: (cardId: string) => void;
  removeCard: (cardId: string) => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set, get) => ({
      selectedCards: [],
      setSelectedCards: (cards) => set({ selectedCards: cards }),
      addCard: (cardId) => set((state) => ({
        selectedCards: [...state.selectedCards, cardId]
      })),
      removeCard: (cardId) => set((state) => ({
        selectedCards: state.selectedCards.filter(id => id !== cardId)
      }))
    }),
    {
      name: 'card-selection-storage'
    }
  )
);
```

## UI Component Requirements

### Existing shadcn/ui Components Needed
```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add select
```

### Custom Components to Create
1. **LoadingSpinner** - For async operations
2. **ErrorBoundary** - For error handling
3. **EmptyState** - For no results scenarios
4. **ConfidenceIndicator** - Visual confidence display
5. **RewardRateDisplay** - Consistent reward rate formatting

## State Management Strategy

### Zustand Stores
1. **cardStore** - Selected cards management
2. **recommendationStore** - Recommendation results cache
3. **userStore** - User preferences and settings

### API Integration
- Custom hooks for API calls
- Error handling and retry logic
- Loading states and optimistic updates
- Response caching for performance

## Responsive Design Requirements

### Mobile-First Approach
- Touch-friendly interface
- Optimized input fields
- Collapsed sidebar navigation
- Swipe gestures for card browsing

### Desktop Enhancements
- Multi-column layouts
- Hover interactions
- Keyboard shortcuts
- Advanced filtering options

## Accessibility Features

### WCAG 2.1 Compliance
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation
- Screen reader optimization
- Color contrast compliance
- Focus management

## Performance Optimization

### Core Web Vitals
- Lazy loading for card images
- Virtual scrolling for large card lists
- Debounced search inputs
- Optimized bundle size
- Progressive loading

### Caching Strategy
- API response caching
- Image optimization
- Static asset caching
- Service worker implementation

## Next Steps After Phase 1

1. **Advanced Visualizations**: Interactive coverage heatmap
2. **Analytics Dashboard**: Spending insights and trends
3. **Notification System**: Cap alerts and recommendations
4. **Card Comparison Tool**: Side-by-side analysis
5. **Export Features**: PDF reports and data export

This frontend implementation provides an intuitive, responsive, and accessible interface for the card rewards optimization system.