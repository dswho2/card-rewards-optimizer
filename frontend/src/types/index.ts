// src/types/index.ts

export type Category =
  | 'Grocery'
  | 'Dining'
  | 'Gas'
  | 'Travel'
  | 'Online'
  | 'Entertainment'
  | 'Transit'
  | 'Healthcare'
  | 'Utilities'
  | 'Insurance'
  | 'Other'
  | 'All';

export interface Reward {
  category: Category;
  multiplier: number;
  reward_type?: string;
  cap?: number | null;
  portal_only?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string;
}

export interface Card {
  id: string;
  name: string;
  image_url: string;
  rewards: Reward[];
  annual_fee: number;
  notes?: string;
  issuer?: string;
  network?: string;
}

// Backend recommendation response types
export interface CardRecommendation {
  cardId: string;
  cardName: string;
  issuer: string;
  network?: string;
  annualFee: number;
  imageUrl?: string;
  effectiveRate: number;
  rewardValue: string;
  reasoning: string;
  conditions: string[];
  capStatus?: {
    remaining: number | null;
    total: number | null;
    percentage: number;
  };
  category: string;
  multiplier: number;
  simplicity: number;
  totalValue: number;
}

export interface RecommendationResponse {
  category: string;
  confidence: number;
  source: string;
  reasoning?: string;
  recommendations: CardRecommendation[];
  alternatives: CardRecommendation[];
  metadata: {
    description: string;
    amount?: number;
    date: string;
    cardsAnalyzed: number;
    processingTime?: number | null;
  };
  details?: {
    topScore?: number;
    matchCount?: number;
    allScores?: Record<string, string>;
  };
}
