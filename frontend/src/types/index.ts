// src/types/index.ts
export interface Card {
    id: string;
    name: string;
    image: string;
    rewards: Rewards;
    annualFee: string;
    notes: string;
}

export interface Rewards {
    All? : number;
    Grocery?: number;
    Dining?: number;
    Gas?: number;
    Travel?: number;
    Online?: number;
    Entertainment?: number;
    Transit?: number;
    Utilities?: number;
}